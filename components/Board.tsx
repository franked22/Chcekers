import React from 'react';
import { BoardState, Move, Player, Position } from '../types';
import Piece from './Piece';

interface BoardProps {
  board: BoardState;
  selectedPos: Position | null;
  validMoves: Move[];
  onSquareClick: (pos: Position) => void;
  lastMove: Move | null;
  turnMoves: Move[]; // All valid moves for the current turn
  turn: Player;
}

const Board: React.FC<BoardProps> = ({ board, selectedPos, validMoves, onSquareClick, lastMove, turnMoves, turn }) => {
  const isDarkSquare = (r: number, c: number) => (r + c) % 2 === 1;

  // Check if a square is a valid destination for the selected piece
  const getMoveForSquare = (r: number, c: number): Move | undefined => {
    if (!selectedPos) return undefined;
    return validMoves.find(m => m.from.r === selectedPos.r && m.from.c === selectedPos.c && m.to.r === r && m.to.c === c);
  };

  // Check if a piece at (r,c) can move at all
  const canPieceMove = (r: number, c: number): boolean => {
    return turnMoves.some(m => m.from.r === r && m.from.c === c);
  };

  return (
    <div className="w-full h-full bg-[#5d4037] rounded-lg shadow-2xl border-4 border-[#3e2723] p-1 sm:p-2 box-border select-none">
      <div className="grid grid-cols-8 gap-0 w-full h-full border-2 border-[#3e2723]">
        {board.map((row, r) => (
          row.map((piece, c) => {
            const isDark = isDarkSquare(r, c);
            const isSelected = selectedPos?.r === r && selectedPos?.c === c;
            const move = getMoveForSquare(r, c);
            const isValidDest = !!move;
            
            // Highlight source and dest of last move
            const isLastMoveSource = lastMove?.from.r === r && lastMove?.from.c === c;
            const isLastMoveDest = lastMove?.to.r === r && lastMove?.to.c === c;

            // Visual dimming for pieces that belong to current player but cannot move (e.g. forced jumps elsewhere)
            const isLocked = piece && piece.player === turn && !canPieceMove(r, c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => onSquareClick({ r, c })}
                className={`
                  relative w-full h-full flex items-center justify-center
                  ${isDark ? 'wood-pattern' : 'light-wood'}
                  ${isValidDest ? 'cursor-pointer' : ''}
                  ${isLastMoveSource || isLastMoveDest ? 'after:absolute after:inset-0 after:bg-yellow-400 after:opacity-20' : ''}
                `}
              >
                {/* Coordinates (optional, only show on larger screens if needed, or keeping subtle) */}
                {c === 0 && isDark && <span className="hidden sm:block absolute left-0.5 top-0.5 text-[8px] sm:text-[10px] text-[#ffffff50] font-mono">{r}</span>}
                {r === 7 && isDark && <span className="hidden sm:block absolute right-0.5 bottom-0 text-[8px] sm:text-[10px] text-[#ffffff50] font-mono">{c}</span>}

                {/* The Piece */}
                {piece && (
                  <div className={`w-full h-full flex items-center justify-center transition-opacity duration-300 ${isLocked ? 'opacity-40 grayscale-[50%]' : 'opacity-100'}`}>
                    <Piece 
                      piece={piece} 
                      isSelected={isSelected} 
                      onClick={() => onSquareClick({ r, c })} 
                    />
                  </div>
                )}

                {/* Valid Move Indicator */}
                {isValidDest && (
                  <div className={`
                    absolute w-[30%] h-[30%] rounded-full z-20 pointer-events-none
                    ${move?.isJump ? 'bg-red-500 ring-2 ring-red-300 animate-pulse' : 'bg-green-500 opacity-60'}
                  `}></div>
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default Board;