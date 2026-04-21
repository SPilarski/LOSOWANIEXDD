import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Trash2, Play, Trophy, RotateCcw, Paintbrush, Music, Settings } from 'lucide-react';
import ReactPlayer from 'react-player';

// Workaround for typing issues in some environments
const Player = ReactPlayer as any;

interface FlyingName {
  id: number;
  name: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  rotation: number;
  duration: number;
}

const COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', 
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080'
];

export default function App() {
  const [namesInput, setNamesInput] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [flyingNames, setFlyingNames] = useState<FlyingName[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  // Local audio file name
  const audioUrl = '/muzyka.mp3';
  
  const drawingInterval = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const DURATION = 18000; // 18 seconds total

  const startDrawing = () => {
    const list = namesInput.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (list.length < 2) {
      alert('Wpisz przynajmniej 2 imiona (każde w nowej linii)');
      return;
    }
    setNames(list);
    setIsDrawing(true);
    
    // Only attempt to play if the player has signaled it is ready
    if (isPlayerReady) {
      setIsPlaying(true);
    }
    
    setWinner(null);
    setFlyingNames([]);
    setTimeLeft(DURATION);

    const randomIndex = Math.floor(Math.random() * list.length);
    const finalWinner = list[randomIndex];

    let counter = 0;
    drawingInterval.current = setInterval(() => {
      const randomName = list[Math.floor(Math.random() * list.length)];
      const newFlying: FlyingName = {
        id: Date.now() + counter++,
        name: randomName,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        fontSize: Math.random() * 40 + 20,
        rotation: Math.random() * 40 - 20,
        duration: 0.5 + Math.random() * 1,
      };

      setFlyingNames(prev => [...prev.slice(-30), newFlying]);
    }, 150);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          clearInterval(timerRef.current!);
          clearInterval(drawingInterval.current!);
          setIsDrawing(false);
          // Small delay before stopping music to prevent "play() interrupted" errors
          setTimeout(() => setIsPlaying(false), 50);
          setWinner(finalWinner);
          return 0;
        }
        return prev - 100;
      });
    }, 100);
  };

  const reset = () => {
    setIsDrawing(false);
    setTimeout(() => setIsPlaying(false), 50);
    setWinner(null);
    setFlyingNames([]);
    setTimeLeft(0);
    if (drawingInterval.current) clearInterval(drawingInterval.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      if (drawingInterval.current) clearInterval(drawingInterval.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Hidden Player */}
      <div className="hidden">
        <Player 
          url={audioUrl}
          playing={isPlaying}
          loop={true}
          volume={0.8}
          onReady={() => setIsPlayerReady(true)}
          onError={(e: any) => {
            console.error("Audio error:", e);
            setIsPlayerReady(false);
          }}
        />
      </div>

      {/* Container optimized for IG recording */}
      <div className="w-full max-w-[450px] aspect-[9/16] glass-card overflow-hidden flex flex-col relative shadow-2xl">
        
        {/* Top Header */}
        <div className="p-6 text-center border-b border-white/10">
          <h1 className="text-3xl font-black title-gradient tracking-tighter uppercase italic">
            LOSOWANIE
          </h1>
        </div>
        
        {/* Name Input Area (visible only when not drawing/no winner) */}
        <AnimatePresence mode="wait">
          {!isDrawing && !winner && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-6 py-4 flex flex-col gap-4 flex-grow"
            >
              <textarea
                className="glass-input flex-grow resize-none font-sans text-lg text-center"
                placeholder="Wpisz imiona tutaj...&#10;(jedno pod drugim)"
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                disabled={isDrawing}
              />
              <button 
                onClick={startDrawing}
                className="glass-button w-full text-xl py-5"
              >
                ROZPOCZNIJ
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drawing Canvas / Results Area */}
        {(isDrawing || winner) && (
          <div className="flex-grow relative overflow-hidden bg-black/20">
            
            {/* Flying names animation */}
            <AnimatePresence>
              {flyingNames.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0, opacity: 0, x: `${item.x}%`, y: `${item.y}%`, rotate: item.rotation }}
                  animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: item.duration, ease: "easeOut" }}
                  className="absolute pointer-events-none select-none paint-label font-black whitespace-nowrap z-10"
                  style={{ 
                    color: item.color,
                    fontSize: `${item.fontSize * 1.5}px`,
                    textShadow: '3px 3px 0px rgba(0,0,0,1)'
                  }}
                >
                  {item.name}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Winner Reveal */}
            <AnimatePresence>
              {winner && (
                <motion.div 
                  className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                    className="flex flex-col items-center gap-10"
                  >
                    <Trophy size={100} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                    
                    <div className="flex flex-col gap-4">
                      <span className="text-sm font-bold tracking-[10px] text-indigo-300 uppercase opacity-60">Zwycięzca</span>
                      <motion.div 
                        className="text-6xl font-black break-all px-4"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ textShadow: '0 0 30px rgba(129,140,248,0.8)' }}
                      >
                        {winner}
                      </motion.div>
                    </div>

                    <div className="flex flex-col gap-4 w-full">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-2xl font-black text-indigo-400"
                      >
                        GRATULACJE! 🎉
                      </motion.div>
                      
                      <button 
                        onClick={reset}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all"
                      >
                        Losuj ponownie
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Drawing Status */}
            {isDrawing && !winner && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none">
                <div className="text-sm uppercase tracking-[6px] font-bold text-indigo-300/60 animate-pulse">
                  Losowanie trwa...
                </div>
                <div className="text-8xl font-black font-mono title-gradient">
                  {(timeLeft / 1000).toFixed(0)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Background Visual Decoration */}
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-indigo-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-purple-600 rounded-full blur-[120px]" />
        </div>
      </div>
    </div>
  );
}

