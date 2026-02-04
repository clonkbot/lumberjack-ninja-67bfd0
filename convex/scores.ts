import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scores")
      .withIndex("by_score")
      .order("desc")
      .take(10);
  },
});

export const getUserScores = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("scores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5);
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const stats = await ctx.db
      .query("gameStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return stats;
  },
});

export const submitScore = mutation({
  args: {
    score: v.number(),
    woodSliced: v.number(),
    maxCombo: v.number(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Insert the score
    await ctx.db.insert("scores", {
      userId,
      username: args.username,
      score: args.score,
      woodSliced: args.woodSliced,
      maxCombo: args.maxCombo,
      createdAt: Date.now(),
    });

    // Update user stats
    const existingStats = await ctx.db
      .query("gameStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingStats) {
      await ctx.db.patch(existingStats._id, {
        totalGamesPlayed: existingStats.totalGamesPlayed + 1,
        totalWoodSliced: existingStats.totalWoodSliced + args.woodSliced,
        highestScore: Math.max(existingStats.highestScore, args.score),
        highestCombo: Math.max(existingStats.highestCombo, args.maxCombo),
      });
    } else {
      await ctx.db.insert("gameStats", {
        userId,
        totalGamesPlayed: 1,
        totalWoodSliced: args.woodSliced,
        highestScore: args.score,
        highestCombo: args.maxCombo,
      });
    }
  },
});
