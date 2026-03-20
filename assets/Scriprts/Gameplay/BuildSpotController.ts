import { _decorator, Component, Node } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { HighlightController } from './HighlightController';

const { ccclass, property } = _decorator;

@ccclass('BuildSpotController')
export class BuildSpotController extends Component {
    @property(Node)
    public highlightNode: Node | null = null;

    private isInteractionEnabled = false;
    private highlightController: HighlightController | null = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.highlightController = this.highlightNode?.getComponent(HighlightController) ?? null;
        this.setHighlightVisible(false);
        this.setInteractionEnabled(false);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    public setInteractionEnabled(isEnabled: boolean): void {
        this.isInteractionEnabled = isEnabled;
    }

    public setHighlightVisible(isVisible: boolean): void {
        this.highlightController?.setHighlightVisible(isVisible);
    }

    private onTouchEnd(): void {
        if (!this.isInteractionEnabled) {
            return;
        }

        GameEventBus.emit(GameEvent.BuildSpotTapped);
    }
}