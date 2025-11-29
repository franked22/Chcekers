import React, { useEffect, useRef } from 'react';
import { MoveRecord, Player } from '../types';

interface MoveListProps {
  moves: MoveRecord[];
  isOpen: boolean;
  onClose: () => void;
}

const MoveList: React.FC<MoveListProps> = ({ moves, isOpen, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 bottom-20 w-64 bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
        <h3 className="font-bold text-gray-200 text-sm">Move History</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded transition-colors"
        >
          ✕
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs"
      >
        {moves.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 italic">No moves yet</div>
        ) : (
          moves.map((record, i) => (
            <div key={i} className="flex gap-2 items-center p-1.5 rounded hover:bg-gray-700/50 border-b border-gray-800/50 last:border-0">
              <span className="text-gray-500 w-6 text-right">{i + 1}.</span>
              <div className={`w-2 h-2 rounded-full ${record.player === Player.RED ? 'bg-red-500' : 'bg-gray-400'}`}></div>
              <span className={record.player === Player.RED ? 'text-red-200' : 'text-gray-300'}>
                {record.notation}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MoveList;
