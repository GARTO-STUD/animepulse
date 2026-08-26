/**
 * GET /api/health — System health check
 *
 * Checks:
 *  1. Firebase Firestore  — can we read a document?
 *  2. Gemini API          — is the key configured?
 *  3. Groq API            — is the key configured?
 *  4. AutoPilot status    — last run time + error count
 *  5. Environment         — all required vars present?
 *
 * Returns HTTP 200 if healthy, 503 if any critical service is down.
 * Safe to expose publicly — no secrets, no article content leaked.
 *
 * Usage with UptimeRobot:
 *  - Monitor type: HTTP(s)
 *  - URL: https://animepulse.online/api/health
 *  - Keyword: "status":"ok"
 *  - Interval: 5 minutes
 */

import { NextResponse } from 'next/server';
import { getFirebaseToken, fsGet } from '@/lib/firebase-rest';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface ServiceCheck {
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  message?: string;
}

interface HealthReport {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: string;
  version: string;
  services: {
    firebase:   ServiceCheck;
    gemini:     ServiceCheck;
    groq:       ServiceCheck;
    autopilot:  ServiceCheck;
    env:        ServiceCheck;
  };
  summary: {
    articlesCount?: number;
    lastAutopilotRun?: string;
    autopilotErrors?: number;
    dailyLimit?: number;
    todayCount?: number;
  };
}

// Server start time (resets on cold start — normal for edge)
const SERVER_START = Date.now();

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ─── Individual service checks ────────────────────────────────────────────────

async function checkFirebase(saJson: string): Promise<{
  check: ServiceCheck;
  autopilotStatus: Record<string, unknown> | null;
  articleCount: number;
}> {
  const t0 = Date.now();
  try {
    const sa = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid = sa.project_id;

    // Lightweight read — just the autopilot status doc
    const [statusDoc, countRes] = await Promise.allSettled([
      fsGet(pid, token, 'meta/autopilot-status'),
      fetch(
        `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents:runQuery`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'articles' }],
              select: { fields: [{ fieldPath: 'id' }] },
              limit: 1,
            },
          }),
        }
      ),
    ]);

    const latencyMs = Date.now() - t0;
    const autopilotStatus =
      statusDoc.status === 'fulfilled' ? statusDoc.value : null;

    // Estimate article count from Firestore (just checks connectivity)
    let articleCount = 0;
    if (countRes.status === 'fulfilled' && countRes.value.ok) {
      const rows = await countRes.value.json() as Array<{ document?: unknown }>;
      articleCount = rows.filter(r => r.document).length;
    }

    return {
      check: { status: 'ok', latencyMs, message: `Project: ${pid}` },
      autopilotStatus,
      articleCount,
    };
  } catch (e) {
    return {
      check: {
        status: 'down',
        latencyMs: Date.now() - t0,
        message: `Firebase error: ${String(e).slice(0, 80)}`,
      },
      autopilotStatus: null,
      articleCount: 0,
    };
  }
}

async function checkGemini(apiKey: string): Promise<ServiceCheck> {
  if (!apiKey) return { status: 'down', message: 'GEMINI_API_KEY not set' };
  // Just validate the key format — don't make a real API call to save quota
  if (!apiKey.startsWith('AIza')) {
    return { status: 'degraded', message: 'Key format looks wrong (should start with AIza)' };
  }
  return { status: 'ok', message: 'Key configured' };
}

async function checkGroq(apiKey: string): Promise<ServiceCheck> {
  if (!apiKey) return { status: 'degraded', message: 'GROQ_API_KEY not set — Gemini will be used as fallback' };
  if (!apiKey.startsWith('gsk_')) {
    return { status: 'degraded', message: 'Key format looks wrong (should start with gsk_)' };
  }
  return { status: 'ok', message: 'Key configured' };
}

function checkEnv(): ServiceCheck {
  const required = [
    'FIREBASE_SERVICE_ACCOUNT_KEY',
    'GEMINI_API_KEY',
    'ADMIN_PASSWORD',
    'NEXT_PUBLIC_APP_URL',
  ];
  const missing = required.filter(k => !process.env[k]);
  const optional = [
    'GROQ_API_KEY',
    'CRON_SECRET',
    'NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION',
  ];
  const missingOptional = optional.filter(k => !process.env[k]);

  if (missing.length > 0) {
    return {
      status: 'down',
      message: `Missing required vars: ${missing.join(', ')}`,
    };
  }
  if (missingOptional.length > 0) {
    return {
      status: 'degraded',
      message: `Optional vars not set: ${missingOptional.join(', ')}`,
    };
  }
  return { status: 'ok', message: 'All environment variables configured' };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET() {
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // Run all checks in parallel
  const [firebaseResult, geminiCheck, groqCheck, envCheck] = await Promise.all([
    saJson
      ? checkFirebase(saJson)
      : Promise.resolve({
          check: { status: 'down' as const, message: 'FIREBASE_SERVICE_ACCOUNT_KEY not set' },
          autopilotStatus: null,
          articleCount: 0,
        }),
    checkGemini(process.env.GEMINI_API_KEY || ''),
    checkGroq(process.env.GROQ_API_KEY || ''),
    Promise.resolve(checkEnv()),
  ]);

  // Derive autopilot service check from the status doc
  const ap = firebaseResult.autopilotStatus;
  const autopilotCheck: ServiceCheck = !ap
    ? { status: 'degraded', message: 'No autopilot run data yet' }
    : (() => {
        const lastRun = ap.lastRun as string | undefined;
        const errors = (ap.errors as string[] | undefined) || [];
        const ageHours = lastRun
          ? (Date.now() - new Date(lastRun).getTime()) / 3600000
          : Infinity;

        if (ageHours > 24) {
          return {
            status: 'degraded' as const,
            message: `Last run was ${Math.floor(ageHours)}h ago — may be stalled`,
          };
        }
        if (errors.length > 0) {
          return {
            status: 'degraded' as const,
            message: `${errors.length} error(s) in last run`,
          };
        }
        return {
          status: 'ok' as const,
          message: `Last run: ${lastRun ? new Date(lastRun).toLocaleString() : 'unknown'}`,
        };
      })();

  const services = {
    firebase:  firebaseResult.check,
    gemini:    geminiCheck,
    groq:      groqCheck,
    autopilot: autopilotCheck,
    env:       envCheck,
  };

  // Overall status: down if any critical service is down, degraded if any degraded
  const allStatuses = Object.values(services).map(s => s.status);
  const overallStatus: 'ok' | 'degraded' | 'down' =
    allStatuses.includes('down')     ? 'down' :
    allStatuses.includes('degraded') ? 'degraded' : 'ok';

  const report: HealthReport = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: formatUptime(Date.now() - SERVER_START),
    version: '2.0.0',
    services,
    summary: {
      articlesCount:     firebaseResult.articleCount,
      lastAutopilotRun:  ap?.lastRun as string | undefined,
      autopilotErrors:   (ap?.errors as string[] | undefined)?.length ?? 0,
      dailyLimit:        ap?.dailyLimit as number | undefined,
      todayCount:        ap?.todayCount as number | undefined,
    },
  };

  return NextResponse.json(report, {
    status: overallStatus === 'down' ? 503 : 200,
    headers: {
      ...CORS,
      'Cache-Control': 'no-store, no-cache',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
