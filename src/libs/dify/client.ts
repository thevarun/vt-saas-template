import { DIFY_CONFIG } from './config';
import type { DifyChatRequest, DifyChatResponse, DifyError } from './types';

/**
 * Dify API Client
 * Wrapper for Dify Chat Messages API with streaming support
 */

class DifyTimeoutError extends Error {
  public readonly status: number = 408;
  public readonly code: string = 'TIMEOUT';

  constructor(message: string) {
    super(message);
    this.name = 'DifyTimeoutError';
  }
}

export class DifyClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || DIFY_CONFIG.apiKey;
    this.baseUrl = DIFY_CONFIG.apiUrl;
  }

  /**
   * Send a chat message to Dify API
   * @param request Chat request parameters
   * @returns Response or stream depending on response_mode
   */
  async chatMessages(request: DifyChatRequest): Promise<DifyChatResponse | ReadableStream> {
    const url = `${this.baseUrl}${DIFY_CONFIG.endpoints.chatMessages}`;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DIFY_CONFIG.defaultTimeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          inputs: request.inputs || {},
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await this.handleError(response);
        throw error;
      }

      // For streaming responses, return the stream directly
      if (request.response_mode === 'streaming') {
        if (!response.body) {
          throw new Error('Response body is null for streaming request');
        }
        return response.body;
      }

      // For blocking responses, parse JSON
      return await response.json() as DifyChatResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new DifyTimeoutError(`Request timed out after ${DIFY_CONFIG.defaultTimeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Handle API errors and convert to DifyError
   */
  private async handleError(response: Response): Promise<DifyError> {
    let errorMessage = 'Unknown error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.code || errorCode;
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }

    return {
      status: response.status,
      code: errorCode,
      message: errorMessage,
    };
  }
}

/**
 * Create a Dify client instance
 */
export function createDifyClient(apiKey?: string): DifyClient {
  return new DifyClient(apiKey);
}
