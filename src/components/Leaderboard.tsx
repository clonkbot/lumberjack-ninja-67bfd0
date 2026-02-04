import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Trophy, Target, Zap, ArrowLeft, Crown, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  _id: string;
  username: string;
  score: number;
  woodSliced: number;
  maxCombo: number;
  createdAt: number;
}

interface LeaderboardProps {
  onBack: () => void;
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const leaderboard = useQuery(api.scores.getLeaderboard);
  const userScores = useQuery(api.scores.getUserScores);
  const userStats = useQuery(api.scores.getUserStats);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-5 h-5 md:w-6 md:h-6 text-gray-300" />;
      case 2:
        return <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />;
      default:
        return <span className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-stone-500 font-bold text-sm md:text-base">{index + 1}</span>;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "from-yellow-900/50 to-yellow-950/50 border-yellow-600/50";
      case 1:
        return "from-gray-800/50 to-gray-900/50 border-gray-500/50";
      case 2:
        return "from-amber-900/50 to-amber-950/50 border-amber-700/50";
      default:
        return "from-stone-800/30 to-stone-900/30 border-stone-700/30";
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] p-3 md:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <motion.button
            onClick={onBack}
            className="p-2 md:p-3 rounded-lg md:rounded-xl bg-stone-800/50 hover:bg-stone-800 text-amber-300 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">
              LEADERBOARD
            </h1>
            <p className="text-stone-400 text-sm md:text-base">Top lumberjack ninjas</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Global Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-stone-900/50 backdrop-blur-lg rounded-xl md:rounded-2xl p-4 md:p-6 border border-amber-900/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
              <h2 className="text-lg md:text-xl font-bold text-amber-300">Top 10 Global</h2>
            </div>

            {leaderboard === undefined ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 md:h-14 bg-stone-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-stone-500 text-center py-8 text-sm md:text-base">No scores yet. Be the first!</p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {leaderboard.map((entry: LeaderboardEntry, index: number) => (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-r ${getRankColor(index)} border transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex-shrink-0">
                      {getRankIcon(index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-amber-100 truncate text-sm md:text-base">{entry.username}</div>
                      <div className="flex items-center gap-2 md:gap-3 text-xs text-stone-400">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {entry.woodSliced}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {entry.maxCombo}x
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg md:text-xl font-black text-amber-400">{entry.score}</div>
                      <div className="text-xs text-stone-500">pts</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Personal Stats & History */}
          <div className="space-y-4 md:space-y-6">
            {/* Stats Card */}
            {userStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-stone-900/50 backdrop-blur-lg rounded-xl md:rounded-2xl p-4 md:p-6 border border-amber-900/30"
              >
                <h2 className="text-lg md:text-xl font-bold text-amber-300 mb-4">Your Stats</h2>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-stone-800/50 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
                    <div className="text-2xl md:text-3xl font-black text-amber-400">{userStats.highestScore}</div>
                    <div className="text-xs text-stone-400">Best Score</div>
                  </div>
                  <div className="bg-stone-800/50 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
                    <div className="text-2xl md:text-3xl font-black text-orange-400">{userStats.totalGamesPlayed}</div>
                    <div className="text-xs text-stone-400">Games Played</div>
                  </div>
                  <div className="bg-stone-800/50 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
                    <div className="text-2xl md:text-3xl font-black text-green-400">{userStats.totalWoodSliced}</div>
                    <div className="text-xs text-stone-400">Total Sliced</div>
                  </div>
                  <div className="bg-stone-800/50 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
                    <div className="text-2xl md:text-3xl font-black text-red-400">{userStats.highestCombo}x</div>
                    <div className="text-xs text-stone-400">Best Combo</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recent Scores */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-stone-900/50 backdrop-blur-lg rounded-xl md:rounded-2xl p-4 md:p-6 border border-amber-900/30"
            >
              <h2 className="text-lg md:text-xl font-bold text-amber-300 mb-4">Your Recent Games</h2>

              {userScores === undefined ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 md:h-12 bg-stone-800/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : userScores.length === 0 ? (
                <p className="text-stone-500 text-center py-4 text-sm md:text-base">Play a game to see your history!</p>
              ) : (
                <div className="space-y-2">
                  {userScores.map((score: LeaderboardEntry, index: number) => (
                    <motion.div
                      key={score._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-stone-800/30 border border-stone-700/30"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-stone-500 text-sm">#{index + 1}</span>
                        <div>
                          <div className="font-semibold text-amber-200 text-sm md:text-base">{score.score} pts</div>
                          <div className="text-xs text-stone-500">
                            {new Date(score.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-xs text-stone-400">
                        <span>{score.woodSliced} sliced</span>
                        <span>{score.maxCombo}x combo</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
