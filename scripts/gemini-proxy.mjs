/**
 * LOCAL-ONLY Gemini proxy. Do not deploy this process.
 *
 * GitHub Pages is a static host and cannot keep GEMINI_API_KEY secret.
 * This script binds to 127.0.0.1 only so the key never leaves your machine.
 *
 * Usage:
 *   1. Copy .env.example to .env and set GEMINI_API_KEY
 *   2. npm run gemini-proxy
 *   3. npm run dev   (Vite proxies POST /api/gemini here)
 *
 * Production (Pages) has no proxy and no key; the client uses heuristic AI.
 */

import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { GoogleGenAI, Type } from '@google/genai';

const HOST = '127.0.0.1';
const PORT = 8787;

function loadDotEnv() {
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv();

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
if (!apiKey) {
  console.error(
    'gemini-proxy: GEMINI_API_KEY is not set. Add it to .env (gitignored) or the environment.'
  );
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

function boardToString(board) {
  let output = '  0 1 2 3 4 5 6 7\n';
  for (let r = 0; r < 8; r++) {
    output += `${r} `;
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) output += '. ';
      else {
        output +=
          p.player === 'RED' ? (p.isKing ? 'R ' : 'r ') : p.isKing ? 'B ' : 'b ';
      }
    }
    output += '\n';
  }
  return output;
}

async function selectMove({ board, validMoves, difficulty, playerColor }) {
  if (!Array.isArray(validMoves) || validMoves.length === 0) {
    throw new Error('No valid moves');
  }
  if (validMoves.length === 1) return 0;

  const movesList = validMoves
    .map((m, index) => {
      return `ID ${index}: Move from (${m.from.r},${m.from.c}) to (${m.to.r},${m.to.c}) ${m.isJump ? '(JUMP)' : ''}`;
    })
    .join('\n');

  const boardStr = boardToString(board);
  const isRed = playerColor === 'RED';
  const colorName = isRed ? 'RED (r/R)' : 'BLACK (b/B)';

  let systemInstruction = 'You are a checkers player.';
  let thinkingBudget = 0;

  switch (difficulty) {
    case 1:
      systemInstruction =
        'You are a beginner checkers player. You make random moves or simple mistakes. Do not think too hard. Just pick a valid move.';
      break;
    case 2:
      systemInstruction =
        'You are a casual checkers player. You play decently but miss complex tactics.';
      break;
    case 3:
      systemInstruction =
        'You are an experienced checkers player. You try to control the center and avoid leaving pieces vulnerable.';
      break;
    case 4:
      systemInstruction =
        'You are an expert checkers player. Look ahead for traps and forced sequences.';
      thinkingBudget = 1024;
      break;
    case 5:
      systemInstruction =
        'You are a Grandmaster Checkers Engine. Calculate deep lines, prioritize forced wins, and punish opponent mistakes relentlessly.';
      thinkingBudget = 4096;
      break;
  }

  const prompt = `
Current Board State (r=Red, b=Black, Uppercase=King, .=Empty):
${boardStr}

You are playing as ${colorName}.
Your valid moves are:
${movesList}

Select the best move ID based on your difficulty level (${difficulty}/5).
Return ONLY the JSON object with the selected move ID.
`;

  const config = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        selectedMoveId: {
          type: Type.INTEGER,
          description: 'The ID of the move to play from the provided list.',
        },
      },
      required: ['selectedMoveId'],
    },
    systemInstruction,
  };

  if (difficulty >= 4) {
    config.thinkingConfig = { thinkingBudget };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config,
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error('Empty response from AI');

  const parsed = JSON.parse(jsonText);
  const selectedId = parsed.selectedMoveId;
  if (typeof selectedId === 'number' && selectedId >= 0 && selectedId < validMoves.length) {
    return selectedId;
  }
  return Math.floor(Math.random() * validMoves.length);
}

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  if (req.method !== 'POST' || url.pathname !== '/api/gemini') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  try {
    const body = JSON.parse(await readBody(req));
    const selectedMoveId = await selectMove(body);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ selectedMoveId }));
  } catch (err) {
    console.error('gemini-proxy error:', err instanceof Error ? err.message : err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'AI request failed' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`gemini-proxy listening on http://${HOST}:${PORT} (local only)`);
});
