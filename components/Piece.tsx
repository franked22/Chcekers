import React from 'react';
import { Player, Piece as PieceType } from '../types';

interface PieceProps {
  piece: PieceType;
  isSelected: boolean;
  onClick: () => void;
}

const Piece: React.FC<PieceProps> = ({ piece, isSelected, onClick }) => {
  const isRed = piece.player === Player.RED;
  
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`
        w-[80%] h-[80%] rounded-full relative cursor-pointer
        flex items-center justify-center transition-transform duration-200
        ${isSelected ? 'scale-110 ring-4 ring-yellow-400 z-10' : 'hover:scale-105'}
        ${isRed 
          ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-[0_4px_0_#991b1b]' 
          : 'bg-gradient-to-br from-gray-700 to-gray-900 shadow-[0_4px_0_#000000]'}
      `}
    >
      {/* Inner detailing for "checker" look */}
      <div className={`
        w-[70%] h-[70%] rounded-full border-2 opacity-50
        ${isRed ? 'border-red-900' : 'border-gray-600'}
      `}></div>

      {/* King Crown Icon */}
      {piece.isKing && (
        <div className="absolute inset-0 flex items-center justify-center text-yellow-400 text-2xl drop-shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.182A1 1 0 0118 4v10a3 3 0 01-3 3H5a3 3 0 01-3-3V4a1 1 0 011.347-1.277l1.699 3.182L9 5.323V3a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Piece;
