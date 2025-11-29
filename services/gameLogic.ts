import { BoardState, Move, Piece, Player, Position } from '../types';

export const BOARD_SIZE = 8;

// Points Configuration
const POINTS = {
  CAPTURE_NORMAL: 100,
  CAPTURE_KING: 250,
  PROMOTION: 150,
  WIN: 1000
};

export const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) {
          board[r][c] = { player: Player.BLACK, isKing: false };
        } else if (r > 4) {
          board[r][c] = { player: Player.RED, isKing: false };
        }
      }
    }
  }
  return board;
};

export const isValidPos = (r: number, c: number): boolean => {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
};

// Helper to get moves for a single piece
const getMovesForPiece = (board: BoardState, r: number, c: number, piece: Piece): { moves: Move[], jumps: Move[] } => {
  const moves: Move[] = [];
  const jumps: Move[] = [];
  
  const directions = [];
  if (piece.player === Player.RED || piece.isKing) directions.push(-1); // Up
  if (piece.player === Player.BLACK || piece.isKing) directions.push(1); // Down

  for (const dr of directions) {
    for (const dc of [-1, 1]) {
      const newR = r + dr;
      const newC = c + dc;

      if (isValidPos(newR, newC)) {
        // Check for simple move
        if (board[newR][newC] === null) {
          moves.push({
            from: { r, c },
            to: { r: newR, c: newC },
            isJump: false
          });
        }
        // Check for jump
        else if (board[newR][newC]?.player !== piece.player) {
          const jumpR = newR + dr;
          const jumpC = newC + dc;
          if (isValidPos(jumpR, jumpC) && board[jumpR][jumpC] === null) {
            jumps.push({
              from: { r, c },
              to: { r: jumpR, c: jumpC },
              isJump: true,
              jumpedPiece: { r: newR, c: newC }
            });
          }
        }
      }
    }
  }

  return { moves, jumps };
};

// Get all possible moves for a player, enforcing mandatory jumps
export const getValidMoves = (board: BoardState, player: Player, mustJumpFrom: Position | null = null): Move[] => {
  let allMoves: Move[] = [];
  let allJumps: Move[] = [];

  // If we are in a multi-jump sequence, ONLY check that piece
  if (mustJumpFrom) {
    const piece = board[mustJumpFrom.r][mustJumpFrom.c];
    if (piece && piece.player === player) {
      const { jumps } = getMovesForPiece(board, mustJumpFrom.r, mustJumpFrom.c, piece);
      return jumps; // In a multi-jump chain, only jumps are valid
    }
    return [];
  }

  // Otherwise check entire board
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece || piece.player !== player) continue;

      const { moves, jumps } = getMovesForPiece(board, r, c, piece);
      allMoves = [...allMoves, ...moves];
      allJumps = [...allJumps, ...jumps];
    }
  }

  // Mandatory jumps rule: if jumps exist anywhere, only jumps are valid
  return allJumps.length > 0 ? allJumps : allMoves;
};

export const applyMove = (board: BoardState, move: Move): { board: BoardState, pointsGained: number, didPromote: boolean } => {
  // Deep copy board
  const newBoard = board.map(row => row.map(p => (p ? { ...p } : null)));
  
  // Safety Check: Ensure the source piece exists
  const piece = newBoard[move.from.r][move.from.c];
  if (!piece) {
    console.error("Critical Error: applyMove called on empty square", move);
    return { board: newBoard, pointsGained: 0, didPromote: false };
  }
  
  let pointsGained = 0;
  let didPromote = false;

  // Move piece
  newBoard[move.to.r][move.to.c] = piece;
  newBoard[move.from.r][move.from.c] = null;

  // Handle Capture
  if (move.isJump && move.jumpedPiece) {
    const capturedPiece = newBoard[move.jumpedPiece.r][move.jumpedPiece.c];
    if (capturedPiece) {
      pointsGained += capturedPiece.isKing ? POINTS.CAPTURE_KING : POINTS.CAPTURE_NORMAL;
    }
    newBoard[move.jumpedPiece.r][move.jumpedPiece.c] = null;
  }

  // Handle King Promotion
  if (!piece.isKing) {
    if (piece.player === Player.RED && move.to.r === 0) {
      piece.isKing = true;
      didPromote = true;
      pointsGained += POINTS.PROMOTION;
    } else if (piece.player === Player.BLACK && move.to.r === BOARD_SIZE - 1) {
      piece.isKing = true;
      didPromote = true;
      pointsGained += POINTS.PROMOTION;
    }
  }

  return { board: newBoard, pointsGained, didPromote };
};

export const checkWinCondition = (board: BoardState, nextPlayer: Player): { isGameOver: boolean, winner: Player | null, winBonus: number } => {
  const redPieces = board.flat().filter(p => p?.player === Player.RED).length;
  const blackPieces = board.flat().filter(p => p?.player === Player.BLACK).length;

  if (redPieces === 0) return { isGameOver: true, winner: Player.BLACK, winBonus: POINTS.WIN };
  if (blackPieces === 0) return { isGameOver: true, winner: Player.RED, winBonus: POINTS.WIN };

  // Check if next player has any moves
  const moves = getValidMoves(board, nextPlayer);
  if (moves.length === 0) {
    // Current player wins because next player is stuck
    return { 
      isGameOver: true, 
      winner: nextPlayer === Player.RED ? Player.BLACK : Player.RED,
      winBonus: POINTS.WIN
    };
  }

  return { isGameOver: false, winner: null, winBonus: 0 };
};

// Helper for AI to understand the board
export const boardToString = (board: BoardState): string => {
  let output = "  0 1 2 3 4 5 6 7\n";
  for (let r = 0; r < BOARD_SIZE; r++) {
    output += `${r} `;
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) output += ". ";
      else output += (p.player === Player.RED ? (p.isKing ? "R " : "r ") : (p.isKing ? "B " : "b "));
    }
    output += "\n";
  }
  return output;
};