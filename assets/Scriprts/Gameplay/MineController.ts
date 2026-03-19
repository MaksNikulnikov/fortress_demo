import { _decorator, Component, Node } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';

const { ccclass } = _decorator;

@ccclass('MineController')
export class MineController extends Component {
    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd(): void {
        GameEventBus.emit(GameEvent.MineTapped);
    }
}