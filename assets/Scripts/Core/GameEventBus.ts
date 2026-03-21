import { GameEvent } from './GameEvent';

type EventHandler = () => void;
type EventHandlersMap = Partial<Record<GameEvent, EventHandler[]>>;

export class GameEventBus {
    private static handlersMap: EventHandlersMap = {};

    public static on(eventName: GameEvent, handler: EventHandler): void {
        let handlers = this.handlersMap[eventName];

        if (!handlers) {
            handlers = [];
            this.handlersMap[eventName] = handlers;
        }

        if (!handlers.includes(handler)) {
            handlers.push(handler);
        }
    }

    public static off(eventName: GameEvent, handler: EventHandler): void {
        const handlers = this.handlersMap[eventName];

        if (!handlers) {
            return;
        }

        const handlerIndex = handlers.indexOf(handler);

        if (handlerIndex === -1) {
            return;
        }

        handlers.splice(handlerIndex, 1);

        if (handlers.length === 0) {
            delete this.handlersMap[eventName];
        }
    }

    public static emit(eventName: GameEvent): void {
        const handlers = this.handlersMap[eventName];

        if (!handlers || handlers.length === 0) {
            return;
        }

        const handlersSnapshot = handlers.slice();

        for (let index = 0; index < handlersSnapshot.length; index += 1) {
            handlersSnapshot[index]();
        }
    }
}
