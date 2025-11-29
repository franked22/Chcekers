import React, { useState, useEffect, useRef } from 'react';
import Board from './components/Board';
import GameControls from './components/GameControls';
import Celebration from './components/Celebration';
import { 
  BoardState, Player, Position, Move, 
  GameMode, GameStatus, Score, GamePoints
} from './types';
import { 
  createInitialBoard, getValidMoves, applyMove, 
  checkWinCondition 
} from './services/gameLogic';
import { getAIMove } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [turn, setTurn] = useState<Player>(Player.RED);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  
  // Logic state
  const [mustJumpFrom, setMustJumpFrom] = useState<Position | null>(null);
  
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [winner, setWinner] = useState<Player | null>(null);
  
  // Scoring
  const [seriesScore, setSeriesScore] = useState<Score>({ [Player.RED]: 0, [Player.BLACK]: 0 });
  const [gamePoints, setGamePoints] = useState<GamePoints>({ [Player.RED]: 0, [Player.BLACK]: 0 });
  
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [turnMoves, setTurnMoves] = useState<Move[]>([]); 

  // --- Initialization & Turn Calculation ---
  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
      // Calculate moves available for the current player
      // If mustJumpFrom is set, getValidMoves will only return jumps from that piece
      const moves = getValidMoves(board, turn, mustJumpFrom);
      setTurnMoves(moves);
      
      // If we are in a multi-jump, auto-select the piece
      if (mustJumpFrom && moves.length > 0) {
        setSelectedPos(mustJumpFrom);
        setValidMoves(moves);
      } else if (mustJumpFrom && moves.length === 0) {
        // Should not happen if logic is correct, but safety net: end turn
        const nextPlayer = turn === Player.RED ? Player.BLACK : Player.RED;
        setMustJumpFrom(null);
        setTurn(nextPlayer);
      }
      
      // Check loose condition if no moves (only if not waiting for AI mid-turn)
      if (moves.length === 0 && !isAiThinking) {
        const result = checkWinCondition(board, turn);
        if (result.isGameOver) {
          endGame(result.winner, result.winBonus);
        }
      }
    }
  }, [board, turn, gameStatus, mustJumpFrom]);

  // --- AI Turn Handler ---
  useEffect(() => {
    let isCancelled = false;

    const handleAiTurn = async () => {
      // AI only plays if it is AI turn, game is playing, and there are moves to make
      if (gameMode === GameMode.PVC && turn === Player.BLACK && gameStatus === GameStatus.PLAYING && turnMoves.length > 0) {
        setIsAiThinking(true);
        try {
          // Delay slightly for realism/UI update
          await new Promise(r => setTimeout(r, 800));
          
          if (isCancelled) return;

          const bestMove = await getAIMove(board, turnMoves, difficulty, Player.BLACK);
          
          if (isCancelled) return;
          
          executeMove(bestMove);
        } catch (error) {
          if (!isCancelled) console.error("AI Move failed", error);
        } finally {
          if (!isCancelled) setIsAiThinking(false);
        }
      }
    };

    handleAiTurn();

    return () => {
      isCancelled = true;
    };
  }, [turn, gameStatus, turnMoves, gameMode, difficulty, board, mustJumpFrom]); 

  // --- Game Actions ---

  const startGame = (mode: GameMode, level: number = 1) => {
    setGameMode(mode);
    setDifficulty(level);
    setBoard(createInitialBoard());
    setTurn(Player.RED);
    setGameStatus(GameStatus.PLAYING);
    setWinner(null);
    setLastMove(null);
    setSelectedPos(null);
    setMustJumpFrom(null);
    setGamePoints({ [Player.RED]: 0, [Player.BLACK]: 0 }); // Reset current game points
    setIsAiThinking(false); 
  };

  const endGame = (winner: Player | null, winBonus: number) => {
    setGameStatus(GameStatus.GAME_OVER);
    setWinner(winner);
    if (winner) {
      setSeriesScore(prev => ({ ...prev, [winner]: prev[winner] + 1 }));
      setGamePoints(prev => ({ ...prev, [winner]: prev[winner] + winBonus }));
    }
  };

  const executeMove = (move: Move) => {
    const currentPlayer = turn;
    
    // Check if move is still valid for current board state
    if (!board[move.from.r][move.from.c] || board[move.from.r][move.from.c]?.player !== currentPlayer) {
      console.warn("Attempted to execute move on stale board state");
      return;
    }

    const { board: newBoard, pointsGained, didPromote } = applyMove(board, move);
    
    // Update Score
    setGamePoints(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + pointsGained }));
    setBoard(newBoard);
    setLastMove(move);
    setSelectedPos(null);

    // Multi-Jump Logic
    let isTurnOver = true;
    
    // If it was a jump AND piece didn't promote, check for more jumps
    if (move.isJump && !didPromote) {
      const moreMoves = getValidMoves(newBoard, currentPlayer, move.to); // check jumps from new pos
      if (moreMoves.length > 0) {
        // Chain continues
        isTurnOver = false;
        setMustJumpFrom(move.to);
        // We don't change turn
      }
    }

    if (isTurnOver) {
      setMustJumpFrom(null);
      const nextPlayer = turn === Player.RED ? Player.BLACK : Player.RED;
      
      const winResult = checkWinCondition(newBoard, nextPlayer);
      if (winResult.isGameOver) {
        endGame(winResult.winner, winResult.winBonus);
      } else {
        setTurn(nextPlayer);
      }
    }
  };

  const handleSquareClick = (pos: Position) => {
    if (gameStatus !== GameStatus.PLAYING) return;
    if (isAiThinking) return; 
    if (gameMode === GameMode.PVC && turn === Player.BLACK) return; 

    const clickedPiece = board[pos.r][pos.c];
    
    // 1. Select a piece
    if (clickedPiece && clickedPiece.player === turn) {
      // If we must jump from a specific piece, only allow selecting that piece
      if (mustJumpFrom) {
        if (pos.r !== mustJumpFrom.r || pos.c !== mustJumpFrom.c) {
          return; // Ignore clicks on other pieces during multi-jump
        }
      }

      // Check if this piece has any valid moves in the current turnMoves list
      const pieceMoves = turnMoves.filter(m => m.from.r === pos.r && m.from.c === pos.c);
      
      if (pieceMoves.length > 0) {
        setSelectedPos(pos);
        setValidMoves(pieceMoves);
      } else {
        // If mandatory jump exists elsewhere, this piece might not be movable
        setSelectedPos(null);
        setValidMoves([]);
      }
      return;
    }

    // 2. Move to empty square
    if (!clickedPiece && selectedPos) {
      const move = validMoves.find(m => m.to.r === pos.r && m.to.c === pos.c);
      if (move) {
        executeMove(move);
      } else {
        // Deselect if clicking invalid empty square, unless forced multi-jump
        if (!mustJumpFrom) {
          setSelectedPos(null);
          setValidMoves([]);
        }
      }
    }
  };

  // --- Render ---

  if (!gameMode) {
    // MAIN MENU
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4 overflow-auto">
        <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-2">
              CHECKERS
            </h1>
            <div className="text-sm font-mono text-gray-400">GEMINI AI EDITION</div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-gray-400 text-xs uppercase tracking-widest font-bold">Game Mode</h2>
              <button 
                onClick={() => startGame(GameMode.PVP)}
                className="w-full bg-gray-700 hover:bg-gray-600 active:scale-95 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-between group shadow-lg border border-gray-600"
              >
                <span>Player vs Player</span>
                <span className="text-2xl group-hover:scale-110 transition-transform grayscale group-hover:grayscale-0">👥</span>
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-gray-400 text-xs uppercase tracking-widest font-bold">Player vs Computer</h2>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => startGame(GameMode.PVC, level)}
                    className={`
                      aspect-square rounded-lg font-bold text-lg transition-all active:scale-90 shadow-md
                      flex items-center justify-center
                      ${level === 1 ? 'bg-green-600 hover:bg-green-500' : ''}
                      ${level === 2 ? 'bg-blue-600 hover:bg-blue-500' : ''}
                      ${level === 3 ? 'bg-yellow-600 hover:bg-yellow-500' : ''}
                      ${level === 4 ? 'bg-orange-600 hover:bg-orange-500' : ''}
                      ${level === 5 ? 'bg-red-600 hover:bg-red-500 ring-2 ring-red-900' : ''}
                      text-white
                    `}
                    title={`Level ${level}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 px-1 font-mono uppercase">
                <span>Easy</span>
                <span>Grandmaster</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GAME SCREEN
  return (
    <div className="fixed inset-0 bg-[#1a1a1a] flex flex-col overflow-hidden">
      {/* 1. Header & Controls - shrink to fit content */}
      <div className="shrink-0 p-4 pb-2 w-full max-w-2xl mx-auto">
        <GameControls 
          score={seriesScore}
          gamePoints={gamePoints}
          turn={turn}
          gameStatus={gameStatus}
          gameMode={gameMode}
          difficulty={difficulty}
          winner={winner}
          onReset={() => startGame(gameMode, difficulty)}
          onMenu={() => setGameMode(null)}
          isAiThinking={isAiThinking}
          mustJump={!!mustJumpFrom}
        />
      </div>

      {/* 2. Board Container - Grow to fill available space, but constrain to avoid overflow */}
      <div className="flex-grow flex items-center justify-center p-2 min-h-0">
        {/* Aspect square forces the board to be square, max-h-full/max-w-full fits it in container */}
        <div className="aspect-square h-full max-h-full max-w-full">
          <Board 
            board={board}
            selectedPos={selectedPos}
            validMoves={validMoves}
            onSquareClick={handleSquareClick}
            lastMove={lastMove}
            turnMoves={turnMoves}
            turn={turn}
          />
        </div>
      </div>

      {/* 3. Footer - minimalist */}
      <div className="shrink-0 p-2 text-center text-[10px] text-gray-600 font-mono">
        GEMINI-2.5-FLASH POWERED
      </div>
      
      {/* 4. Celebration Overlay */}
      {gameStatus === GameStatus.GAME_OVER && winner && (
        <Celebration 
          winner={winner} 
          onRestart={() => startGame(gameMode, difficulty)} 
          onMenu={() => setGameMode(null)} 
        />
      )}
    </div>
  );
};

export default App;