/**
 * POST/GET /api/autopilot — Edge Runtime (Cloudflare Pages compatible)
 * Uses Firebase REST API + Gemini directly (no firebase-admin)
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-cron-secret',
};

async function getFirebaseToken(saJson: string): Promise<string> {
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const b64 = (s: string) => btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const h = b64(JSON.stringify({ alg:'RS256', typ:'JWT' }));
  const p = b64(JSON.stringify({ iss:sa.client_email, sub:sa.client_email, aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3600, scope:'https://www.googleapis.com/auth/datastore' }));
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem),c=>c.charCodeAt(0)), { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['sign']);
  const sig = b64(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${h}.${p}`)))));
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

function toFsVal(v: unknown): unknown {
  if (v===null||v===undefined) return { nullValue:null };
  if (typeof v==='string') return { stringValue:v };
  if (typeof v==='boolean') return { booleanValue:v };
  if (typeof v==='number') return Number.isInteger(v)?{ integerValue:String(v) }:{ doubleValue:v };
  if (Array.isArray(v)) return { arrayValue:{ values:v.map(toFsVal) } };
  if (typeof v==='object') return { mapValue:{ fields:Object.fromEntries(Object.entries(v as Record<string,unknown>).map(([k,x])=>[k,toFsVal(x)])) } };
  return { stringValue:String(v) };
}

async function fsSet(projectId: string, token: string, path: string, data: Record<string,unknown>) {
  await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`, {
    method:'PATCH', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ fields:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,toFsVal(v)])) }),
  });
}

async function fsQuery(projectId: string, token: string, collection: string, limitN: number) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`, {
    method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ structuredQuery:{ from:[{collectionId:collection}], orderBy:[{field:{fieldPath:'publishedAt'},direction:'DESCENDING'}], limit:limitN } }),
  });
  const rows = (await res.json()) as Array<{document?:{fields:Record<string,unknown>}}>;
  return rows.filter(r=>r.document?.fields).map(r=>Object.fromEntries(Object.entries(r.document!.fields).map(([k,v])=>[k,fsVal(v)])));
}

async function fsBatchWrite(projectId: string, token: string, collection: string, docs: Record<string,unknown>[]) {
  const writes = docs.map(d=>({ update:{ name:`projects/${projectId}/databases/(default)/documents/${collection}/${d.id}`, fields:Object.fromEntries(Object.entries(d).map(([k,v])=>[k,toFsVal(v)])) } }));
  for (let i=0;i<writes.length;i+=500) {
    await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:batchWrite`, {
      method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body:JSON.stringify({ writes:writes.slice(i,i+500) }),
    });
  }
}

const RSS_SOURCES = [
  { name:'Anime News Network', url:'https://www.animenewsnetwork.com/news/rss.xml' },
  { name:'Crunchyroll News', url:'https://feeds.feedburner.com/crunchyroll/animenews' },
  { name:'MyAnimeList News', url:'https://myanimelist.net/rss/news.rss' },
  { name:'Otaku USA', url:'https://otakuusamagazine.com/feed/' },
];

function parseRSS(xml: string, srcName: string) {
  const items: {title:string;link:string;description:string;imageUrl?:string;source:string;sourceType:'rss'}[] = [];
  for (const item of (xml.match(/<item>[\s\S]*?<\/item>/g)||[]).slice(0,6)) {
    const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/title>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g,'').trim()||'';
    const link = item.match(/<link>([^<]*)<\/link>/i)?.[1]?.trim()||'';
    if (!title||!link) continue;
    const rawDesc = (item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/description>/i)?.[1]||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]*>/g,'').trim();
    const imgMatch = item.match(/<media:thumbnail[^>]+url="([^"]+)"/i)||item.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="image/i);
    items.push({ title, link, description:rawDesc.length>250?rawDesc.slice(0,247)+'...':rawDesc, imageUrl:imgMatch?.[1], source:srcName, sourceType:'rss' });
  }
  return items;
}

async function fetchRSS() {
  const all: ReturnType<typeof parseRSS> = [];
  for (const src of RSS_SOURCES) {
    try { const r=await fetch(src.url,{headers:{'User-Agent':'AnimePulse/2.0'}}); if(!r.ok)continue; parseRSS(await r.text(),src.name).forEach(i=>all.push(i)); } catch { /**/ }
  }
  return all;
}

async function generateArticle(item:{title:string;description:string}, geminiKey:string) {
  if (!geminiKey) return { title:item.title, content:`# ${item.title}\n\n${item.description}`, summary:item.description, tags:['anime','news'], readTime:2 };
  try {
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ contents:[{parts:[{text:`You are an expert anime journalist. Write an engaging article:\nTitle: ${item.title}\nDescription: ${item.description}\nWrite in Markdown. End with ---SUMMARY--- (2-3 sentences) then ---TAGS--- (comma list).`}]}], generationConfig:{temperature:0.7,maxOutputTokens:2048} }) });
    const d=(await r.json()) as {candidates?:Array<{content:{parts:Array<{text:string}>}}>};
    const text=d.candidates?.[0]?.content?.parts?.[0]?.text||'';
    const [content,rest]=text.split('---SUMMARY---');
    const [summary,tagsStr]=(rest||'').split('---TAGS---');
    const tags=(tagsStr||'').split(',').map((t:string)=>t.trim()).filter(Boolean);
    return { title:item.title, content:content?.trim()||`# ${item.title}\n\n${item.description}`, summary:summary?.trim()||item.description, tags:tags.length?tags:['anime','news'], readTime:Math.max(1,Math.ceil((content||'').split(/\s+/).length/200)) };
  } catch { return { title:item.title, content:`# ${item.title}\n\n${item.description}`, summary:item.description, tags:['anime','news'], readTime:2 }; }
}

function genId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

async function runAutoPilot(saJson: string, geminiKey: string) {
  const sa=JSON.parse(saJson); const token=await getFirebaseToken(saJson); const pid=sa.project_id;
  const errors:string[]=[]; let added=0;
  const existing=await fsQuery(pid,token,'articles',200);
  const existingUrls=new Set(existing.map(a=>a.url as string));
  const rssItems=await fetchRSS();
  const newItems=rssItems.filter(i=>!existingUrls.has(i.link)).slice(0,15);
  for (const item of newItems) {
    try {
      const gen=await generateArticle({title:item.title,description:item.description},geminiKey);
      let imageUrl=item.imageUrl;
      try { await new Promise(r=>setTimeout(r,400)); const q=item.title.replace(/[^\w\s]/g,' ').trim().split(' ').slice(0,4).join(' '); const jr=await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`); if(jr.ok){const jd=(await jr.json()) as {data?:Array<{images?:{jpg?:{large_image_url?:string}}}>}; imageUrl=imageUrl||jd.data?.[0]?.images?.jpg?.large_image_url;} } catch { /**/ }
      const article={ id:genId(), title:gen.title, content:gen.content, summary:gen.summary, source:item.source, sourceType:item.sourceType, url:item.link, imageUrl:imageUrl||null, publishedAt:new Date().toISOString(), tags:gen.tags, readTime:gen.readTime };
      existing.unshift(article as unknown as Record<string,unknown>); added++;
    } catch(e) { errors.push(`Error "${item.title}": ${e}`); }
  }
  await fsBatchWrite(pid,token,'articles',existing.slice(0,200) as Record<string,unknown>[]);
  const tr=await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=8').then(r=>r.ok?r.json():{data:[]}).catch(()=>({data:[]}));
  await fsSet(pid,token,'meta/trending',{ updatedAt:new Date().toISOString(), anime:(tr.data||[]).map((a:{title:string})=>({title:a.title})), analysis:'' });
  await fsSet(pid,token,'meta/autopilot-status',{ lastRun:new Date().toISOString(), articlesAdded:added, trendingUpdated:true, sources:{rss:rssItems.length,mal:0,reddit:0}, errors });
  return { ok:true, added, sources:{rss:rssItems.length}, errors };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
  const saJson=process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson) return NextResponse.json({ error:'FIREBASE_SERVICE_ACCOUNT_KEY not set' },{ status:500, headers:CORS });
  try {
    const sa=JSON.parse(saJson); const token=await getFirebaseToken(saJson); const pid=sa.project_id;
    const [statusRes, articles] = await Promise.all([
      fetch(`https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/meta/autopilot-status`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.ok?r.json().then((d:{fields?:Record<string,unknown>})=>d.fields?Object.fromEntries(Object.entries(d.fields).map(([k,v])=>[k,fsVal(v)])):null):null),
      fsQuery(pid,token,'articles',5),
    ]);
    return NextResponse.json({ ok:true, lastRun:(statusRes as Record<string,unknown>)?.lastRun??null, totalArticles:articles.length, latestArticles:articles.slice(0,5).map(a=>({id:a.id,title:a.title,publishedAt:a.publishedAt})), status:statusRes },{ headers:CORS });
  } catch(e) { return NextResponse.json({ error:String(e) },{ status:500, headers:CORS }); }
}

export async function POST(req: NextRequest) {
  const url=req.nextUrl; const secret=req.headers.get('x-cron-secret')||url.searchParams.get('secret');
  if (process.env.CRON_SECRET&&secret!==process.env.CRON_SECRET) return NextResponse.json({ error:'Unauthorized' },{ status:401, headers:CORS });
  const saJson=process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson) return NextResponse.json({ error:'FIREBASE_SERVICE_ACCOUNT_KEY not set' },{ status:500, headers:CORS });
  try { return NextResponse.json(await runAutoPilot(saJson,process.env.GEMINI_API_KEY||''),{ headers:CORS }); }
  catch(e) { return NextResponse.json({ error:String(e) },{ status:500, headers:CORS }); }
}

export async function OPTIONS() { return new Response(null,{ status:204, headers:CORS }); }
