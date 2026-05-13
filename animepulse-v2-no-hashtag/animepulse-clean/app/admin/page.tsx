'use client';

/**
 * /admin — AnimePulse Admin Dashboard
 * 
 * Features:
 *  - Password-protected login
 *  - Article management: list, approve, reject, edit, delete
 *  - AutoPilot controls: run, toggle on/off, view stats
 *  - Real-time stats: total, pending, published, avg quality score
 *  - Filter by status
 *  - Inline content editing
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from '@/components/Toast';
import { AdminArticleSkeleton } from '@/components/Skeleton';
import {
  CheckCircle, XCircle, Eye, Clock, RefreshCw,
  Trash2, BarChart2, Zap, Newspaper, TrendingUp, AlertCircle,
  Edit3, Save, X, Play, Pause, ChevronDown, ChevronUp,
  Shield, Activity, Star,
} from 'lucide-react';

interface ArticleVersion {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  editorialNote?: string;
  editedAt: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  publishedAt: string;
  tags: string[];
  readTime?: number;
  status?: 'draft' | 'published' | 'rejected';
  editorialNote?: string;
  verdict?: string;
  qualityScore?: number;
  updatedAt?: string;
  history?: ArticleVersion[];
  scoreBreakdown?: {
    sourceCredibility: number;
    recency: number;
    keywords: number;
    titleQuality: number;
    total: number;
  };
}

interface AutopilotStatus {
  lastRun?: string;
  articlesAdded?: number;
  skippedScore?: number;
  skippedDuplicate?: number;
  todayCount?: number;
  dailyLimit?: number;
  publishThreshold?: number;
  errors?: string[];
}

interface Stats {
  total: number;
  draft: number;
  published: number;
  rejected: number;
  avgScore: number;
}

type FilterType = 'draft' | 'published' | 'rejected' | 'all';

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-green-500/15 text-green-400 border-green-500/30' :
    score >= 55 ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
    'bg-red-500/15 text-red-400 border-red-500/30';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}
    </span>
  );
}

// ─── Score Tooltip ────────────────────────────────────────────────────────────

function ScoreDetails({ breakdown }: { breakdown: Article['scoreBreakdown'] }) {
  const [open, setOpen] = useState(false);
  if (!breakdown) return null;
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-[#64748b] hover:text-[#0f172a] flex items-center gap-1"
      >
        <BarChart2 className="w-3 h-3" /> breakdown {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="absolute top-6 left-0 z-50 bg-white border border-[#e2e8f4] rounded-xl p-3 min-w-[200px] text-xs shadow-xl">
          <div className="space-y-1.5">
            {[
              { label: 'Source', value: breakdown.sourceCredibility, max: 30 },
              { label: 'Recency', value: breakdown.recency, max: 25 },
              { label: 'Keywords', value: breakdown.keywords, max: 30 },
              { label: 'Title Quality', value: breakdown.titleQuality, max: 15 },
            ].map(({ label, value, max }) => (
              <div key={label}>
                <div className="flex justify-between text-[#64748b] mb-0.5">
                  <span>{label}</span>
                  <span>{value}/{max}</span>
                </div>
                <div className="h-1.5 bg-[#e2e8f4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#e85d04] rounded-full"
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-1 border-t border-[#e2e8f4] flex justify-between font-bold text-[#0f172a]">
              <span>Total</span>
              <span>{breakdown.total}/100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  article,
  onSave,
  onClose,
}: {
  article: Article;
  onSave: (updated: Partial<Article>) => void;
  onClose: () => void;
}) {
  const [tab, setTab]               = useState<'edit' | 'history'>('edit');
  const [title, setTitle]           = useState(article.title);
  const [summary, setSummary]       = useState(article.summary);
  const [editorialNote, setNote]    = useState(article.editorialNote || '');
  const [tags, setTags]             = useState((article.tags || []).join(', '));
  const [saving, setSaving]         = useState(false);
  const [restoring, setRestoring]   = useState<number | null>(null);
  const [localToast, setLocalToast]   = useState('');
  const history = article.history || [];

  function showToast(msg: string) {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(''), 3000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'edit',
          id: article.id,
          title,
          summary,
          editorialNote,
          tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json() as { ok?: boolean; versionsKept?: number };
      if (data.ok) {
        onSave({
          title, summary, editorialNote,
          tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        });
        showToast(`✅ Saved — ${data.versionsKept || 0} version(s) stored`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(idx: number) {
    setRestoring(idx);
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'restoreVersion', id: article.id, versionIndex: idx }),
      });
      const data = await res.json() as { ok?: boolean; restoredFrom?: string };
      if (data.ok) {
        const v = history[idx];
        setTitle(v.title);
        setSummary(v.summary);
        setTags((v.tags || []).join(', '));
        setNote(v.editorialNote || '');
        setTab('edit');
        showToast(`↩️ Restored version from ${new Date(data.restoredFrom || '').toLocaleString()}`);
        onSave({ title: v.title, summary: v.summary, tags: v.tags });
      }
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#e2e8f4] rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
          <h2 className="text-[#0f172a] font-bold text-sm">Edit Article</h2>
          <button onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 mt-4 flex-shrink-0">
          {(['edit', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                tab === t
                  ? 'bg-[#e85d04]/20 text-[#e85d04] border border-[#e85d04]/30'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              {t === 'history' && (
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black ${
                  history.length > 0 ? 'bg-[#e85d04]/20 text-[#e85d04]' : 'bg-[#e2e8f4] text-[#64748b]'
                }`}>
                  {history.length}
                </span>
              )}
              {t === 'edit' ? '✏️ Edit' : '🕐 History'}
            </button>
          ))}
        </div>

        {/* Toast */}
        {localToast && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-medium flex-shrink-0">
            {localToast}
          </div>
        )}

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#64748b] mb-1 block">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-[#e2e8f4] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:border-[#e85d04]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b] mb-1 block">Summary (SEO)</label>
                <textarea
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  rows={3}
                  className="w-full bg-[#f8f9fc] border border-[#e2e8f4] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:border-[#e85d04]/50 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b] mb-1 block">Editorial Note</label>
                <input
                  value={editorialNote}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Quick take shown on article page…"
                  className="w-full bg-[#f8f9fc] border border-[#e2e8f4] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:border-[#e85d04]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#64748b] mb-1 block">Tags (comma separated)</label>
                <input
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full bg-[#f8f9fc] border border-[#e2e8f4] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:border-[#e85d04]/50"
                />
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3">🕐</div>
                  <p className="text-[#0f172a] font-bold text-sm mb-1">No edit history yet</p>
                  <p className="text-[#64748b] text-xs">Previous versions will appear here after you save changes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#64748b] mb-4">
                    {history.length} saved version{history.length > 1 ? 's' : ''} — up to 10 kept.
                    Click Restore to roll back to any version.
                  </p>
                  {history.map((v, i) => (
                    <div key={i} className="bg-[#f8f9fc] border border-[#e2e8f4] rounded-xl p-4 hover:border-[#e85d04]/20 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[#0f172a] text-xs font-bold line-clamp-1">{v.title}</p>
                          <p className="text-[#64748b] text-[10px] mt-0.5">
                            🕐 {new Date(v.editedAt).toLocaleString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestore(i)}
                          disabled={restoring === i}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#e85d04]/10 border border-[#e85d04]/20 text-[#e85d04] text-[10px] font-bold rounded-lg hover:bg-[#e85d04]/20 transition-colors disabled:opacity-50"
                        >
                          {restoring === i
                            ? <RefreshCw className="w-3 h-3 animate-spin" />
                            : '↩️'
                          }
                          Restore
                        </button>
                      </div>
                      <p className="text-[#64748b] text-[10px] line-clamp-2 leading-relaxed">{v.summary}</p>
                      {v.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {v.tags.slice(0, 4).map((tag: string) => (
                            <span key={tag} className="text-[9px] bg-[#e2e8f4] text-[#64748b] px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'edit' && (
          <div className="flex gap-3 px-6 pb-5 pt-3 border-t border-[#e2e8f4] flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#e85d04] to-[#f48c06] text-[#0f172a] font-bold rounded-xl disabled:opacity-50 text-sm"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-5 bg-[#f8f9fc] border border-[#e2e8f4] text-[#64748b] rounded-xl text-sm hover:text-[#0f172a] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [articles, setArticles]         = useState<Article[]>([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [password, setPassword]         = useState('');
  const [authed, setAuthed]             = useState(false);
  const [filter, setFilter]             = useState<FilterType>('draft');
  const [updating, setUpdating]         = useState<string | null>(null);
  const [runningPilot, setRunningPilot] = useState(false);
  const [pilotResult, setPilotResult]   = useState<string | null>(null);
  const [autopilotStatus, setAutopilotStatus] = useState<AutopilotStatus | null>(null);
  const [stats, setStats]               = useState<Stats>({ total: 0, draft: 0, published: 0, rejected: 0, avgScore: 0 });
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);

  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  async function checkAuth() {
    if (!password.trim()) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // receive httpOnly cookie
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthed(true);
        setPassword(''); // clear password from memory immediately
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Invalid credentials');
        setPassword('');
      }
    } catch {
      setAuthError('Connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [articlesRes, statusRes] = await Promise.all([
        fetch('/api/articles?limit=300&status=all'),
        fetch('/api/articles?type=autopilot-status'),
      ]);
      const articlesData = await articlesRes.json();
      const statusData = await statusRes.json();

      const all: Article[] = articlesData.articles || [];
      setArticles(all);
      setAutopilotStatus(statusData.status);

      const draft     = all.filter(a => a.status === 'draft').length;
      const published = all.filter(a => !a.status || a.status === 'published').length;
      const rejected  = all.filter(a => a.status === 'rejected').length;
      const scores    = all.map(a => a.qualityScore || 0).filter(s => s > 0);
      const avgScore  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      setStats({ total: all.length, draft, published, rejected, avgScore });
    } catch (e) {
      setLoadError(String(e));
    } finally { setLoading(false); }
  }, []);

  async function updateStatus(id: string, status: 'published' | 'rejected') {
    setUpdating(id);
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'updateStatus', id, status }),
      });
      if (res.ok) {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        toast.success(status === 'published' ? '✅ Article published!' : '🚫 Article rejected');
      } else {
        toast.error('Failed to update article status');
      }
    } catch { toast.error('Network error — try again'); }
    finally { setUpdating(null); }
  }

  async function deleteArticle(id: string) {
    if (!confirm('Permanently delete this article?')) return;
    setUpdating(id);
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== id));
        toast.success('🗑️ Article deleted');
      } else {
        toast.error('Failed to delete article');
      }
    } catch { toast.error('Network error — try again'); }
    finally { setUpdating(null); }
  }

  async function triggerAutoPilot() {
    setRunningPilot(true);
    setPilotResult(null);
    try {
      const res = await fetch('/api/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || '' },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        const msg = `Added ${data.added ?? 0} articles | Skipped: ${data.skippedScore ?? 0} (score) + ${data.skippedDuplicate ?? 0} (dupe)`;
        setPilotResult(`✅ ${msg}`);
        toast.success(`🤖 Auto-Pilot: ${msg}`);
      } else {
        const err = data.error || data.message || 'Unknown error';
        setPilotResult(`❌ ${err}`);
        toast.error(`Auto-Pilot failed: ${err}`);
      }
      await loadArticles();
    } catch (e) {
      setPilotResult(`❌ ${String(e)}`);
    } finally {
      setRunningPilot(false);
    }
  }

  async function toggleAutopilot() {
    try {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || '' },
        credentials: 'include',
        body: JSON.stringify({ action: 'toggleAutopilot', id: 'config' }),
      });
      const data = await res.json();
      setAutopilotEnabled(data.autopilotEnabled);
    } catch { /* non-critical */ }
  }

  function handleEditSave(updated: Partial<Article>) {
    if (!editingArticle) return;
    setArticles(prev =>
      prev.map(a => a.id === editingArticle.id ? { ...a, ...updated } : a)
    );
    setEditingArticle(null);
  }

  useEffect(() => { if (authed) loadArticles(); }, [authed, loadArticles]);

  // ── Login Screen ──────────────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-[#e2e8f4] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-[#e85d04]" />
          <h1 className="text-[#0f172a] font-bold text-lg">Admin Access</h1>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && checkAuth()}
          placeholder="Enter admin password"
          disabled={authLoading}
          className={`w-full bg-[#f8f9fc] border rounded-xl px-4 py-3 text-[#0f172a] text-sm focus:outline-none mb-3 ${
            authError ? 'border-red-500/60' : 'border-[#e2e8f4] focus:border-[#e85d04]/50'
          }`}
        />
        {authError && (
          <p className="text-red-400 text-xs mb-3 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{authError}
          </p>
        )}
        <button
          onClick={checkAuth}
          disabled={authLoading || !password.trim()}
          className="w-full py-3 bg-gradient-to-r from-[#e85d04] to-[#f48c06] text-[#0f172a] font-bold rounded-xl disabled:opacity-50 text-sm"
        >
          {authLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
          ) : 'Sign In'}
        </button>
      </div>
    </div>
  );

  const filtered = articles.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'draft') return a.status === 'draft' || !a.status;
    return a.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#0f172a]">
      {editingArticle && (
        <EditModal
          article={editingArticle}
          onSave={handleEditSave}
          onClose={() => setEditingArticle(null)}
        />
      )}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#0f172a]">Content Dashboard</h1>
            <p className="text-[#64748b] text-sm mt-1">AnimePulse Admin · {stats.total} total articles</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={toggleAutopilot} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${autopilotEnabled ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-[#e2e8f4] border-[#e2e8f4] text-[#64748b]'}`}>
              {autopilotEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              AutoPilot {autopilotEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={triggerAutoPilot} disabled={runningPilot} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e85d04] to-[#f48c06] text-[#0f172a] font-bold rounded-xl text-sm disabled:opacity-50">
              {runningPilot ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {runningPilot ? 'Running…' : 'Run AutoPilot'}
            </button>
            <button onClick={loadArticles} className="p-2 bg-[#e2e8f4] rounded-xl text-[#64748b] hover:text-[#0f172a]">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { setAuthed(false); document.cookie = 'admin_session=; Max-Age=0; path=/'; }} className="p-2 bg-[#e2e8f4] rounded-xl text-[#64748b] hover:text-[#0f172a]">
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>

        {pilotResult && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium border ${pilotResult.startsWith('✅') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {pilotResult}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: <Newspaper className="w-4 h-4" />, color: 'text-[#0f172a]' },
            { label: 'Pending', value: stats.draft, icon: <Clock className="w-4 h-4" />, color: 'text-yellow-400' },
            { label: 'Published', value: stats.published, icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-400' },
            { label: 'Avg Score', value: stats.avgScore, icon: <Star className="w-4 h-4" />, color: 'text-[#e85d04]' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white border border-[#e2e8f4] rounded-xl p-4">
              <div className={`flex items-center gap-2 text-xs text-[#64748b] mb-2`}>{icon}{label}</div>
              <div className={`text-2xl font-black ${color}`}>{loading ? '…' : value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['draft','published','rejected','all'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-[#e85d04]/20 text-[#e85d04] border border-[#e85d04]/30' : 'bg-white border border-[#e2e8f4] text-[#64748b] hover:text-[#0f172a]'}`}>
              {f === 'draft' ? 'Pending Review' : f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'draft' ? stats.draft : f === 'published' ? stats.published : f === 'rejected' ? stats.rejected : stats.total})
            </button>
          ))}
        </div>

        {loadError && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{loadError}</div>}

        {/* Articles */}
        <div className="space-y-4">
          {loading ? Array.from({length:3}).map((_,i) => <AdminArticleSkeleton key={i} />) :
           filtered.length === 0 ? (
            <div className="text-center py-16"><div className="text-4xl mb-4 text-green-400">✓</div><p className="text-[#0f172a] font-bold">Nothing here</p></div>
           ) : filtered.map(article => (
            <div key={article.id} className="bg-white border border-[#e2e8f4] rounded-2xl p-5 hover:border-[#e85d04]/20 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {article.qualityScore !== undefined && <ScoreBadge score={article.qualityScore} />}
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${article.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : article.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                      {article.status || 'draft'}
                    </span>
                  </div>
                  <h3 className="text-[#0f172a] font-bold text-sm leading-snug line-clamp-2">{article.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#64748b]">
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    {article.readTime && <span>{article.readTime}m read</span>}
                    <a href={article.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#0f172a] transition-colors"><Eye className="w-3 h-3" />Source</a>
                  </div>
                  {article.scoreBreakdown && <div className="mt-2"><ScoreDetails breakdown={article.scoreBreakdown} /></div>}
                </div>
              </div>
              {article.summary && <p className="text-[#64748b] text-xs line-clamp-2 mb-3 leading-relaxed">{article.summary}</p>}
              {article.editorialNote && <div className="mb-3 px-3 py-2 bg-[#e85d04]/5 border border-[#e85d04]/10 rounded-lg"><p className="text-[#e85d04] text-xs italic">"{article.editorialNote}"</p></div>}
              {article.tags?.length > 0 && <div className="flex gap-1.5 flex-wrap mb-4">{article.tags.slice(0,5).map(tag => <span key={tag} className="text-[10px] bg-[#e2e8f4] text-[#64748b] px-2.5 py-1 rounded-full">{tag}</span>)}</div>}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => updateStatus(article.id, 'published')} disabled={updating === article.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50">
                  <CheckCircle className="w-3 h-3" />Publish
                </button>
                <button onClick={() => updateStatus(article.id, 'rejected')} disabled={updating === article.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50">
                  <XCircle className="w-3 h-3" />Reject
                </button>
                <button onClick={() => setEditingArticle(article)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e2e8f4] border border-[#e2e8f4] text-[#64748b] text-xs font-bold rounded-lg hover:text-[#0f172a] transition-colors">
                  <Edit3 className="w-3 h-3" />Edit
                </button>
                <button onClick={() => deleteArticle(article.id)} disabled={updating === article.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50">
                  <Trash2 className="w-3 h-3" />Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* AutoPilot Stats */}
        {autopilotStatus && (
          <div className="mt-8 bg-white border border-[#e2e8f4] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-[#e85d04]" /><h2 className="text-[#0f172a] font-bold text-sm">AutoPilot Stats</h2></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#f8f9fc] rounded-xl p-3"><div className="text-[#64748b] mb-1">Today</div><div className="text-[#0f172a] font-bold">{autopilotStatus.todayCount ?? 0} / {autopilotStatus.dailyLimit ?? 5}</div></div>
              <div className="bg-[#f8f9fc] rounded-xl p-3"><div className="text-[#64748b] mb-1">Min Score</div><div className="text-[#e85d04] font-bold">Score ≥ {autopilotStatus.publishThreshold ?? 55}</div></div>
              <div className="bg-[#f8f9fc] rounded-xl p-3"><div className="text-[#64748b] mb-1">Skipped (score)</div><div className="text-yellow-400 font-bold">{autopilotStatus.skippedScore ?? 0}</div></div>
              <div className="bg-[#f8f9fc] rounded-xl p-3"><div className="text-[#64748b] mb-1">Skipped (dupe)</div><div className="text-blue-400 font-bold">{autopilotStatus.skippedDuplicate ?? 0}</div></div>
            </div>
            {autopilotStatus.lastRun && <p className="text-[#64748b] text-xs mt-3">Last run: {new Date(autopilotStatus.lastRun).toLocaleString()}</p>}
          </div>
        )}
      </div>
    </div>
  );
        }
