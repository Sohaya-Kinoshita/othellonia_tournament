module.exports = async function (context, req) {
  const deckId = (req.body && req.body.deckId) ? String(req.body.deckId) : "";

  if (!deckId) {
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { ok: false, reasons: ["deckIdが空です"] }
    };
    return;
  }

  const isOk = deckId.length >= 8;

  context.res = {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: isOk
      ? { ok: true, reasons: [] }
      : { ok: false, reasons: ["仮ルール：deckIdが短すぎます（8文字以上）"] }
  };
};