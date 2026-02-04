import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import Game from "./components/Game";
import Leaderboard from "./components/Leaderboard";
import { motion, AnimatePresence } from "framer-motion";
import { Axe, LogIn, UserPlus, TreePine, User } from "lucide-react";

function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch {
      setError(flow === "signIn" ? "Invalid credentials" : "Could not create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-stone-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated wood grain background */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-amber-700"
            style={{
              top: `${12 + i * 12}%`,
              left: 0,
              right: 0,
            }}
            animate={{
              scaleX: [0.8, 1, 0.8],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Floating wood pieces */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-8 md:w-6 md:h-12 rounded bg-gradient-to-b from-amber-600 to-amber-800 shadow-lg"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6 md:mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 shadow-2xl mb-3 md:mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Axe className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </motion.div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 tracking-tight">
            LUMBERJACK NINJA
          </h1>
          <p className="text-amber-200/70 mt-2 font-medium text-sm md:text-base">Slice wood. Beat records. Become legend.</p>
        </div>

        {/* Auth Card */}
        <motion.div
          className="bg-stone-900/80 backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl border border-amber-900/50"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFlow("signIn")}
              className={`flex-1 py-2 md:py-3 rounded-xl font-bold transition-all text-sm md:text-base ${
                flow === "signIn"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-1 md:mr-2" />
              Sign In
            </button>
            <button
              onClick={() => setFlow("signUp")}
              className={`flex-1 py-2 md:py-3 rounded-xl font-bold transition-all text-sm md:text-base ${
                flow === "signUp"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1 md:mr-2" />
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                className="w-full px-4 py-3 md:py-4 rounded-xl bg-stone-800/50 border border-amber-900/30 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm md:text-base"
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                minLength={6}
                className="w-full px-4 py-3 md:py-4 rounded-xl bg-stone-800/50 border border-amber-900/30 text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm md:text-base"
              />
            </div>
            <input name="flow" type="hidden" value={flow} />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 md:py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold text-base md:text-lg shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? "Loading..." : flow === "signIn" ? "Enter the Forest" : "Join the Guild"}
            </motion.button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-stone-900/80 text-stone-500">or</span>
            </div>
          </div>

          <motion.button
            onClick={() => signIn("anonymous")}
            className="w-full mt-4 py-3 md:py-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold transition-all border border-amber-900/30 text-sm md:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <User className="w-4 h-4 inline mr-2" />
            Continue as Guest
          </motion.button>
        </motion.div>

        <p className="text-center text-stone-500 text-xs md:text-sm mt-6">
          <TreePine className="w-4 h-4 inline mr-1" />
          No trees were harmed in the making of this game
        </p>
      </motion.div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-stone-950 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Axe className="w-16 h-16 text-amber-500" />
      </motion.div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-stone-950 relative overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-lg border-b border-amber-900/30">
        <div className="max-w-6xl mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center">
              <Axe className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="font-display text-base md:text-xl font-bold text-amber-300 hidden sm:block">LUMBERJACK NINJA</span>
            <span className="font-display text-base font-bold text-amber-300 sm:hidden">LJ NINJA</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <motion.button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-semibold transition-all text-xs md:text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🏆 <span className="hidden sm:inline">Leaderboard</span>
            </motion.button>
            <motion.button
              onClick={() => signOut()}
              className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold transition-all text-xs md:text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Out
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 md:pt-16 min-h-screen pb-16">
        <AnimatePresence mode="wait">
          {showLeaderboard ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <Leaderboard onBack={() => setShowLeaderboard(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
            >
              <Game />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-2 md:py-3 text-center bg-stone-950/60 backdrop-blur-sm border-t border-amber-900/20">
        <p className="text-stone-500 text-xs">
          Requested by <span className="text-amber-600">@plantingtoearn</span> · Built by <span className="text-amber-600">@clonkbot</span>
        </p>
      </footer>
    </div>
  );
}
