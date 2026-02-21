export async function onRequestPost(context) {
  const request = context.request;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, reasons: ["JSONが不正です"] }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const deckId = body?.deckId ? String(body.deckId) : "";
  if (!deckId) {
    return new Response(JSON.stringify({ ok: false, reasons: ["deckIdが空です"] }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const isOk = deckId.length >= 8;

  const result = isOk
    ? { ok: true, reasons: [] }
    : { ok: false, reasons: ["仮ルール：deckIdが短すぎます（8文字以上）"] };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}