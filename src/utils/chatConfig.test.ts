import { beforeEach, describe, expect, it } from 'vitest';

import { getChatConfig } from './chatConfig';

describe('chatConfig', () => {
  beforeEach(() => {
    // Clear all environment variables before each test
    delete process.env.DIFY_API_URL;
    delete process.env.DIFY_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('getChatConfig', () => {
    it('should return both unconfigured when no env vars are set', () => {
      const config = getChatConfig();

      expect(config.dify.configured).toBe(false);
      expect(config.vercel.configured).toBe(false);
    });

    it('should detect Dify configuration when env vars are set', () => {
      process.env.DIFY_API_URL = 'https://api.dify.ai/v1';
      process.env.DIFY_API_KEY = 'test-key';

      const config = getChatConfig();

      expect(config.dify.configured).toBe(true);
      expect(config.dify.url).toBe('https://api.dify.ai/v1');
    });

    it('should not mark Dify as configured if only URL is set', () => {
      process.env.DIFY_API_URL = 'https://api.dify.ai/v1';

      const config = getChatConfig();

      expect(config.dify.configured).toBe(false);
    });

    it('should detect OpenAI configuration', () => {
      process.env.OPENAI_API_KEY = 'sk-test';

      const config = getChatConfig();

      expect(config.vercel.configured).toBe(true);
      expect(config.vercel.provider).toBe('openai');
    });

    it('should detect Anthropic configuration', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

      const config = getChatConfig();

      expect(config.vercel.configured).toBe(true);
      expect(config.vercel.provider).toBe('anthropic');
    });

    it('should prefer OpenAI if both are configured', () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

      const config = getChatConfig();

      expect(config.vercel.configured).toBe(true);
      expect(config.vercel.provider).toBe('openai');
    });

    it('should detect both chat providers when configured', () => {
      process.env.DIFY_API_URL = 'https://api.dify.ai/v1';
      process.env.DIFY_API_KEY = 'test-key';
      process.env.OPENAI_API_KEY = 'sk-test';

      const config = getChatConfig();

      expect(config.dify.configured).toBe(true);
      expect(config.vercel.configured).toBe(true);
    });
  });
});
