import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsoleProvider } from '../console';

describe('ConsoleProvider', () => {
  let provider: ConsoleProvider;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    provider = new ConsoleProvider();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  describe('init', () => {
    it('logs initialization message', () => {
      provider.init({ apiKey: '', enabled: false });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Console mode enabled'),
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
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('User ID:', userId);
      expect(consoleLogSpy).toHaveBeenCalledWith('Properties:', properties);
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('logs timestamp', () => {
      provider.identify('user-123');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Timestamp:',
        expect.any(String),
      );
    });
  });

  describe('track', () => {
    it('logs event with properties', () => {
      const eventName = 'button_clicked';
      const properties = { buttonName: 'Sign Up' };

      provider.track(eventName, properties);

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        expect.stringContaining(eventName),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Event:', eventName);
      expect(consoleLogSpy).toHaveBeenCalledWith('Properties:', properties);
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('logs timestamp', () => {
      provider.track('test_event');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Timestamp:',
        expect.any(String),
      );
    });
  });

  describe('reset', () => {
    it('logs reset message', () => {
      provider.reset();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('User reset'),
      );
    });
  });
});
