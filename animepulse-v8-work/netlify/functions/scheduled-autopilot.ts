/**
 * Netlify Scheduled Function — runs autopilot every 6 hours
 * No external cron service needed.
 */
import type { Handler, HandlerEvent } from '@netlify/functions';

const handler: Handler = async (_event: HandlerEvent) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const secret  = process.env.CRON_SECRET || '';

  try {
    const res = await fetch(`${siteUrl}/api/autopilot?secret=${secret}`, {
      method: 'POST',
      headers: { 'x-cron-secret': secret },
    });

    const data = await res.json();
    console.log('Autopilot result:', JSON.stringify(data));

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, result: data }),
    };
  } catch (err) {
    console.error('Autopilot error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(err) }),
    };
  }
};

export { handler };
