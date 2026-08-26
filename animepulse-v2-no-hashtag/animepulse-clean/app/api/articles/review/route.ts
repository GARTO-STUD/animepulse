/**
 * POST /api/articles/review — Admin: update article status, delete, edit
 * Auth: httpOnly session cookie (set by /api/admin-auth)
 * Fallback: x-review-password header (legacy, kept for cron compatibility)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseToken, fsPatch, fsDelete, fsGet, fsSet,
  verifyAdminPassword,
} from '@/lib/firebase-rest';
import { verifySession } from '@/lib/session';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';
const CORS = {
  'Access-Control-Allow-Origin': APP_URL,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-review-password',
  'Vary': 'Origin',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function POST(req: NextRequest) {
  // Auth: session cookie (primary) OR x-review-password header (cron/legacy fallback)
  const sessionToken = req.cookies.get('admin_session')?.value;
  const headerPw     = req.headers.get('x-review-password');
  const authed       = (await verifySession(sessionToken)) || verifyAdminPassword(headerPw);

  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500, headers: CORS });

  try {
    const sa = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid = sa.project_id;

    const body = await req.json() as {
      action?: string;
      id?: string;
      status?: 'published' | 'rejected' | 'draft';
      // Edit fields
      title?: string;
      content?: string;
      summary?: string;
      tags?: string[];
      editorialNote?: string;
      // Restore version
      versionIndex?: number;
    };

    const { id, action = 'updateStatus', status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing article id' }, { status: 400, headers: CORS });
    }

    // ── Delete ─────────────────────────────────────────────────────────────
    if (action === 'delete') {
      await fsDelete(pid, token, `articles/${id}`);
      return NextResponse.json({ ok: true, action: 'deleted', id }, { headers: CORS });
    }

    // ── Update Status ──────────────────────────────────────────────────────
    if (action === 'updateStatus' || action === 'publish' || action === 'reject') {
      if (!status || !['published', 'rejected', 'draft'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400, headers: CORS });
      }

      // Verify article exists
      const existing = await fsGet(pid, token, `articles/${id}`);
      if (!existing) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: CORS });
      }

      await fsPatch(pid, token, `articles/${id}`, {
        status,
        reviewedAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, id, status }, { headers: CORS });
    }

    // ── Edit Article (with versioning) ────────────────────────────────────
    if (action === 'edit') {
      // 1. Fetch current article to snapshot it
      const current = await fsGet(pid, token, `articles/${id}`);
      if (!current) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: CORS });
      }

      // 2. Build snapshot of the version being replaced
      const snapshot = {
        title:         current.title         as string,
        content:       current.content       as string,
        summary:       current.summary       as string,
        tags:          current.tags          as string[],
        editorialNote: current.editorialNote as string | undefined,
        editedAt:      new Date().toISOString(),
      };

      // 3. Prepend snapshot to history, keep max 10 versions
      const prevHistory = (current.history as typeof snapshot[] | undefined) || [];
      const newHistory  = [snapshot, ...prevHistory].slice(0, 10);

      // 4. Build the updates object — only include fields that were provided
      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
        history:   newHistory,
      };
      if (body.title   !== undefined) updates.title   = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.summary !== undefined) updates.summary = body.summary;
      if (body.tags    !== undefined) updates.tags    = body.tags;
      if (body.editorialNote !== undefined) updates.editorialNote = body.editorialNote;

      await fsPatch(pid, token, `articles/${id}`, updates);

      return NextResponse.json(
        { ok: true, id, action: 'edited', versionsKept: newHistory.length },
        { headers: CORS }
      );
    }

    // ── Restore Article Version ────────────────────────────────────────────
    if (action === 'restoreVersion') {
      const { versionIndex } = body as { versionIndex?: number };
      if (versionIndex === undefined || versionIndex < 0) {
        return NextResponse.json({ error: 'Missing versionIndex' }, { status: 400, headers: CORS });
      }

      const current = await fsGet(pid, token, `articles/${id}`);
      if (!current) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404, headers: CORS });
      }

      const history = (current.history as Array<{
        title: string; content: string; summary: string;
        tags: string[]; editorialNote?: string; editedAt: string;
      }> | undefined) || [];

      const target = history[versionIndex];
      if (!target) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404, headers: CORS });
      }

      // Snapshot current before restoring
      const currentSnapshot = {
        title:         current.title         as string,
        content:       current.content       as string,
        summary:       current.summary       as string,
        tags:          current.tags          as string[],
        editorialNote: current.editorialNote as string | undefined,
        editedAt:      new Date().toISOString(),
      };
      const newHistory = [currentSnapshot, ...history].slice(0, 10);

      await fsPatch(pid, token, `articles/${id}`, {
        title:         target.title,
        content:       target.content,
        summary:       target.summary,
        tags:          target.tags,
        editorialNote: target.editorialNote,
        updatedAt:     new Date().toISOString(),
        history:       newHistory,
      });

      return NextResponse.json(
        { ok: true, id, action: 'restored', restoredFrom: target.editedAt },
        { headers: CORS }
      );
    }

    // ── Toggle AutoPilot ───────────────────────────────────────────────────
    if (action === 'toggleAutopilot') {
      const current = await fsGet(pid, token, 'meta/autopilot-config');
      const enabled = !(current?.enabled as boolean ?? true);
      await fsSet(pid, token, 'meta/autopilot-config', {
        enabled,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, autopilotEnabled: enabled }, { headers: CORS });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: CORS });
  } catch {    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS });
  }
        }
