const BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE62_RADIX = 62;
const BASE62_TRIPLE_MOD = BASE62_RADIX ** 3; // 62^3 = 238,328

// 表3：1文字目のグループ→基準48文字列（3文字×16）
const BASE_ID_BY_FIRST_CHAR_GROUP = [
  { chars: new Set(["k", "m", "o", "q", "s"]), baseId: "7U2jQ8ajmmTIogVkJs982eiE28H72s4J35G0agteWTcsJ56I" },
  { chars: new Set(["0", "2", "4", "6", "8"]), baseId: "oWdebolCqm8O7edn5VaExiaV1h68OXi6SjQUmA6pWlh2Paic" },
  { chars: new Set(["F", "H", "J", "L", "N"]), baseId: "0468658xnl2cbG4hskmJjiIN2VplTR6hyUHemLgjAkWC7Cu" },
  { chars: new Set(["v", "x", "z", "B", "D"]), baseId: "7ZFo3zcpiaU9aD9oI21bP6VmiKofWMnpBmjJhLKenMhw2mVn" },
  { chars: new Set(["O", "Q", "S", "U", "W"]), baseId: "aw3iVU6f6nb2chjaNE07F2QBbqX7Mh1le7bHjxsm0f7ozhZP" },
  { chars: new Set(["b", "d", "f", "h", "j"]), baseId: "jtLb1B0Yb1NE1UHcZB6fMljc8xokEB7BpjUPbma1E3iAKhAo" }
];

// 表4：各3文字ブロック(0..15) → 「デッキの何番目(1..16)」対応（グループ別）
const DECK_SLOT_BY_BLOCK_INDEX = {
  "kmoqs": [2,3,6,5,9,14,4,16,12,15,10,7,13,11,1,8],
  "02468": [13,12,5,6,2,8,7,15,14,3,1,9,4,11,16,10],
  "FHJLN": [5,4,13,3,1,14,8,12,16,9,2,11,10,15,6,7],
  "vxzBD": [3,15,5,16,7,8,11,2,14,12,6,4,1,13,9,10],
  "OQSUW": [9,10,1,12,15,7,6,4,3,8,11,16,14,2,13,5],
  "bdfhj": [11,6,4,15,12,2,10,5,8,13,14,16,1,9,3,7]
};

// 表2：2文字目→モード
const MODE_BY_SECOND_CHAR = {
  "0": "おためしデッキ",
  "1": "基本デッキ",
  "2": "カップ戦用デッキ",
  "3": "シーズンマッチ（通常）",
  "4": "不明（UNKNOWN）",
  "5": "白の塔専用",
  "6": "闘技場A専用",
  "7": "闘技場B専用",
  "8": "闘技場C専用",
  "9": "ロイヤルバトル専用",
  "a": "グローリーモード専用"
};

// 表1：1文字目検算用（row=「100と10の位」(mod3), col=1の位）
const FIRST_CHAR_TABLE = [
  ["F","O","0","j","q","D","L","U","6","f"], // key % 3 == 0
  ["m","z","H","Q","2","b","s","v","N","W"], // key % 3 == 1
  ["8","h","o","B","J","S","4","d","k","x"]  // key % 3 == 2
];

function isBase62String(text) {
  for (const character of text) {
    if (!BASE62_ALPHABET.includes(character)) return false;
  }
  return true;
}

function decodeBase62(text) {
  let value = 0;
  for (const character of text) {
    const digit = BASE62_ALPHABET.indexOf(character);
    if (digit < 0) throw new Error(`invalid base62 char: ${character}`);
    value = value * BASE62_RADIX + digit;
  }
  return value;
}

function calculateExpectedFirstChar(catalogNumbers) {
  const onesSum = catalogNumbers.reduce((acc, n) => acc + (n % 10), 0);
  const hundreds = Math.floor(onesSum / 100);
  const tens = Math.floor((onesSum % 100) / 10);
  const key = hundreds * 10 + tens; // 0..14
  const rowIndex = key % 3;
  const colIndex = onesSum % 10;
  return FIRST_CHAR_TABLE[rowIndex][colIndex];
}

function resolveGroupKey(firstChar) {
  for (const group of BASE_ID_BY_FIRST_CHAR_GROUP) {
    if (group.chars.has(firstChar)) {
      // DECK_SLOT_BY_BLOCK_INDEX のキー文字列に合わせる
      if (["k","m","o","q","s"].includes(firstChar)) return "kmoqs";
      if (["0","2","4","6","8"].includes(firstChar)) return "02468";
      if (["F","H","J","L","N"].includes(firstChar)) return "FHJLN";
      if (["v","x","z","B","D"].includes(firstChar)) return "vxzBD";
      if (["O","Q","S","U","W"].includes(firstChar)) return "OQSUW";
      if (["b","d","f","h","j"].includes(firstChar)) return "bdfhj";
    }
  }
  return null;
}

function resolveBaseId(firstChar) {
  for (const group of BASE_ID_BY_FIRST_CHAR_GROUP) {
    if (group.chars.has(firstChar)) return group.baseId;
  }
  return null;
}

function decodeDeckIdToCatalogNumbers(deckId) {
  if (typeof deckId !== "string") throw new Error("deckId must be string");
  if (deckId.length !== 50) throw new Error("deckId length must be 50");
  if (!isBase62String(deckId)) throw new Error("deckId contains invalid characters");

  const firstChar = deckId[0];
  const secondChar = deckId[1];
  const mode = MODE_BY_SECOND_CHAR[secondChar] ?? "不明";

  const baseId = resolveBaseId(firstChar);
  const groupKey = resolveGroupKey(firstChar);
  if (!baseId || !groupKey) throw new Error("unknown firstChar group");

  const slotByBlockIndex = DECK_SLOT_BY_BLOCK_INDEX[groupKey];

  const catalogNumbersBySlot = new Array(16).fill(null);

  for (let blockIndex = 0; blockIndex < 16; blockIndex++) {
    const deckIdBlockStart = 2 + blockIndex * 3; // 3文字目はindex=2
    const encodedBlock = deckId.slice(deckIdBlockStart, deckIdBlockStart + 3);

    const baseBlockStart = blockIndex * 3;
    const baseBlock = baseId.slice(baseBlockStart, baseBlockStart + 3);

    const encodedValue = decodeBase62(encodedBlock);
    const baseValue = decodeBase62(baseBlock);

    // 図鑑No = (encoded - base) を 62^3 で循環させる（負の対策）
    const catalogNumber = (encodedValue - baseValue + BASE62_TRIPLE_MOD) % BASE62_TRIPLE_MOD;

    const slotNumber1Based = slotByBlockIndex[blockIndex];
    catalogNumbersBySlot[slotNumber1Based - 1] = catalogNumber;
  }

  // 念のため、全部埋まっているかチェック
  if (catalogNumbersBySlot.some((n) => typeof n !== "number")) {
    throw new Error("failed to decode all 16 catalog numbers");
  }

  // 1文字目の検算（表1）
  const expectedFirstChar = calculateExpectedFirstChar(catalogNumbersBySlot);
  if (expectedFirstChar !== firstChar) {
    throw new Error(`firstChar mismatch: expected ${expectedFirstChar}, got ${firstChar}`);
  }

  return { mode, firstChar, secondChar, catalogNumbers: catalogNumbersBySlot };
}

function validateTournamentRules(decoded) {
  // TODO: あなたの大会ルールに合わせて実装
  // 例：
  // - 禁止図鑑Noが含まれていないか
  // - 同名制限（図鑑Noで代用するなら重複枚数）
  // - コスト上限（図鑑No→コスト表が必要）
  //
  // いまは例として「図鑑Noが0だけの駒はNG」みたいなダミールールを入れる
  const reasons = [];

  if (decoded.catalogNumbers.some((n) => n === 0)) {
    reasons.push("図鑑No=0の駒が含まれています（ダミールール）");
  }

  return { ok: reasons.length === 0, reasons };
}

export async function onRequestPost(context) {
  try {
    const request = context.request;
    const body = await request.json();
    const deckId = body?.deckId ? String(body.deckId) : "";

    if (!deckId) {
      return new Response(JSON.stringify({ ok: false, reasons: ["deckIdが空です"] }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const decoded = decodeDeckIdToCatalogNumbers(deckId);
    const ruleResult = validateTournamentRules(decoded);

    return new Response(JSON.stringify({
      ...ruleResult,
      mode: decoded.mode,
      catalogNumbers: decoded.catalogNumbers
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      reasons: [String(error?.message ?? error)]
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}