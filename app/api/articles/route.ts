/**
 * GET /api/articles — Edge Runtime (Cloudflare Pages compatible)
 * Uses Firebase REST API instead of firebase-admin (Node.js-only SDK)
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getFirebaseToken(saJson: string): Promise<string> {
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const b64 = (s: string) => btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const h = b64(JSON.stringify({ alg:'RS256', typ:'JWT' }));
  const p = b64(JSON.stringify({ iss:sa.client_email, sub:sa.client_email, aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3600, scope:'https://www.googleapis.com/auth/datastore' }));
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem),c=>c.charCodeAt(0)), { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['sign']);
  const sig = b64(String.fromCharCode(...new Uint8Array((await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${h}.${p}`))) as ArrayBuffer)));
  const res = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${h}.${p}.${sig}` });
  return ((await res.json()) as {access_token:string}).access_token;
}

function fsVal(v: unknown): unknown {
  if (!v||typeof v!=='object') return null;
  const o = v as Record<string,unknown>;
  if ('stringValue' in o) return o.stringValue;
  if ('integerValue' in o) return Number(o.integerValue);
  if ('doubleValue' in o) return o.doubleValue;
  if ('booleanValue' in o) return o.booleanValue;
  if ('nullValue' in o) return null;
  if ('arrayValue' in o) return ((o.arrayValue as {values?:unknown[]}).values||[]).map(fsVal);
  if ('mapValue' in o) { const f=(o.mapValue as {fields?:Record<string,unknown>}).fields||{}; return Object.fromEntries(Object.entries(f).map(([k,x])=>[k,fsVal(x)])); }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit')||'20'),100);
  const source = searchParams.get('source');
  const tag = searchParams.get('tag');
  const type = searchParams.get('type');
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson) return NextResponse.json({ error:'FIREBASE_SERVICE_ACCOUNT_KEY not set' },{ status:500 });
  try {
    const sa = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const base = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
    if (type==='trending') {
      const r = await fetch(`${base}/meta/trending`,{ headers:{ Authorization:`Bearer ${token}` } });
      if (r.ok) { const d=(await r.json()) as {fields?:Record<string,unknown>}; return NextResponse.json(d.fields?Object.fromEntries(Object.entries(d.fields).map(([k,v])=>[k,fsVal(v)])):{ anime:[],analysis:'',updatedAt:null },{ headers:CORS }); }
      return NextResponse.json({ anime:[],analysis:'',updatedAt:null },{ headers:CORS });
    }
    const fetchLimit = source||tag ? 200 : limit;
    const qRes = await fetch(`${base}:runQuery`,{ method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body:JSON.stringify({ structuredQuery:{ from:[{collectionId:'articles'}], orderBy:[{field:{fieldPath:'publishedAt'},direction:'DESCENDING'}], limit:fetchLimit } }) });
    const rows = (await qRes.json()) as Array<{document?:{fields:Record<string,unknown>}}>;
    let articles = rows.filter(r=>r.document?.fields).map(r=>Object.fromEntries(Object.entries(r.document!.fields).map(([k,v])=>[k,fsVal(v)])));
    if (source) articles = articles.filter(a=>a.sourceType===source);
    if (tag) articles = articles.filter(a=>Array.isArray(a.tags)&&(a.tags as string[]).includes(tag));
    return NextResponse.json({ articles:articles.slice(0,limit), total:articles.length },{ headers:CORS });
  } catch(e) {
    return NextResponse.json({ error:String(e) },{ status:500 });
  }
}

export async function OPTIONS() {
  return new Response(null,{ status:204, headers:CORS });
}
