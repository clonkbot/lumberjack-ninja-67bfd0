import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Play, RotateCcw, Zap, Target, Timer, Trophy } from "lucide-react";

interface WoodPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  type: "log" | "plank" | "stump" | "branch";
  velocityY: number;
  velocityX: number;
  sliced: boolean;
  sliceAngle: number;
}

interface SliceTrail {
  id: number;
  points: { x: number; y: number }[];
  timestamp: number;
}

const WOOD_TYPES = ["log", "plank", "stump", "branch"] as const;
const GAME_DURATION = 60;

export default function Game() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "ended">("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [woodSliced, setWoodSliced] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [woods, setWoods] = useState<WoodPiece[]>([]);
  const [sliceTrails, setSliceTrails] = useState<SliceTrail[]>([]);
  const [username, setUsername] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const isSlicing = useRef(false);
  const currentTrailPoints = useRef<{ x: number; y: number }[]>([]);
  const trailIdRef = useRef(0);
  const lastComboTime = useRef(0);
  const woodIdRef = useRef(0);

  const submitScore = useMutation(api.scores.submitScore);
  const userStats = useQuery(api.scores.getUserStats);

  // Spawn wood pieces
  const spawnWood = useCallback(() => {
    if (gameState !== "playing") return;

    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const rect = gameArea.getBoundingClientRect();
    const type = WOOD_TYPES[Math.floor(Math.random() * WOOD_TYPES.length)];

    const newWood: WoodPiece = {
      id: woodIdRef.current++,
      x: Math.random() * (rect.width - 100) + 50,
      y: rect.height + 100,
      rotation: Math.random() * 360,
      type,
      velocityY: -(Math.random() * 8 + 12),
      velocityX: (Math.random() - 0.5) * 4,
      sliced: false,
      sliceAngle: 0,
    };

    setWoods((prev) => [...prev, newWood]);
  }, [gameState]);

  // Game physics loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const physicsInterval = setInterval(() => {
      setWoods((prev) => {
        const gameArea = gameAreaRef.current;
        if (!gameArea) return prev;

        const rect = gameArea.getBoundingClientRect();

        return prev
          .map((wood) => ({
            ...wood,
            x: wood.x + wood.velocityX,
            y: wood.y + wood.velocityY,
            velocityY: wood.velocityY + 0.5,
            rotation: wood.rotation + (wood.sliced ? 15 : 3),
          }))
          .filter((wood) => wood.y < rect.height + 200 && wood.y > -200);
      });
    }, 16);

    return () => clearInterval(physicsInterval);
  }, [gameState]);

  // Spawn timer
  useEffect(() => {
    if (gameState !== "playing") return;

    const spawnInterval = setInterval(spawnWood, 800);
    return () => clearInterval(spawnInterval);
  }, [gameState, spawnWood]);

  // Game timer
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("ended");
          setShowNamePrompt(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Combo decay
  useEffect(() => {
    if (gameState !== "playing") return;

    const comboDecay = setInterval(() => {
      const now = Date.now();
      if (now - lastComboTime.current > 2000 && combo > 0) {
        setCombo(0);
      }
    }, 500);

    return () => clearInterval(comboDecay);
  }, [gameState, combo]);

  // Clean up slice trails
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setSliceTrails((prev) => prev.filter((trail) => now - trail.timestamp < 300));
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  const getRelativePosition = (clientX: number, clientY: number) => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return { x: 0, y: 0 };
    const rect = gameArea.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleSliceStart = (clientX: number, clientY: number) => {
    if (gameState !== "playing") return;
    isSlicing.current = true;
    const pos = getRelativePosition(clientX, clientY);
    currentTrailPoints.current = [pos];
  };

  const handleSliceMove = (clientX: number, clientY: number) => {
    if (!isSlicing.current || gameState !== "playing") return;

    const pos = getRelativePosition(clientX, clientY);
    currentTrailPoints.current.push(pos);

    // Check for wood collisions
    setWoods((prev) => {
      let newWoods = [...prev];
      let slicedCount = 0;

      newWoods = newWoods.map((wood) => {
        if (wood.sliced) return wood;

        const woodSize = getWoodSize(wood.type);
        const dx = pos.x - wood.x;
        const dy = pos.y - wood.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < woodSize / 2 + 20) {
          slicedCount++;
          const sliceAngle = Math.atan2(dy, dx) * (180 / Math.PI);
          return {
            ...wood,
            sliced: true,
            sliceAngle,
            velocityX: wood.velocityX + (Math.random() - 0.5) * 10,
            velocityY: wood.velocityY - 5,
          };
        }
        return wood;
      });

      if (slicedCount > 0) {
        const now = Date.now();
        lastComboTime.current = now;

        setCombo((prev) => {
          const newCombo = prev + slicedCount;
          setMaxCombo((max) => Math.max(max, newCombo));
          return newCombo;
        });

        setWoodSliced((prev) => prev + slicedCount);

        const comboMultiplier = Math.min(combo + 1, 10);
        const points = slicedCount * 10 * comboMultiplier;
        setScore((prev) => prev + points);
      }

      return newWoods;
    });

    // Update slice trail
    if (currentTrailPoints.current.length >= 2) {
      setSliceTrails((prev) => [
        ...prev,
        {
          id: trailIdRef.current++,
          points: [...currentTrailPoints.current.slice(-10)],
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleSliceEnd = () => {
    isSlicing.current = false;
    currentTrailPoints.current = [];
  };

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setWoodSliced(0);
    setTimeLeft(GAME_DURATION);
    setWoods([]);
    woodIdRef.current = 0;
  };

  const handleSubmitScore = async () => {
    if (!username.trim()) return;
    await submitScore({
      score,
      woodSliced,
      maxCombo,
      username: username.trim(),
    });
    setShowNamePrompt(false);
    setGameState("idle");
  };

  const getWoodSize = (type: string) => {
    switch (type) {
      case "log": return 80;
      case "plank": return 100;
      case "stump": return 70;
      case "branch": return 90;
      default: return 80;
    }
  };

  const renderWood = (wood: WoodPiece) => {
    const size = getWoodSize(wood.type);

    const woodStyles: Record<string, { bg: string; rings: string }> = {
      log: { bg: "from-amber-700 via-amber-600 to-amber-800", rings: "border-amber-900" },
      plank: { bg: "from-yellow-700 via-yellow-600 to-yellow-800", rings: "border-yellow-900" },
      stump: { bg: "from-amber-800 via-amber-700 to-amber-900", rings: "border-amber-950" },
      branch: { bg: "from-lime-800 via-lime-700 to-lime-900", rings: "border-lime-950" },
    };

    const style = woodStyles[wood.type];

    if (wood.sliced) {
      return (
        <motion.div
          key={wood.id}
          className="absolute pointer-events-none"
          style={{
            left: wood.x,
            top: wood.y,
            width: size,
            height: size,
          }}
          initial={{ scale: 1 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Split pieces */}
          <motion.div
            className={`absolute w-1/2 h-full bg-gradient-to-br ${style.bg} rounded-lg shadow-lg`}
            style={{ left: 0, transformOrigin: "right center" }}
            animate={{ x: -30, rotate: -30 }}
          />
          <motion.div
            className={`absolute w-1/2 h-full bg-gradient-to-bl ${style.bg} rounded-lg shadow-lg`}
            style={{ right: 0, transformOrigin: "left center" }}
            animate={{ x: 30, rotate: 30 }}
          />
          {/* Sawdust particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-amber-300 rounded-full"
              initial={{ x: size / 2, y: size / 2 }}
              animate={{
                x: size / 2 + (Math.random() - 0.5) * 100,
                y: size / 2 + (Math.random() - 0.5) * 100,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </motion.div>
      );
    }

    return (
      <motion.div
        key={wood.id}
        className="absolute cursor-crosshair"
        style={{
          left: wood.x - size / 2,
          top: wood.y - size / 2,
          width: size,
          height: size,
          rotate: wood.rotation,
        }}
      >
        <div className={`w-full h-full bg-gradient-to-br ${style.bg} rounded-lg shadow-xl relative overflow-hidden`}>
          {/* Wood grain texture */}
          <div className={`absolute inset-2 rounded border-2 ${style.rings} opacity-30`} />
          <div className={`absolute inset-4 rounded border ${style.rings} opacity-20`} />
          {wood.type === "log" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-1/3 h-1/3 rounded-full border-2 ${style.rings} opacity-40`} />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative h-[calc(100vh-7rem)] md:h-[calc(100vh-8rem)] overflow-hidden">
      {/* Game Stats */}
      <div className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 z-40 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1 md:gap-2">
          <motion.div
            className="bg-stone-900/80 backdrop-blur-lg rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2 border border-amber-900/30"
            animate={{ scale: combo > 5 ? [1, 1.05, 1] : 1 }}
          >
            <div className="flex items-center gap-1 md:gap-2">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
              <span className="text-xl md:text-2xl font-black text-amber-300">{score}</span>
            </div>
          </motion.div>

          {combo > 0 && (
            <motion.div
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg px-2 md:px-3 py-1 shadow-lg"
            >
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-yellow-300" />
                <span className="text-sm md:text-lg font-bold text-white">{combo}x COMBO!</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col gap-1 md:gap-2 items-end">
          <div className="bg-stone-900/80 backdrop-blur-lg rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2 border border-amber-900/30">
            <div className="flex items-center gap-1 md:gap-2">
              <Timer className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
              <span className={`text-xl md:text-2xl font-black ${timeLeft <= 10 ? "text-red-400" : "text-amber-300"}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          <div className="bg-stone-900/80 backdrop-blur-lg rounded-lg px-2 md:px-3 py-1 border border-amber-900/30">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
              <span className="text-xs md:text-sm font-semibold text-stone-300">{woodSliced} sliced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className="absolute inset-0 cursor-crosshair select-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, #78350f 0%, #1c1917 70%, #0c0a09 100%)",
        }}
        onMouseDown={(e) => handleSliceStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleSliceMove(e.clientX, e.clientY)}
        onMouseUp={handleSliceEnd}
        onMouseLeave={handleSliceEnd}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleSliceStart(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          handleSliceMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={handleSliceEnd}
      >
        {/* Forest background elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-stone-950/80 to-transparent" />

        {/* Trees in background */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 opacity-20"
            style={{ left: `${10 + i * 20}%` }}
          >
            <div className="w-8 md:w-12 h-48 md:h-64 bg-gradient-to-t from-amber-900 to-amber-800 rounded-t-lg" />
            <div
              className="absolute -top-12 md:-top-16 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[30px] md:border-l-[40px] border-r-[30px] md:border-r-[40px] border-b-[60px] md:border-b-[80px] border-transparent border-b-green-900"
            />
          </div>
        ))}

        {/* Slice trails */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
          {sliceTrails.map((trail) => (
            <motion.path
              key={trail.id}
              d={`M ${trail.points.map((p) => `${p.x},${p.y}`).join(" L ")}`}
              fill="none"
              stroke="url(#sliceGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 1, pathLength: 1 }}
              animate={{ opacity: 0, pathLength: 0 }}
              transition={{ duration: 0.3 }}
            />
          ))}
          <defs>
            <linearGradient id="sliceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>

        {/* Wood pieces */}
        {woods.map(renderWood)}

        {/* Idle State */}
        <AnimatePresence>
          {gameState === "idle" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center z-50"
            >
              <div className="text-center px-4">
                <motion.h2
                  className="text-3xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 mb-4 md:mb-6"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  LUMBERJACK NINJA
                </motion.h2>
                <p className="text-amber-200/70 text-base md:text-lg mb-6 md:mb-8">Swipe to slice the wood!</p>

                {userStats && (
                  <div className="mb-6 md:mb-8 grid grid-cols-2 gap-3 md:gap-4 max-w-xs mx-auto">
                    <div className="bg-stone-900/60 rounded-lg md:rounded-xl p-2 md:p-3 border border-amber-900/30">
                      <div className="text-lg md:text-2xl font-bold text-amber-400">{userStats.highestScore}</div>
                      <div className="text-xs text-stone-400">Best Score</div>
                    </div>
                    <div className="bg-stone-900/60 rounded-lg md:rounded-xl p-2 md:p-3 border border-amber-900/30">
                      <div className="text-lg md:text-2xl font-bold text-orange-400">{userStats.totalGamesPlayed}</div>
                      <div className="text-xs text-stone-400">Games Played</div>
                    </div>
                  </div>
                )}

                <motion.button
                  onClick={startGame}
                  className="px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold text-lg md:text-xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5 md:w-6 md:h-6 inline mr-2" />
                  START GAME
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over / Name Prompt */}
        <AnimatePresence>
          {showNamePrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-950/90 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-stone-900/90 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-md w-full border border-amber-900/50"
              >
                <h2 className="text-2xl md:text-3xl font-black text-amber-300 text-center mb-2">GAME OVER!</h2>

                <div className="grid grid-cols-3 gap-3 md:gap-4 my-4 md:my-6">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-amber-400">{score}</div>
                    <div className="text-xs text-stone-400">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-orange-400">{woodSliced}</div>
                    <div className="text-xs text-stone-400">Sliced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-red-400">{maxCombo}x</div>
                    <div className="text-xs text-stone-400">Max Combo</div>
                  </div>
                </div>

                <div className="mb-4 md:mb-6">
                  <label className="block text-amber-200 font-semibold mb-2 text-sm md:text-base">Enter your name for the leaderboard:</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    maxLength={20}
                    className="w-full px-4 py-2 md:py-3 rounded-lg md:rounded-xl bg-stone-800 border border-amber-900/30 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-sm md:text-base"
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => {
                      setShowNamePrompt(false);
                      setGameState("idle");
                    }}
                    className="flex-1 py-2 md:py-3 rounded-lg md:rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold transition-all text-sm md:text-base"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Skip
                  </motion.button>
                  <motion.button
                    onClick={handleSubmitScore}
                    disabled={!username.trim()}
                    className="flex-1 py-2 md:py-3 rounded-lg md:rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold disabled:opacity-50 transition-all text-sm md:text-base"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Submit Score
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
