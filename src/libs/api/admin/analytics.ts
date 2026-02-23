import type { User } from '@supabase/supabase-js';

import { db } from '@/libs/DB';
import { fetchAllUsers } from '@/libs/queries/metrics';
import type { TrendData } from '@/libs/utils/calculateTrend';
import { calculateTrend } from '@/libs/utils/calculateTrend';
import { feedback, userPreferences } from '@/models/Schema';

export type { TrendData } from '@/libs/utils/calculateTrend';

export type AnalyticsMetrics = {
  totalUsers: { value: number; trend: TrendData };
  signups7d: { value: number; trend: TrendData };
  signups30d: { value: number; trend: TrendData };
  activeUsers7d: { value: number; trend: TrendData };
  activationRate: { value: number; trend: TrendData };
  onboardingCompletion: { value: number; trend: TrendData };
  feedbackCount: { value: number; trend: TrendData };
  signupsChart: Array<{ date: string; signups: number }>;
};

/**
 * Get total users count (all time)
 */
function getTotalUsers(users: User[]): { current: number; previous: number } {
  const totalCount = users.length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const usersThirtyDaysAgo = users.filter(
    user => new Date(user.created_at) < thirtyDaysAgo,
  ).length;

  return { current: totalCount, previous: usersThirtyDaysAgo };
}

/**
 * Get signups in last 7 days
 */
function getSignups7d(users: User[]): { current: number; previous: number } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const currentCount = users.filter(
    user => new Date(user.created_at) >= sevenDaysAgo,
  ).length;

  const previousCount = users.filter((user) => {
    const createdAt = new Date(user.created_at);
    return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
  }).length;

  return { current: currentCount, previous: previousCount };
}

/**
 * Get signups in last 30 days
 */
function getSignups30d(users: User[]): { current: number; previous: number } {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const currentCount = users.filter(
    user => new Date(user.created_at) >= thirtyDaysAgo,
  ).length;

  const previousCount = users.filter((user) => {
    const createdAt = new Date(user.created_at);
    return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
  }).length;

  return { current: currentCount, previous: previousCount };
}

/**
 * Get active users in last 7 days (based on last_sign_in_at)
 */
function getActiveUsers7d(users: User[]): { current: number; previous: number } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const currentCount = users.filter(
    user => user.last_sign_in_at && new Date(user.last_sign_in_at) >= sevenDaysAgo,
  ).length;

  const previousCount = users.filter((user) => {
    if (!user.last_sign_in_at) {
      return false;
    }
    const lastSignIn = new Date(user.last_sign_in_at);
    return lastSignIn >= fourteenDaysAgo && lastSignIn < sevenDaysAgo;
  }).length;

  return { current: currentCount, previous: previousCount };
}

/**
 * Get activation rate (percentage of users who completed onboarding)
 * Based on presence of username in user_preferences
 */
async function getActivationRate(
  users: User[],
): Promise<{ current: number; previous: number }> {
  const userPrefs = await db.select().from(userPreferences);

  const totalUsers = users.length;
  const activatedUsers = userPrefs.filter(pref => pref.username).length;
  const currentRate = totalUsers > 0 ? (activatedUsers / totalUsers) * 100 : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const previousPeriodUsers = users.filter((user) => {
    const createdAt = new Date(user.created_at);
    return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
  });

  const previousActivated = userPrefs.filter((pref) => {
    const userInPrevPeriod = previousPeriodUsers.find(u => u.id === pref.userId);
    return userInPrevPeriod && pref.username;
  }).length;

  const previousRate = previousPeriodUsers.length > 0
    ? (previousActivated / previousPeriodUsers.length) * 100
    : 0;

  return {
    current: Math.round(currentRate * 10) / 10,
    previous: Math.round(previousRate * 10) / 10,
  };
}

/**
 * Get total feedback count
 */
async function getFeedbackCount(): Promise<{ current: number; previous: number }> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const allFeedback = await db.select().from(feedback);

  const recentCount = allFeedback.filter(
    f => new Date(f.createdAt) >= thirtyDaysAgo,
  ).length;

  const previousCount = allFeedback.filter((f) => {
    const createdAt = new Date(f.createdAt);
    return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
  }).length;

  return { current: recentCount, previous: previousCount };
}

/**
 * Get daily signups for chart (last 30 days)
 */
function getSignupsChartData(users: User[]): Array<{ date: string; signups: number }> {
  const signupsByDay = new Map<string, number>();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    signupsByDay.set(key, 0);
  }

  users
    .filter(user => new Date(user.created_at) >= thirtyDaysAgo)
    .forEach((user) => {
      const date = new Date(user.created_at);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
    });

  return Array.from(signupsByDay.entries()).map(([date, signups]) => ({
    date,
    signups,
  }));
}

/**
 * Main function to fetch all analytics metrics.
 * Fetches all users once and passes to metric functions to avoid
 * redundant paginated API calls.
 */
export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  // Fetch all users (paginated) and feedback count in parallel
  const [users, feedbackCountData] = await Promise.all([
    fetchAllUsers(),
    getFeedbackCount(),
  ]);

  // Compute user-based metrics synchronously from the full user list
  const totalUsers = getTotalUsers(users);
  const signups7d = getSignups7d(users);
  const signups30d = getSignups30d(users);
  const activeUsers7d = getActiveUsers7d(users);
  const signupsChart = getSignupsChartData(users);

  // Activation rate needs a DB query for user_preferences
  const activationRateData = await getActivationRate(users);
  const onboardingCompletion = activationRateData;

  return {
    totalUsers: {
      value: totalUsers.current,
      trend: calculateTrend(totalUsers.current, totalUsers.previous),
    },
    signups7d: {
      value: signups7d.current,
      trend: calculateTrend(signups7d.current, signups7d.previous),
    },
    signups30d: {
      value: signups30d.current,
      trend: calculateTrend(signups30d.current, signups30d.previous),
    },
    activeUsers7d: {
      value: activeUsers7d.current,
      trend: calculateTrend(activeUsers7d.current, activeUsers7d.previous),
    },
    activationRate: {
      value: activationRateData.current,
      trend: calculateTrend(activationRateData.current, activationRateData.previous),
    },
    onboardingCompletion: {
      value: onboardingCompletion.current,
      trend: calculateTrend(onboardingCompletion.current, onboardingCompletion.previous),
    },
    feedbackCount: {
      value: feedbackCountData.current,
      trend: calculateTrend(feedbackCountData.current, feedbackCountData.previous),
    },
    signupsChart,
  };
}
