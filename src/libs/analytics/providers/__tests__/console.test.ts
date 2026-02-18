import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsoleProvider } from '../console';

describe('ConsoleProvider', () => {
  let provider: ConsoleProvider;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;
  let consoleTableSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    provider = new ConsoleProvider();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    consoleTableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
    consoleTableSpy.mockRestore();
  });

  describe('init', () => {
    it('logs initialization message with color', () => {
      provider.init({ apiKey: '', enabled: false });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Console mode enabled'),
        expect.stringContaining('color'),
      );
    });
  });

  describe('identify', () => {
    it('logs user identification with properties', () => {
      const userId = 'user-123';
      const properties = { email: 'test@example.com', name: 'Test User' };

      provider.identify(userId, properties);

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('Identify User'),
        expect.stringContaining('color'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('User ID:', userId);
      expect(consoleTableSpy).toHaveBeenCalledWith(properties);
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('logs timestamp', () => {
      provider.identify('user-123');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Timestamp:',
        expect.any(String),
      );
    });

    it('skips console.table if no properties', () => {
      provider.identify('user-123');

      expect(consoleTableSpy).not.toHaveBeenCalled();
    });
  });

  describe('track', () => {
    it('logs event with properties in table format', () => {
      const eventName = 'signup_completed';
      const properties = { method: 'email' };

      provider.track(eventName, properties);

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining(eventName),
        expect.stringContaining('color'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Category:', 'auth');
      expect(consoleTableSpy).toHaveBeenCalledWith(properties);
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('logs timestamp', () => {
      provider.track('signup_completed', { method: 'email' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Timestamp:',
        expect.any(String),
      );
    });

    it('increments event counter', () => {
      provider.track('signup_completed', { method: 'email' });
      provider.track('login_completed', { method: 'google' });

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event #1'),
        expect.any(String),
      );
      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event #2'),
        expect.any(String),
      );
    });

    it('uses different colors for different categories', () => {
      provider.track('signup_completed', { method: 'email' }); // auth = green
      provider.track('onboarding_started', {}); // onboarding = blue
      provider.track('error_occurred', { error_type: 'test', error_message: 'test' }); // error = red

      const calls = consoleGroupSpy.mock.calls;

      expect(calls[0]?.[1]).toContain('#4CAF50'); // green for auth
      expect(calls[1]?.[1]).toContain('#2196F3'); // blue for onboarding
      expect(calls[2]?.[1]).toContain('#F44336'); // red for error
    });

    it('skips console.table if no properties', () => {
      provider.track('signup_started', {});

      expect(consoleTableSpy).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('logs reset message with color', () => {
      provider.reset();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('User reset'),
        expect.stringContaining('color'),
      );
    });

    it('resets event counter', () => {
      provider.track('signup_completed', { method: 'email' });
      provider.reset();
      provider.track('login_completed', { method: 'email' });

      const calls = consoleGroupSpy.mock.calls;

      expect(calls[0]?.[0]).toContain('Event #1');
      expect(calls[1]?.[0]).toContain('Event #1'); // Counter reset
    });
  });
});
