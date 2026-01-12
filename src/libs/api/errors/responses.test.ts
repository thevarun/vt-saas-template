/**
 * Unit tests for API error response builders
 */

import { describe, expect, it } from 'vitest';

import {
  conflictError,
  createErrorResponse,
  dbError,
  difyError,
  forbiddenError,
  internalError,
  invalidRequestError,
  notFoundError,
  unauthorizedError,
  validationError,
} from './responses';
import type { ApiErrorResponse } from './types';
import { HTTP_STATUS } from './types';

describe('API Error Response Builders', () => {
  describe('createErrorResponse', () => {
    it('should create error response with all fields', async () => {
      const response = createErrorResponse(
        'Test error',
        'VALIDATION_ERROR',
        400,
        { field: 'test' },
      );

      expect(response.status).toBe(400);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json).toEqual({
        error: 'Test error',
        code: 'VALIDATION_ERROR',
        details: { field: 'test' },
      });
    });

    it('should create error response without details', async () => {
      const response = createErrorResponse('Test error', 'INTERNAL_ERROR', 500);

      expect(response.status).toBe(500);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json).toEqual({
        error: 'Test error',
        code: 'INTERNAL_ERROR',
      });
      expect(json.details).toBeUndefined();
    });
  });

  describe('unauthorizedError', () => {
    it('should return 401 with default message', async () => {
      const response = unauthorizedError();

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Authentication required');
      expect(json.code).toBe('AUTH_REQUIRED');
    });

    it('should return 401 with custom message', async () => {
      const response = unauthorizedError('Invalid token');

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Invalid token');
      expect(json.code).toBe('AUTH_REQUIRED');
    });
  });

  describe('forbiddenError', () => {
    it('should return 403 with default message', async () => {
      const response = forbiddenError();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('You don\'t have permission to access this resource');
      expect(json.code).toBe('FORBIDDEN');
    });

    it('should return 403 with custom message', async () => {
      const response = forbiddenError('You can only modify your own threads');

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('You can only modify your own threads');
      expect(json.code).toBe('FORBIDDEN');
    });
  });

  describe('validationError', () => {
    it('should return 400 with validation details', async () => {
      const details = {
        conversationId: ['Required'],
        title: ['Too short'],
      };

      const response = validationError(details);

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Validation failed');
      expect(json.code).toBe('VALIDATION_ERROR');
      expect(json.details).toEqual(details);
    });

    it('should return 400 with custom message', async () => {
      const details = { field: 'Invalid' };
      const response = validationError(details, 'Custom validation message');

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Custom validation message');
      expect(json.code).toBe('VALIDATION_ERROR');
      expect(json.details).toEqual(details);
    });
  });

  describe('notFoundError', () => {
    it('should return 404 with resource name', async () => {
      const response = notFoundError('Thread');

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Thread not found');
      expect(json.code).toBe('NOT_FOUND');
    });

    it('should handle plural resource names', async () => {
      const response = notFoundError('Users');

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Users not found');
      expect(json.code).toBe('NOT_FOUND');
    });
  });

  describe('conflictError', () => {
    it('should return 409 with conflict message', async () => {
      const response = conflictError(
        'Thread with this conversation ID already exists',
      );

      expect(response.status).toBe(HTTP_STATUS.CONFLICT);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Thread with this conversation ID already exists');
      expect(json.code).toBe('CONFLICT');
    });
  });

  describe('invalidRequestError', () => {
    it('should return 400 with invalid request message', async () => {
      const response = invalidRequestError('Conversation ID is required');

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Conversation ID is required');
      expect(json.code).toBe('INVALID_REQUEST');
    });
  });

  describe('dbError', () => {
    it('should return 500 with default message', async () => {
      const response = dbError();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Database operation failed');
      expect(json.code).toBe('DB_ERROR');
    });

    it('should return 500 with custom message', async () => {
      const response = dbError('Failed to fetch threads');

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Failed to fetch threads');
      expect(json.code).toBe('DB_ERROR');
    });
  });

  describe('internalError', () => {
    it('should return 500 with default message', async () => {
      const response = internalError();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Internal server error');
      expect(json.code).toBe('INTERNAL_ERROR');
    });

    it('should return 500 with custom message', async () => {
      const response = internalError('Unexpected error occurred');

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Unexpected error occurred');
      expect(json.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('difyError', () => {
    it('should return 500 with default message', async () => {
      const response = difyError();

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('AI service unavailable');
      expect(json.code).toBe('DIFY_ERROR');
    });

    it('should return 500 with custom message and details', async () => {
      const details = { apiError: 'Rate limit exceeded' };
      const response = difyError('Dify API temporarily unavailable', details);

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      const json = (await response.json()) as ApiErrorResponse;

      expect(json.error).toBe('Dify API temporarily unavailable');
      expect(json.code).toBe('DIFY_ERROR');
      expect(json.details).toEqual(details);
    });
  });

  describe('Error response format consistency', () => {
    it('all errors should follow standard format', async () => {
      const errors = [
        unauthorizedError(),
        forbiddenError(),
        validationError({ field: 'test' }),
        notFoundError('Resource'),
        conflictError('Conflict message'),
        invalidRequestError('Invalid message'),
        dbError(),
        internalError(),
        difyError(),
      ];

      for (const error of errors) {
        const json = (await error.json()) as ApiErrorResponse;

        // All should have error and code fields
        expect(json).toHaveProperty('error');
        expect(json).toHaveProperty('code');
        expect(typeof json.error).toBe('string');
        expect(typeof json.code).toBe('string');

        // Error should not be empty
        expect(json.error.length).toBeGreaterThan(0);

        // Code should be uppercase snake case
        expect(json.code).toMatch(/^[A-Z_]+$/);
      }
    });

    it('should use correct HTTP status codes', async () => {
      const statusTests = [
        { fn: unauthorizedError, status: 401 },
        { fn: forbiddenError, status: 403 },
        { fn: () => validationError({}), status: 400 },
        { fn: () => notFoundError('Resource'), status: 404 },
        { fn: () => conflictError('Message'), status: 409 },
        { fn: () => invalidRequestError('Message'), status: 400 },
        { fn: dbError, status: 500 },
        { fn: internalError, status: 500 },
        { fn: difyError, status: 500 },
      ];

      for (const { fn, status } of statusTests) {
        const response = fn();

        expect(response.status).toBe(status);
      }
    });
  });
});
