import { _decorator, Color, Component, Node, Sprite, UIOpacity, Vec3 } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';

const { ccclass, property } = _decorator;

@ccclass('BuildSpotController')
export class BuildSpotController extends Component {
    @property(Node)
    public highlightNode: Node | null = null;

    @property(Sprite)
    public highlightSprite: Sprite | null = null;

    @property(UIOpacity)
    public highlightOpacity: UIOpacity | null = null;

    @property
    public pulseSpeed = 2.4;

    @property
    public pulseScaleAmplitude = 0.08;

    @property
    public pulseOpacityMin = 150;

    @property
    public pulseOpacityMax = 255;

    @property(Color)
    public pulseColorFrom: Color = new Color(180, 220, 255, 255);

    @property(Color)
    public pulseColorTo: Color = new Color(255, 255, 255, 255);

    private isInteractionEnabled = false;
    private animationTime = 0;
    private baseHighlightScale = new Vec3(1, 1, 1);

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.cacheBaseHighlightScale();
        this.setHighlightVisible(false);
        this.setInteractionEnabled(false);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected update(deltaTime: number): void {
        if (!this.highlightNode?.active) {
            return;
        }

        this.animationTime += deltaTime;
        this.updateHighlightPulse();
    }

    public setInteractionEnabled(isEnabled: boolean): void {
        this.isInteractionEnabled = isEnabled;
    }

    public setHighlightVisible(isVisible: boolean): void {
        if (!this.highlightNode) {
            return;
        }

        this.highlightNode.active = isVisible;

        if (!isVisible) {
            this.animationTime = 0;
            this.resetHighlightVisualState();
            return;
        }

        this.cacheBaseHighlightScale();
        this.updateHighlightPulse();
    }

    private cacheBaseHighlightScale(): void {
        if (!this.highlightNode) {
            return;
        }

        this.baseHighlightScale.set(this.highlightNode.scale);
    }

    private updateHighlightPulse(): void {
        const pulse01 = 0.5 + Math.sin(this.animationTime * this.pulseSpeed) * 0.5;
        const scaleFactor = 1 + (pulse01 * 2 - 1) * this.pulseScaleAmplitude;

        this.updateHighlightScale(scaleFactor);
        this.updateHighlightOpacity(pulse01);
        this.updateHighlightColor(pulse01);
    }

    private updateHighlightScale(scaleFactor: number): void {
        if (!this.highlightNode) {
            return;
        }

        this.highlightNode.setScale(
            this.baseHighlightScale.x * scaleFactor,
            this.baseHighlightScale.y * scaleFactor,
            this.baseHighlightScale.z
        );
    }

    private updateHighlightOpacity(pulse01: number): void {
        if (!this.highlightOpacity) {
            return;
        }

        const opacity =
            this.pulseOpacityMin + (this.pulseOpacityMax - this.pulseOpacityMin) * pulse01;

        this.highlightOpacity.opacity = Math.round(opacity);
    }

    private updateHighlightColor(pulse01: number): void {
        if (!this.highlightSprite) {
            return;
        }

        this.highlightSprite.color = new Color(
            Math.round(this.pulseColorFrom.r + (this.pulseColorTo.r - this.pulseColorFrom.r) * pulse01),
            Math.round(this.pulseColorFrom.g + (this.pulseColorTo.g - this.pulseColorFrom.g) * pulse01),
            Math.round(this.pulseColorFrom.b + (this.pulseColorTo.b - this.pulseColorFrom.b) * pulse01),
            255
        );
    }

    private resetHighlightVisualState(): void {
        if (this.highlightNode) {
            this.highlightNode.setScale(this.baseHighlightScale);
        }

        if (this.highlightOpacity) {
            this.highlightOpacity.opacity = this.pulseOpacityMax;
        }

        if (this.highlightSprite) {
            this.highlightSprite.color = this.pulseColorTo.clone();
        }
    }

    private onTouchEnd(): void {
        if (!this.isInteractionEnabled) {
            return;
        }

        GameEventBus.emit(GameEvent.BuildSpotTapped);
    }
}