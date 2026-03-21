import { _decorator, Component, Node } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { HighlightController } from './HighlightController';

const { ccclass, property } = _decorator;

@ccclass('MineController')
export class MineController extends Component {
    @property(Node)
    public highlightNode: Node | null = null;

    private highlightController: HighlightController | null = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.highlightController = this.highlightNode?.getComponent(HighlightController) ?? null;
        this.setHighlightVisible(false);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    public setHighlightVisible(isVisible: boolean): void {
        this.highlightController?.setHighlightVisible(isVisible);
    }

    private onTouchEnd(): void {
        GameEventBus.emit(GameEvent.MineTapped);
    }
}