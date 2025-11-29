import React, { useEffect, useRef } from 'react';
import { Player } from '../types';

interface CelebrationProps {
  winner: Player;
  onRestart: () => void;
  onMenu: () => void;
}

const Celebration: React.FC<CelebrationProps> = ({ winner, onRestart, onMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const particles: Particle[] = [];
    const particleCount = 150;
    
    // Theme colors based on winner
    const colors = winner === Player.RED 
      ? ['#ef4444', '#dc2626', '#fbbf24', '#f59e0b', '#ffffff'] // Red & Gold
      : ['#1f2937', '#111827', '#fbbf24', '#d97706', '#9ca3af']; // Black & Gold

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height - canvas!.height;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = Math.random() * 4 + 2; // Fall speed
        this.size = Math.random() * 8 + 4;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        // Reset if off screen
        if (this.y > canvas!.height) {
          this.y = -20;
          this.x = Math.random() * canvas!.width;
          this.vy = Math.random() * 4 + 2;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation Loop
    let animationId: number;
    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [winner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        
        <style>{`
          @keyframes popIn {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        <div className="relative bg-[#1a1a1a] p-8 rounded-2xl border-4 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] flex flex-col items-center gap-6 max-w-sm w-full mx-4" style={{ animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
            {/* Crown Icon */}
            <div className="text-7xl animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
              🏆
            </div>

            <div className="text-center space-y-2">
              <h2 className={`text-4xl font-black italic tracking-tighter uppercase ${winner === Player.RED ? 'text-red-500' : 'text-gray-200'}`}>
                {winner === Player.RED ? 'Red' : 'Black'} Wins!
              </h2>
              <p className="text-yellow-500 font-bold tracking-widest text-xs uppercase">Victory Achieved</p>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button 
                onClick={onMenu}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-colors text-sm uppercase tracking-wide border border-gray-700"
              >
                Menu
              </button>
              <button 
                onClick={onRestart}
                className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition-all hover:scale-105 hover:shadow-lg text-sm uppercase tracking-wide border border-yellow-600"
              >
                Play Again
              </button>
            </div>
        </div>
    </div>
  );
};

export default Celebration;