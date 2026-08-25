import { BoardState, Move, Player } from "../types";
import { applyMove, BOARD_SIZE } from "./gameLogic";

/**
 * Gemini is never called from the browser and no API key is bundled.
 *
 * Local Gemini opponent (optional):
 *   1. Put GEMINI_API_KEY in `.env` (gitignored)
 *   2. `npm run gemini-proxy`  (binds 127.0.0.1:8787 only)
 *   3. `npm run dev`           (Vite proxies POST /api/gemini)
 *
 * GitHub Pages is static — there is no server and no key.
 * Production uses the heuristic fallback below.
 */
const GEMINI_ENDPOINT = "/api/gemini";

function scoreMove(board: BoardState, move: Move, player: Player): number {
  const { pointsGained, didPromote } = applyMove(board, move);
  let score = pointsGained;
  if (didPromote) score += 20;

  const center = (BOARD_SIZE - 1) / 2;
  score += (3 - Math.abs(move.to.r - center)) + (3 - Math.abs(move.to.c - center));

  const dir = player === Player.RED ? -1 : 1;
  score += (move.to.r - move.from.r) * dir * 2;

  if (move.isJump) score += 10;
  return score;
}

function pickHeuristicMove(
  board: BoardState,
  validMoves: Move[],
  difficulty: number,
  player: Player
): Move {
  const ranked = validMoves
    .map((move) => ({ move, score: scoreMove(board, move, player) }))
    .sort((a, b) => b.score - a.score);

  const clamped = Math.min(5, Math.max(1, difficulty));
  // Level 1: pick from all moves; level 5: always the top-scoring move.
  const poolSize = Math.max(1, Math.ceil(ranked.length * ((6 - clamped) / 5)));
  const pool = ranked.slice(0, poolSize);
  return pool[Math.floor(Math.random() * pool.length)].move;
}

export const getAIMove = async (
  board: BoardState,
  validMoves: Move[],
  difficulty: number,
  playerColor: Player
): Promise<Move> => {
  if (validMoves.length === 1) return validMoves[0];
  if (validMoves.length === 0) throw new Error("No valid moves for AI");

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board, validMoves, difficulty, playerColor }),
    });
    if (response.ok) {
      const parsed = await response.json();
      const selectedId = parsed.selectedMoveId;
      if (typeof selectedId === "number" && selectedId >= 0 && selectedId < validMoves.length) {
        return validMoves[selectedId];
      }
    }
  } catch {
    // No local proxy (expected on GitHub Pages).
  }

  return pickHeuristicMove(board, validMoves, difficulty, playerColor);
};
