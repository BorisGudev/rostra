/* Server-sent events helper: the AI function streams text deltas so the page can show progress, then a final
   `done` event with the parsed result and usage. One event per line pair: "event: x\ndata: {...}\n\n". */
export function sseResponse(run, { status = 200 } = {}) {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => { try { controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); } catch (e) { /* closed */ } };
      const ping = setInterval(() => send('ping', { t: Date.now() }), 15000);
      try { await run(send); }
      catch (e) { send('error', { code: e.code || 'error', message: e.message || String(e) }); }
      finally { clearInterval(ping); try { controller.close(); } catch (e) { /* closed */ } }
    },
  });
  return new Response(stream, { status, headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no', connection: 'keep-alive' } });
}

/* Pull JSON out of a model reply that may wrap it in prose or a ```json fence. */
export function extractJson(text) {
  const s = String(text || '').trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fenced ? fenced[1] : null, s, s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1), s.slice(s.indexOf('['), s.lastIndexOf(']') + 1)].filter(Boolean);
  for (const c of candidates) { try { return JSON.parse(c); } catch (e) { /* next */ } }
  const e = new Error('The reply was not valid JSON'); e.code = 'invalid_json'; throw e;
}
