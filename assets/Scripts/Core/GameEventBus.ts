import { GameEvent } from './GameEvent';

type EventHandler = () => void;

export class GameEventBus {
    private static handlersMap: Map<GameEvent, Set<EventHandler>> = new Map();

    public static on(eventName: GameEvent, handler: EventHandler): void {
        let handlers = this.handlersMap.get(eventName);

        if (!handlers) {
            handlers = new Set<EventHandler>();
            this.handlersMap.set(eventName, handlers);
        }

        handlers.add(handler);
    }

    public static off(eventName: GameEvent, handler: EventHandler): void {
        const handlers = this.handlersMap.get(eventName);

        if (!handlers) {
            return;
        }

        handlers.delete(handler);

        if (handlers.size === 0) {
            this.handlersMap.delete(eventName);
        }
    }

    public static emit(eventName: GameEvent): void {
        const handlers = this.handlersMap.get(eventName);

        if (!handlers) {
            return;
        }

        for (const handler of [...handlers]) {
            handler();
        }
    }
}
