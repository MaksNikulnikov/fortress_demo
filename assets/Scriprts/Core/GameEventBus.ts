type EventHandler<T = unknown> = (payload: T) => void;

export class GameEventBus {
    private static handlersMap: Map<string, Set<EventHandler>> = new Map();

    public static on<T = unknown>(eventName: string, handler: EventHandler<T>): void {
        let handlers = this.handlersMap.get(eventName);

        if (!handlers) {
            handlers = new Set<EventHandler>();
            this.handlersMap.set(eventName, handlers);
        }

        handlers.add(handler as EventHandler);
    }

    public static off<T = unknown>(eventName: string, handler: EventHandler<T>): void {
        const handlers = this.handlersMap.get(eventName);

        if (!handlers) {
            return;
        }

        handlers.delete(handler as EventHandler);

        if (handlers.size === 0) {
            this.handlersMap.delete(eventName);
        }
    }

    public static emit<T = unknown>(eventName: string, payload?: T): void {
        const handlers = this.handlersMap.get(eventName);

        if (!handlers) {
            return;
        }

        for (const handler of handlers) {
            handler(payload);
        }
    }

    public static clear(): void {
        this.handlersMap.clear();
    }
}