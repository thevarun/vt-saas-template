import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock the config module so the test controls provider/keys without real env.
const mockIsConfigured = vi.fn();
const mockOpenAI = vi.fn((modelId: string) => ({ id: modelId }));
const mockCreateOpenAI = vi.fn(() => mockOpenAI);

vi.mock('./config', () => ({
  get VERCEL_AI_CONFIG() {
    return {
      provider: 'openai' as const,
      model: 'gpt-4o-mini',
      openaiApiKey: 'sk-test',
      anthropicApiKey: undefined,
      timeout: 30000,
    };
  },
  isConfigured: mockIsConfigured,
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: mockCreateOpenAI,
}));

const { createAIModel, createAIProvider } = await import('./client');

describe('createAIModel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('routes a caller-supplied model id through the configured provider', async () => {
    mockIsConfigured.mockReturnValue(true);

    await createAIModel('gpt-4o');

    expect(mockOpenAI).toHaveBeenCalledWith('gpt-4o');
  });

  it('throws the same not-configured error as createAIProvider when keys are absent', async () => {
    mockIsConfigured.mockReturnValue(false);

    await expect(createAIModel('gpt-4o')).rejects.toThrow(/is not configured/);
    await expect(createAIProvider()).rejects.toThrow(/is not configured/);
  });
});
