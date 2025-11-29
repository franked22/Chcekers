export enum Player {
  RED = 'RED', // Usually human or player 1 (starts bottom)
  BLACK = 'BLACK' // Usually computer or player 2 (starts top)
}

export interface Piece {
  player: Player;
  isKing: boolean;
}

export interface Position {
  r: number;
  c: number;
}

export interface Move {
  from: Position;
  to: Position;
  isJump: boolean;
  jumpedPiece?: Position; // Position of the captured piece if it's a jump
}

export type BoardState = (Piece | null)[][];

export enum GameMode {
  PVP = 'PVP',
  PVC = 'PVC'
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Score {
  [Player.RED]: number; // Series wins
  [Player.BLACK]: number; // Series wins
}

export interface GamePoints {
  [Player.RED]: number; // Current game points
  [Player.BLACK]: number; // Current game points
}

export interface GameState {
  board: BoardState;
  turn: Player;
  gamePoints: GamePoints;
  lastMove: Move | null;
  mustJumpFrom: Position | null;
  gameStatus: GameStatus;
  winner: Player | null;
}

export interface MoveRecord {
  move: Move;
  player: Player;
  turnNumber: number;
  notation: string;
}