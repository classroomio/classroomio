import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createEventBus } from '@cio/sdk';

describe('createEventBus', () => {
  let bus: ReturnType<typeof createEventBus>;

  beforeEach(() => {
    bus = createEventBus();
  });

  it('dispatching an event with no handlers does not throw', () => {
    expect(() => bus.dispatch('lesson.completed', { userId: 'u1', lessonId: 'l1' })).not.toThrow();
  });

  it('calls a registered handler when the matching event is dispatched', async () => {
    const handler = vi.fn();
    bus.register('lesson.completed', handler);
    await bus.dispatch('lesson.completed', { userId: 'u1', lessonId: 'l1' });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('passes the event payload to the handler', async () => {
    const handler = vi.fn();
    bus.register('lesson.completed', handler);
    await bus.dispatch('lesson.completed', { userId: 'u1', lessonId: 'l1' });
    expect(handler).toHaveBeenCalledWith({ userId: 'u1', lessonId: 'l1' }, expect.any(Object));
  });

  it('calls all registered handlers for the same event', async () => {
    const handlerA = vi.fn();
    const handlerB = vi.fn();
    bus.register('lesson.completed', handlerA);
    bus.register('lesson.completed', handlerB);
    await bus.dispatch('lesson.completed', { userId: 'u1', lessonId: 'l1' });
    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerB).toHaveBeenCalledOnce();
  });

  it('continues to later handlers when one plugin handler fails', async () => {
    const failingHandler = vi.fn(async () => {
      throw new Error('plugin failed');
    });
    const laterHandler = vi.fn();
    bus.register('lesson.completed', failingHandler);
    bus.register('lesson.completed', laterHandler);

    await expect(bus.dispatch('lesson.completed', { userId: 'u1', lessonId: 'l1' })).rejects.toThrow(
      /1 plugin handler/i
    );
    expect(laterHandler).toHaveBeenCalledOnce();
  });

  it('does not call handlers for a different event', async () => {
    const handler = vi.fn();
    bus.register('exercise.graded', handler);
    await bus.dispatch('lesson.completed', { userId: 'u1', lessonId: 'l1' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls handlers in registration order', async () => {
    const callOrder: string[] = [];
    bus.register('lesson.completed', async () => {
      callOrder.push('first');
    });
    bus.register('lesson.completed', async () => {
      callOrder.push('second');
    });
    await bus.dispatch('lesson.completed', { userId: 'u1', lessonId: 'l1' });
    expect(callOrder).toEqual(['first', 'second']);
  });

  it('provides a ctx object to each handler', async () => {
    let receivedCtx: unknown;
    bus.register('lesson.completed', (_event, ctx) => {
      receivedCtx = ctx;
    });
    await bus.dispatch('lesson.completed', { userId: 'u1', lessonId: 'l1' });
    expect(receivedCtx).toBeDefined();
    expect(typeof receivedCtx).toBe('object');
  });

  it('resolves after all handlers complete', async () => {
    const results: string[] = [];
    bus.register('lesson.completed', async () => {
      await new Promise((r) => setTimeout(r, 10));
      results.push('done');
    });
    await bus.dispatch('lesson.completed', { userId: 'u1', lessonId: 'l1' });
    expect(results).toContain('done');
  });
});
