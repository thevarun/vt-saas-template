/**
 * Tests for Activation Tracking
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  hasCompletedOnboarding,
  isUserActivated,
  markOnboardingCompleted,
  resetActivationState,
  shouldTrackActivation,
  trackActivation,
} from '../activation';
import * as helpers from '../helpers';

// Mock the helpers module
vi.mock('../helpers', () => ({
  trackUserActivated: vi.fn(),
}));

describe('activation tracking', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('isUserActivated', () => {
    it('returns false when user is not activated', () => {
      expect(isUserActivated()).toBe(false);
    });

    it('returns true when user is activated', () => {
      localStorage.setItem('user_activated', 'true');

      expect(isUserActivated()).toBe(true);
    });
  });

  describe('markOnboardingCompleted', () => {
    it('marks onboarding as completed', () => {
      markOnboardingCompleted();

      expect(hasCompletedOnboarding()).toBe(true);
    });
  });

  describe('hasCompletedOnboarding', () => {
    it('returns false when onboarding not completed', () => {
      expect(hasCompletedOnboarding()).toBe(false);
    });

    it('returns true when onboarding is completed', () => {
      markOnboardingCompleted();

      expect(hasCompletedOnboarding()).toBe(true);
    });
  });

  describe('shouldTrackActivation', () => {
    it('returns false if already activated', () => {
      localStorage.setItem('user_activated', 'true');
      markOnboardingCompleted();

      expect(shouldTrackActivation()).toBe(false);
    });

    it('returns false if onboarding not completed', () => {
      localStorage.removeItem('onboarding_completed');

      expect(shouldTrackActivation()).toBe(false);
    });

    it('returns true if onboarding completed and not activated', () => {
      markOnboardingCompleted();

      expect(shouldTrackActivation()).toBe(true);
    });
  });

  describe('trackActivation', () => {
    it('tracks activation with correct time calculation (Date object)', () => {
      markOnboardingCompleted();

      const userCreatedAt = new Date(Date.now() - 120 * 1000); // 120 seconds ago
      trackActivation('feedback_submitted', userCreatedAt);

      expect(helpers.trackUserActivated).toHaveBeenCalledWith(
        'feedback_submitted',
        expect.any(Number),
      );

      const [[, timeSeconds]] = (helpers.trackUserActivated as any).mock.calls;

      expect(timeSeconds).toBeGreaterThanOrEqual(119);
      expect(timeSeconds).toBeLessThanOrEqual(121);
    });

    it('tracks activation with correct time calculation (string timestamp)', () => {
      markOnboardingCompleted();

      const userCreatedAt = new Date(Date.now() - 60 * 1000).toISOString(); // 60 seconds ago
      trackActivation('profile_updated', userCreatedAt);

      expect(helpers.trackUserActivated).toHaveBeenCalledWith(
        'profile_updated',
        expect.any(Number),
      );

      const [[, timeSeconds]] = (helpers.trackUserActivated as any).mock.calls;

      expect(timeSeconds).toBeGreaterThanOrEqual(59);
      expect(timeSeconds).toBeLessThanOrEqual(61);
    });

    it('marks user as activated after tracking', () => {
      markOnboardingCompleted();

      const userCreatedAt = new Date();
      trackActivation('feedback_submitted', userCreatedAt);

      expect(isUserActivated()).toBe(true);
    });

    it('does not track if already activated', () => {
      localStorage.setItem('user_activated', 'true');
      markOnboardingCompleted();

      trackActivation('feedback_submitted', new Date());

      expect(helpers.trackUserActivated).not.toHaveBeenCalled();
    });

    it('does not track if onboarding not completed', () => {
      trackActivation('feedback_submitted', new Date());

      expect(helpers.trackUserActivated).not.toHaveBeenCalled();
    });

    it('only tracks activation once', () => {
      markOnboardingCompleted();

      trackActivation('feedback_submitted', new Date());
      trackActivation('profile_updated', new Date());

      expect(helpers.trackUserActivated).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetActivationState', () => {
    it('clears activation and onboarding state', () => {
      localStorage.setItem('user_activated', 'true');
      markOnboardingCompleted();

      resetActivationState();

      expect(isUserActivated()).toBe(false);
      expect(hasCompletedOnboarding()).toBe(false);
    });
  });
});
