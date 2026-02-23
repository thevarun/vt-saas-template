import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEnv } = vi.hoisted(() => {
  const mockEnv = {
    DIFY_API_URL: undefined as string | undefined,
    DIFY_API_KEY: undefined as string | undefined,
    OPENAI_API_KEY: undefined as string | undefined,
    ANTHROPIC_API_KEY: undefined as string | undefined,
  };
  return { mockEnv };
});

vi.mock('@/libs/Env', () => ({ Env: mockEnv }));

// eslint-disable-next-line import/first
import { getChatConfig } from './chatConfig';

describe('chatConfig', () => {
  beforeEach(() => {
    mockEnv.DIFY_API_URL = undefined;
    mockEnv.DIFY_API_KEY = undefined;
    mockEnv.OPENAI_API_KEY = undefined;
    mockEnv.ANTHROPIC_API_KEY = undefined;
  });

  describe('getChatConfig', () => {
    it('should return both unconfigured when no env vars are set', () => {
      const config = getChatConfig();

      expect(config.dify.configured).toBe(false);
      expect(config.vercel.configured).toBe(false);
    });

    it('should detect Dify configuration when env vars are set', () => {
      mockEnv.DIFY_API_URL = 'https://api.dify.ai/v1';
      mockEnv.DIFY_API_KEY = 'test-key';

      const config = getChatConfig();

      expect(config.dify.configured).toBe(true);
      expect(config.dify.url).toBe('https://api.dify.ai/v1');
    });

    it('should not mark Dify as configured if only URL is set', () => {
      mockEnv.DIFY_API_URL = 'https://api.dify.ai/v1';

      const config = getChatConfig();

      expect(config.dify.configured).toBe(false);
    });

    it('should detect OpenAI configuration', () => {
      mockEnv.OPENAI_API_KEY = 'sk-test';

      const config = getChatConfig();

      expect(config.vercel.configured).toBe(true);
      expect(config.vercel.provider).toBe('openai');
    });

    it('should detect Anthropic configuration', () => {
      mockEnv.ANTHROPIC_API_KEY = 'sk-ant-test';

      const config = getChatConfig();

      expect(config.vercel.configured).toBe(true);
      expect(config.vercel.provider).toBe('anthropic');
    });

    it('should prefer OpenAI if both are configured', () => {
      mockEnv.OPENAI_API_KEY = 'sk-test';
      mockEnv.ANTHROPIC_API_KEY = 'sk-ant-test';

      const config = getChatConfig();

      expect(config.vercel.configured).toBe(true);
      expect(config.vercel.provider).toBe('openai');
    });

    it('should detect both chat providers when configured', () => {
      mockEnv.DIFY_API_URL = 'https://api.dify.ai/v1';
      mockEnv.DIFY_API_KEY = 'test-key';
      mockEnv.OPENAI_API_KEY = 'sk-test';

      const config = getChatConfig();

      expect(config.dify.configured).toBe(true);
      expect(config.vercel.configured).toBe(true);
    });
  });
});
