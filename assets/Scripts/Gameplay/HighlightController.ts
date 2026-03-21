import { _decorator, Color, Component, Node, Sprite, tween, Tween, UIOpacity, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('HighlightController')
export class HighlightController extends Component {
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

    @property
    public showDuration = 0.22;

    @property
    public hideDuration = 0.18;

    @property
    public showStartScaleMultiplier = 0.88;

    @property
    public hideEndScaleMultiplier = 0.92;

    @property(Color)
    public pulseColorFrom: Color = new Color(180, 220, 255, 255);

    @property(Color)
    public pulseColorTo: Color = new Color(255, 255, 255, 255);

    private animationTime = 0;
    private baseScale = new Vec3(1, 1, 1);
    private isVisible = false;
    private isPulseEnabled = false;
    private scaleTween: Tween<Node> | null = null;
    private opacityTween: Tween<UIOpacity> | null = null;

    protected onLoad(): void {
        this.baseScale.set(this.node.scale);

        if (!this.highlightOpacity) {
            this.highlightOpacity = this.getComponent(UIOpacity);
        }

        if (!this.highlightSprite) {
            this.highlightSprite = this.getComponent(Sprite);
        }

        this.node.active = false;

        if (this.highlightOpacity) {
            this.highlightOpacity.opacity = 0;
        }
    }

    protected update(deltaTime: number): void {
        if (!this.isVisible || !this.isPulseEnabled || !this.node.active) {
            return;
        }

        this.animationTime += deltaTime;
        this.updatePulse();
    }

    public setHighlightVisible(isVisible: boolean): void {
        if (isVisible === this.isVisible) {
            return;
        }

        this.isVisible = isVisible;

        if (isVisible) {
            this.playShowAnimation();
            return;
        }

        this.playHideAnimation();
    }

    private playShowAnimation(): void {
        this.stopTweens();

        this.animationTime = 0;
        this.isPulseEnabled = false;
        this.node.active = true;

        const startScale = new Vec3(
            this.baseScale.x * this.showStartScaleMultiplier,
            this.baseScale.y * this.showStartScaleMultiplier,
            this.baseScale.z
        );

        this.node.setScale(startScale);

        if (this.highlightOpacity) {
            this.highlightOpacity.opacity = 0;
        }

        if (this.highlightSprite) {
            this.highlightSprite.color = this.pulseColorFrom.clone();
        }

        this.scaleTween = tween(this.node)
            .to(this.showDuration, { scale: this.baseScale.clone() }, { easing: 'backOut' })
            .call(() => {
                if (!this.isVisible) {
                    return;
                }

                this.isPulseEnabled = true;
                this.updatePulse();
            })
            .start();

        if (this.highlightOpacity) {
            this.opacityTween = tween(this.highlightOpacity)
                .to(this.showDuration, { opacity: this.pulseOpacityMax })
                .start();
        }
    }

    private playHideAnimation(): void {
        this.stopTweens();

        this.isPulseEnabled = false;

        const endScale = new Vec3(
            this.baseScale.x * this.hideEndScaleMultiplier,
            this.baseScale.y * this.hideEndScaleMultiplier,
            this.baseScale.z
        );

        this.scaleTween = tween(this.node)
            .to(this.hideDuration, { scale: endScale }, { easing: 'quadIn' })
            .call(() => {
                if (this.isVisible) {
                    return;
                }

                this.node.active = false;
                this.resetVisualState();
            })
            .start();

        if (this.highlightOpacity) {
            this.opacityTween = tween(this.highlightOpacity)
                .to(this.hideDuration, { opacity: 0 })
                .start();
        }
    }

    private updatePulse(): void {
        const pulse01 = 0.5 + Math.sin(this.animationTime * this.pulseSpeed) * 0.5;
        const scaleFactor = 1 + (pulse01 * 2 - 1) * this.pulseScaleAmplitude;

        this.node.setScale(
            this.baseScale.x * scaleFactor,
            this.baseScale.y * scaleFactor,
            this.baseScale.z
        );

        if (this.highlightOpacity) {
            const opacity =
                this.pulseOpacityMin + (this.pulseOpacityMax - this.pulseOpacityMin) * pulse01;

            this.highlightOpacity.opacity = Math.round(opacity);
        }

        if (this.highlightSprite) {
            this.highlightSprite.color = new Color(
                Math.round(this.pulseColorFrom.r + (this.pulseColorTo.r - this.pulseColorFrom.r) * pulse01),
                Math.round(this.pulseColorFrom.g + (this.pulseColorTo.g - this.pulseColorFrom.g) * pulse01),
                Math.round(this.pulseColorFrom.b + (this.pulseColorTo.b - this.pulseColorFrom.b) * pulse01),
                255
            );
        }
    }

    private resetVisualState(): void {
        this.node.setScale(this.baseScale);

        if (this.highlightOpacity) {
            this.highlightOpacity.opacity = this.pulseOpacityMax;
        }

        if (this.highlightSprite) {
            this.highlightSprite.color = this.pulseColorTo.clone();
        }
    }

    private stopTweens(): void {
        if (this.scaleTween) {
            this.scaleTween.stop();
            this.scaleTween = null;
        }

        if (this.opacityTween) {
            this.opacityTween.stop();
            this.opacityTween = null;
        }
    }
}
