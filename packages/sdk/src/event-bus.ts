import type { EventContext, EventHandler, HookName } from './types';

export interface EventBus {
  register<T = any>(event: HookName, handler: EventHandler<T>): void;
  dispatch<T = any>(event: HookName, payload: T, customCtx?: Partial<EventContext>): Promise<void>;
}

/**
 * Creates an in-memory event bus for registering and dispatching plugin lifecycle events.
 */
export function createEventBus(): EventBus {
  const handlers = new Map<string, EventHandler[]>();

  return {
    register<T = any>(event: HookName, handler: EventHandler<T>): void {
      const existing = handlers.get(event) ?? [];
      existing.push(handler);
      handlers.set(event, existing);
    },

    async dispatch<T = any>(event: HookName, payload: T, customCtx?: Partial<EventContext>): Promise<void> {
      const eventHandlers = handlers.get(event) ?? [];
      const ctx: EventContext = {
        timestamp: new Date(),
        ...(customCtx ?? {})
      };

      const failures: unknown[] = [];

      for (const handler of eventHandlers) {
        try {
          await handler(payload, ctx);
        } catch (error) {
          failures.push(error);
        }
      }

      if (failures.length > 0) {
        const dispatchError = new Error(`${failures.length} plugin handler(s) failed for event "${event}".`);
        Object.assign(dispatchError, { causes: failures });

        throw dispatchError;
      }
    }
  };
}

let globalEventBus: EventBus | null = null;

/**
 * Returns the singleton event bus instance for the process.
 */
export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = createEventBus();
  }
  return globalEventBus;
}
