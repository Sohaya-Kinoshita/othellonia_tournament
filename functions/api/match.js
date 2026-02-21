const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "..", "data", "results.json");

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return { matches: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

exports.handler = async (event) => {
  try {
    const method = event.httpMethod || event.method || "GET";
    const data = readData();

    if (method === "GET") {
      const qs = event.queryStringParameters || {};
      const matchId = qs.matchId;
      if (matchId === undefined) {
        return { statusCode: 200, body: JSON.stringify(data) };
      }
      const idx = Number(matchId);
      if (Number.isNaN(idx) || idx < 0 || idx >= (data.matches || []).length) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: "invalid matchId" }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, match: data.matches[idx] }),
      };
    }

    if (method === "POST") {
      let body = {};
      try {
        body = JSON.parse(event.body || "{}");
      } catch (e) {
        body = {};
      }

      const adminPassword =
        body.adminPassword ||
        (event.headers && event.headers["x-admin-password"]);
      const expected = process.env.MATCH_ADMIN_PASSWORD || "admin123";
      if (adminPassword !== expected) {
        return {
          statusCode: 401,
          body: JSON.stringify({ success: false, message: "unauthorized" }),
        };
      }

      const action = body.action || "setWinner";
      if (action === "setWinner") {
        const matchId = Number(body.matchId);
        const winner = body.winner; // 'A'|'B'|'draw' or null
        if (
          Number.isNaN(matchId) ||
          !Array.isArray(data.matches) ||
          matchId < 0 ||
          matchId >= data.matches.length
        ) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              success: false,
              message: "invalid matchId",
            }),
          };
        }
        data.matches[matchId] = data.matches[matchId] || {};
        data.matches[matchId].winner = winner === null ? null : String(winner);
        data.lastUpdated = new Date().toISOString();
        writeData(data);
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, match: data.matches[matchId] }),
        };
      }

      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "unknown action" }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "method not allowed" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: String(err) }),
    };
  }
};
