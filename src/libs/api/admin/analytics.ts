import { db } from '@/libs/DB';
import { createAdminClient } from '@/libs/supabase/admin';
import { feedback, userPreferences } from '@/models/Schema';

export type TrendData = {
  direction: 'up' | 'down' | 'neutral';
  value: string;
  percentage: number;
};

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
 * Calculate trend data comparing current vs previous period
 */
export function calculateTrend(current: number, previous: number): TrendData {
  if (previous === 0) {
    if (current === 0) {
      return {
        direction: 'neutral',
        value: 'No change',
        percentage: 0,
      };
    }
    return {
      direction: 'up',
      value: '+100%',
      percentage: 100,
    };
  }

  const percentageChange = ((current - previous) / previous) * 100;
  const rounded = Math.round(percentageChange * 10) / 10;

  if (rounded > 0) {
    return {
      direction: 'up',
      value: `+${rounded}%`,
      percentage: rounded,
    };
  }

  if (rounded < 0) {
    return {
      direction: 'down',
      value: `${rounded}%`,
      percentage: rounded,
    };
  }

  return {
    direction: 'neutral',
    value: 'No change',
    percentage: 0,
  };
}

/**
 * Get total users count (all time)
 */
async function getTotalUsers(): Promise<{ current: number; previous: number }> {
  const supabase = createAdminClient();

  // Get all users
  const { data, error } = await supabase
    .auth
    .admin
    .listUsers();

  if (error) {
    throw error;
  }

  const totalCount = data.users.length;

  // For total users, we compare against count from 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const usersThirtyDaysAgo = data.users.filter(
    user => new Date(user.created_at) < thirtyDaysAgo,
  ).length;

  return {
    current: totalCount,
    previous: usersThirtyDaysAgo,
  };
}

/**
 * Get signups in last 7 days
 */
async function getSignups7d(): Promise<{ current: number; previous: number }> {
  const supabase = createAdminClient();
  const now = new Date();

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  const currentCount = data.users.filter(
    user => new Date(user.created_at) >= sevenDaysAgo,
  ).length;

  const previousCount = data.users.filter((user) => {
    const createdAt = new Date(user.created_at);
    return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
  }).length;

  return { current: currentCount, previous: previousCount };
}

/**
 * Get signups in last 30 days
 */
async function getSignups30d(): Promise<{ current: number; previous: number }> {
  const supabase = createAdminClient();
  const now = new Date();

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  const currentCount = data.users.filter(
    user => new Date(user.created_at) >= thirtyDaysAgo,
  ).length;

  const previousCount = data.users.filter((user) => {
    const createdAt = new Date(user.created_at);
    return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
  }).length;

  return { current: currentCount, previous: previousCount };
}

/**
 * Get active users in last 7 days (based on last_sign_in_at)
 */
async function getActiveUsers7d(): Promise<{ current: number; previous: number }> {
  const supabase = createAdminClient();
  const now = new Date();

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  const currentCount = data.users.filter(
    user => user.last_sign_in_at && new Date(user.last_sign_in_at) >= sevenDaysAgo,
  ).length;

  const previousCount = data.users.filter((user) => {
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
async function getActivationRate(): Promise<{ current: number; previous: number }> {
  const supabase = createAdminClient();

  // Get all users
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  // Get user preferences (users who completed onboarding have username set)
  const userPrefs = await db.select().from(userPreferences);

  const totalUsers = users.users.length;
  const activatedUsers = userPrefs.filter(pref => pref.username).length;

  const currentRate = totalUsers > 0 ? (activatedUsers / totalUsers) * 100 : 0;

  // For previous period, we'll calculate based on users from 7-14 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const previousPeriodUsers = users.users.filter((user) => {
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
 * Get onboarding completion rate (same as activation for now)
 */
async function getOnboardingCompletion(): Promise<{ current: number; previous: number }> {
  // For now, onboarding completion is the same as activation rate
  return getActivationRate();
}

/**
 * Get total feedback count
 */
async function getFeedbackCount(): Promise<{ current: number; previous: number }> {
  // For feedback, we'll use simple trend based on last 30 vs previous 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Get all feedback records
  const allFeedback = await db.select().from(feedback);

  // Count feedback in last 30 days
  const recentCount = allFeedback.filter(
    f => new Date(f.createdAt) >= thirtyDaysAgo,
  ).length;

  // Count feedback between 30-60 days ago
  const previousCount = allFeedback.filter((f) => {
    const createdAt = new Date(f.createdAt);
    return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
  }).length;

  return { current: recentCount, previous: previousCount };
}

/**
 * Get daily signups for chart (last 30 days)
 */
async function getSignupsChartData(): Promise<Array<{ date: string; signups: number }>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  // Group signups by day
  const signupsByDay = new Map<string, number>();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Initialize all days with 0
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    signupsByDay.set(key, 0);
  }

  // Count signups per day
  data.users
    .filter(user => new Date(user.created_at) >= thirtyDaysAgo)
    .forEach((user) => {
      const date = new Date(user.created_at);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
    });

  // Convert to array
  return Array.from(signupsByDay.entries()).map(([date, signups]) => ({
    date,
    signups,
  }));
}

/**
 * Main function to fetch all analytics metrics
 */
export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  // Fetch all metrics in parallel
  const [
    totalUsers,
    signups7d,
    signups30d,
    activeUsers7d,
    activationRate,
    onboardingCompletion,
    feedbackCount,
    signupsChart,
  ] = await Promise.all([
    getTotalUsers(),
    getSignups7d(),
    getSignups30d(),
    getActiveUsers7d(),
    getActivationRate(),
    getOnboardingCompletion(),
    getFeedbackCount(),
    getSignupsChartData(),
  ]);

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
      value: activationRate.current,
      trend: calculateTrend(activationRate.current, activationRate.previous),
    },
    onboardingCompletion: {
      value: onboardingCompletion.current,
      trend: calculateTrend(onboardingCompletion.current, onboardingCompletion.previous),
    },
    feedbackCount: {
      value: feedbackCount.current,
      trend: calculateTrend(feedbackCount.current, feedbackCount.previous),
    },
    signupsChart,
  };
}
