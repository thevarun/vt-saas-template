/**
 * Helper Functions Tests
 * Tests for event tracking helper functions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAnalyticsProvider } from '../client';
import {
  trackError,
  trackFeatureFirstUse,
  trackFeedbackSubmitted,
  trackLoginCompleted,
  trackOnboardingCompleted,
  trackOnboardingStepCompleted,
  trackProfileUpdated,
  trackSignupCompleted,
} from '../helpers';

vi.mock('../client');

describe('Event Helper Functions', () => {
  const mockProvider = {
    track: vi.fn(),
    init: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAnalyticsProvider).mockReturnValue(mockProvider);
  });

  describe('trackSignupCompleted', () => {
    it('tracks signup with email method', () => {
      trackSignupCompleted('email');

      expect(mockProvider.track).toHaveBeenCalledWith(
        'signup_completed',
        expect.objectContaining({
          method: 'email',
        }),
      );
    });

    it('tracks signup with google method', () => {
      trackSignupCompleted('google');

      expect(mockProvider.track).toHaveBeenCalledWith(
        'signup_completed',
        expect.objectContaining({
          method: 'google',
        }),
      );
    });
  });

  describe('trackLoginCompleted', () => {
    it('tracks login with email method', () => {
      trackLoginCompleted('email');

      expect(mockProvider.track).toHaveBeenCalledWith(
        'login_completed',
        expect.objectContaining({
          method: 'email',
        }),
      );
    });
  });

  describe('trackOnboardingStepCompleted', () => {
    it('tracks onboarding step with step number and name', () => {
      trackOnboardingStepCompleted(1, 'username');

      expect(mockProvider.track).toHaveBeenCalledWith(
        'onboarding_step_completed',
        expect.objectContaining({
          step_number: 1,
          step_name: 'username',
        }),
      );
    });
  });

  describe('trackOnboardingCompleted', () => {
    it('tracks onboarding completion with total steps and duration', () => {
      trackOnboardingCompleted(3, 120);

      expect(mockProvider.track).toHaveBeenCalledWith(
        'onboarding_completed',
        expect.objectContaining({
          total_steps: 3,
          duration_seconds: 120,
        }),
      );
    });
  });

  describe('trackFeatureFirstUse', () => {
    it('tracks feature first use with feature name', () => {
      trackFeatureFirstUse('feedback');

      expect(mockProvider.track).toHaveBeenCalledWith(
        'feature_first_use',
        expect.objectContaining({
          feature_name: 'feedback',
        }),
      );
    });
  });

  describe('trackError', () => {
    it('tracks error with type and message', () => {
      trackError('api_error', 'Failed to fetch user data');

      expect(mockProvider.track).toHaveBeenCalledWith(
        'error_occurred',
        expect.objectContaining({
          error_type: 'api_error',
          error_message: expect.any(String),
        }),
      );
    });

    it('tracks error with location', () => {
      trackError('validation_error', 'Invalid email', 'signup_form');

      expect(mockProvider.track).toHaveBeenCalledWith(
        'error_occurred',
        expect.objectContaining({
          error_type: 'validation_error',
          error_message: expect.any(String),
          error_location: 'signup_form',
        }),
      );
    });

    it('sanitizes error messages', () => {
      const errorWithStack = 'Error: Failed\n  at someFunction\n  at anotherFunction';
      trackError('error', errorWithStack);

      const call = mockProvider.track.mock.calls[0];
      const properties = call?.[1];
      const sanitized = properties?.error_message as string;

      // Should only contain first line
      expect(sanitized).not.toContain('at someFunction');
      expect(sanitized).toContain('Error: Failed');
    });
  });

  describe('trackFeedbackSubmitted', () => {
    it('tracks feedback with type and screenshot flag', () => {
      trackFeedbackSubmitted('bug', true);

      expect(mockProvider.track).toHaveBeenCalledWith(
        'feedback_submitted',
        expect.objectContaining({
          feedback_type: 'bug',
          has_screenshot: true,
        }),
      );
    });
  });

  describe('trackProfileUpdated', () => {
    it('tracks profile update with fields', () => {
      trackProfileUpdated(['name', 'avatar']);

      expect(mockProvider.track).toHaveBeenCalledWith(
        'profile_updated',
        expect.objectContaining({
          fields_updated: ['name', 'avatar'],
        }),
      );
    });
  });
});
