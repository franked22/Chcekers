import React from 'react';
import { Player, GameMode, Score, GameStatus, GamePoints } from '../types';

interface GameControlsProps {
  score: Score;
  gamePoints: GamePoints;
  turn: Player;
  gameStatus: GameStatus;
  gameMode: GameMode;
  difficulty: number;
  winner: Player | null;
  onReset: () => void;
  onMenu: () => void;
  isAiThinking: boolean;
  mustJump?: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({ 
  score, gamePoints, turn, gameStatus, gameMode, difficulty, winner, onReset, onMenu, isAiThinking, mustJump
}) => {
  return (
    <div className="w-full max-w-[800px] flex flex-col gap-2 pointer-events-auto z-10">
      {/* Header Bar */}
      <div className="bg-gray-800/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-700 flex justify-between items-center relative overflow-hidden">
        <button onClick={onMenu} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-semibold z-10">
          <span className="text-lg">‹</span> Menu
        </button>
        
        <div className="text-gray-300 font-bold text-sm tracking-wide z-10 flex flex-col items-center">
          <span>{gameMode === GameMode.PVP ? "PvP" : `PvC • Level ${difficulty}`}</span>
          {mustJump && gameStatus === GameStatus.PLAYING && (
            <span className="text-[10px] text-yellow-400 animate-pulse font-extrabold tracking-wider mt-0.5">DOUBLE JUMP AVAILABLE!</span>
          )}
        </div>
        
        <button 
          onClick={onReset}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors shadow-sm z-10"
        >
          {gameStatus === GameStatus.GAME_OVER ? "New Game" : "Reset"}
        </button>

        {/* Dynamic Background Alert for Must Jump */}
        {mustJump && (
           <div className="absolute inset-0 bg-yellow-500/10 animate-pulse pointer-events-none"></div>
        )}
      </div>

      {/* Score Board */}
      <div className="flex gap-4">
        {/* Red Player Card */}
        <div className={`
          flex-1 p-3 rounded-xl border-2 transition-all flex flex-col relative overflow-hidden
          ${turn === Player.RED && gameStatus === GameStatus.PLAYING 
            ? 'bg-gradient-to-br from-red-900/50 to-red-900/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
            : 'bg-gray-800/50 border-gray-700 opacity-80'}
        `}>
          <div className="flex justify-between items-start mb-1">
             <div className="text-red-400 font-bold uppercase tracking-wider text-[10px]">Red</div>
             {winner === Player.RED && <span className="text-yellow-400 text-xs animate-bounce">👑</span>}
          </div>
          <div className="flex items-baseline justify-between">
             <div className="text-white text-2xl font-bold font-mono">{gamePoints[Player.RED]}</div>
             <div className="text-xs text-gray-500 font-medium">{score[Player.RED]} wins</div>
          </div>
        </div>

        {/* Info Center - Compact */}
        <div className="flex flex-col items-center justify-center w-24 shrink-0">
          {gameStatus === GameStatus.GAME_OVER ? (
             <div className="text-center">
               <div className="text-[10px] text-gray-400 uppercase font-bold">Winner</div>
               <div className={`text-sm font-black ${winner === Player.RED ? 'text-red-400' : 'text-gray-200'}`}>
                 {winner === Player.RED ? "RED" : "BLACK"}
               </div>
             </div>
          ) : isAiThinking ? (
            <div className="flex flex-col items-center gap-1">
              <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-[10px] text-blue-300 font-medium animate-pulse">Thinking</span>
            </div>
          ) : (
            <div className="text-center">
               <div className="text-[10px] text-gray-400 uppercase font-bold">Turn</div>
               <div className={`text-sm font-black ${turn === Player.RED ? 'text-red-400' : 'text-gray-200'}`}>
                 {turn === Player.RED ? "RED" : "BLACK"}
               </div>
            </div>
          )}
        </div>

        {/* Black Player Card */}
        <div className={`
          flex-1 p-3 rounded-xl border-2 transition-all flex flex-col relative overflow-hidden
          ${turn === Player.BLACK && gameStatus === GameStatus.PLAYING
            ? 'bg-gradient-to-br from-gray-700/50 to-gray-700/20 border-gray-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
            : 'bg-gray-800/50 border-gray-700 opacity-80'}
        `}>
          <div className="flex justify-between items-start mb-1">
             <div className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">
               {gameMode === GameMode.PVP ? "Black" : "CPU"}
             </div>
             {winner === Player.BLACK && <span className="text-yellow-400 text-xs animate-bounce">👑</span>}
          </div>
          <div className="flex items-baseline justify-between">
             <div className="text-white text-2xl font-bold font-mono">{gamePoints[Player.BLACK]}</div>
             <div className="text-xs text-gray-500 font-medium">{score[Player.BLACK]} wins</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameControls;