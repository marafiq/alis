import { describe, expect, it } from 'vitest';
import { responseRouteStep } from '../../../../src/pipeline/steps/response-route.js';
import { createContext } from '../../../../src/pipeline/context.js';
import { ALISError } from '../../../../src/errors/types.js';

describe('pipeline/steps/response-route', () => {
  describe('2xx success responses', () => {
    it('marks success for 200 OK', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('ok', { status: 200 });
      const result = responseRouteStep(ctx);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull(); // null means no error
    });

    it('marks success for 201 Created', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('created', { status: 201 });
      const result = responseRouteStep(ctx);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('marks success for 204 No Content', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response(null, { status: 204 });
      const result = responseRouteStep(ctx);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('marks success for 299 edge case', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('ok', { status: 299 });
      const result = responseRouteStep(ctx);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('server-side validation errors (400 with ProblemDetails)', () => {
    it('sets ctx.error with SERVER_VALIDATION_ERROR code when ctx.validation present', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('bad', { status: 400 });
      ctx.validation = { 
        title: 'Validation failed',
        errors: { email: ['Invalid email format'] } 
      };
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ALISError);
      expect(result.error?.code).toBe('SERVER_VALIDATION_ERROR');
      expect(result.error?.message).toBe('Validation failed');
    });

    it('uses default message when validation has no title', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('bad', { status: 400 });
      ctx.validation = { errors: { name: ['Required'] } };
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ALISError);
      expect(result.error?.code).toBe('SERVER_VALIDATION_ERROR');
      expect(result.error?.message).toBe('Validation failed');
    });

    it('allows hooks to detect server validation failure via ctx.error', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('bad', { status: 400 });
      ctx.validation = { 
        title: 'Please fix errors',
        errors: { field1: ['Error 1'], field2: ['Error 2'] } 
      };
      responseRouteStep(ctx);
      
      // Hook can now check ctx.error to decide whether to close modal
      const shouldCloseModal = !ctx.error;
      expect(shouldCloseModal).toBe(false);
    });
  });

  describe('HTTP errors without validation (4xx, 5xx)', () => {
    it('sets ctx.error with HTTP_ERROR code for 400 without validation', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('bad request', { status: 400, statusText: 'Bad Request' });
      // No ctx.validation set
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ALISError);
      expect(result.error?.code).toBe('HTTP_ERROR');
      expect(result.error?.message).toBe('HTTP 400: Bad Request');
    });

    it('sets ctx.error with HTTP_ERROR code for 404 Not Found', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('not found', { status: 404, statusText: 'Not Found' });
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ALISError);
      expect(result.error?.code).toBe('HTTP_ERROR');
      expect(result.error?.message).toBe('HTTP 404: Not Found');
    });

    it('sets ctx.error with HTTP_ERROR code for 500 Internal Server Error', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('server error', { status: 500, statusText: 'Internal Server Error' });
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ALISError);
      expect(result.error?.code).toBe('HTTP_ERROR');
      expect(result.error?.message).toBe('HTTP 500: Internal Server Error');
    });

    it('handles missing statusText gracefully', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('error', { status: 503 });
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ALISError);
      expect(result.error?.code).toBe('HTTP_ERROR');
      expect(result.error?.message).toBe('HTTP 503: Request failed');
    });

    it('sets ctx.error for 300 redirect (non-2xx)', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('redirect', { status: 300 });
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ALISError);
      expect(result.error?.code).toBe('HTTP_ERROR');
    });
  });

  describe('pre-existing error handling', () => {
    it('preserves existing ctx.error (e.g., from client-side validation)', () => {
      const ctx = createContext(document.createElement('div'));
      const clientError = new ALISError('Client validation failed', 'CLIENT_VALIDATION_ERROR');
      ctx.error = clientError;
      ctx.response = new Response('ok', { status: 200 });
      
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(clientError); // Same error object preserved
      expect(result.error?.code).toBe('CLIENT_VALIDATION_ERROR');
    });

    it('does not overwrite existing error even with successful response', () => {
      const ctx = createContext(document.createElement('div'));
      const existingError = new ALISError('Previous step failed', 'PREVIOUS_ERROR');
      ctx.error = existingError;
      ctx.response = new Response('success', { status: 201 });
      
      const result = responseRouteStep(ctx);
      
      // Should NOT mark as success because there's already an error
      expect(result.success).toBe(false);
      expect(result.error).toBe(existingError);
    });
  });

  describe('missing response handling', () => {
    it('marks failure when response is undefined', () => {
      const ctx = createContext(document.createElement('div'));
      // ctx.response is undefined
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
    });

    it('marks failure when response is null', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = null as unknown as Response;
      const result = responseRouteStep(ctx);
      
      expect(result.success).toBe(false);
    });
  });

  describe('hook integration scenarios', () => {
    it('enables hooks to skip success actions on server validation error', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('validation error', { status: 400 });
      ctx.validation = { errors: { name: ['Name is required'] } };
      
      responseRouteStep(ctx);
      
      // Simulating hook logic: if (ctx.error) return; // don't close modal
      const hookShouldProceed = !ctx.error;
      expect(hookShouldProceed).toBe(false);
    });

    it('enables hooks to proceed on successful response', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('success', { status: 200 });
      
      responseRouteStep(ctx);
      
      // Simulating hook logic: if (ctx.error) return; // proceed to close modal
      const hookShouldProceed = !ctx.error;
      expect(hookShouldProceed).toBe(true);
    });

    it('enables hooks to detect HTTP errors and show appropriate message', () => {
      const ctx = createContext(document.createElement('div'));
      ctx.response = new Response('not found', { status: 404, statusText: 'Not Found' });
      
      responseRouteStep(ctx);
      
      // Hook can use ctx.error to show user-friendly message
      expect(ctx.error).toBeDefined();
      expect(ctx.error?.message).toContain('404');
    });
  });
});
