import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { HighlightController } from './HighlightController';

const { ccclass, property } = _decorator;

@ccclass('SkillButtonController')
export class SkillButtonController extends Component {
    @property(Node)
    public highlightNode: Node | null = null;

    @property
    public pressScaleMultiplier = 0.92;

    @property
    public pressDuration = 0.08;

    private isInteractionEnabled = false;
    private highlightController: HighlightController | null = null;
    private baseScale = new Vec3(1, 1, 1);
    private pressTween: Tween<Node> | null = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.highlightController = this.highlightNode?.getComponent(HighlightController) ?? null;
        this.baseScale.set(this.node.scale);
        this.setHighlightVisible(false);
        this.setInteractionEnabled(false);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        if (this.pressTween) {
            this.pressTween.stop();
            this.pressTween = null;
        }
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

        if (this.pressTween) {
            this.pressTween.stop();
        }

        const pressedScale = new Vec3(
            this.baseScale.x * this.pressScaleMultiplier,
            this.baseScale.y * this.pressScaleMultiplier,
            this.baseScale.z
        );

        this.pressTween = tween(this.node)
            .to(this.pressDuration, { scale: pressedScale })
            .to(this.pressDuration, { scale: this.baseScale.clone() })
            .call(() => {
                GameEventBus.emit(GameEvent.SkillButtonTapped);
            })
            .start();
    }
}