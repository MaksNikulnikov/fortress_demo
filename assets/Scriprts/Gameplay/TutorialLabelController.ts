import { _decorator, Component, Label, tween, Tween, UIOpacity, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('TutorialLabelController')
export class TutorialLabelController extends Component {
    @property(Label)
    public label: Label | null = null;

    @property(UIOpacity)
    public opacityComponent: UIOpacity | null = null;

    @property
    public showDuration = 0.22;

    @property
    public hideDuration = 0.18;

    @property
    public showScaleMultiplier = 1.08;

    @property
    public autoHideDelay = 1.4;

    private baseScale = new Vec3(1, 1, 1);
    private showTween: Tween<any> | null = null;
    private hideTween: Tween<any> | null = null;
    private autoHideTween: Tween<any> | null = null;
    private currentText = '';

    protected onLoad(): void {
        if (!this.label) {
            this.label = this.getComponent(Label);
        }

        if (!this.opacityComponent) {
            this.opacityComponent = this.getComponent(UIOpacity);
        }

        this.baseScale.set(this.node.scale);

        if (this.opacityComponent) {
            this.opacityComponent.opacity = 0;
        }
    }

    protected onDestroy(): void {
        this.stopTweens();
    }

    public showPersistentText(text: string): void {
        if (!this.label) {
            return;
        }

        const hasTextChanged = this.currentText !== text;
        this.currentText = text;

        this.stopAutoHide();

        if (!hasTextChanged && this.node.active) {
            return;
        }

        this.label.string = text;
        this.playShowAnimation();
    }

    public showTemporaryText(text: string): void {
        if (!this.label) {
            return;
        }

        this.currentText = text;
        this.label.string = text;
        this.playShowAnimation();

        this.autoHideTween = tween(this.node)
            .delay(this.autoHideDelay)
            .call(() => {
                this.hide();
            })
            .start();
    }

    public hide(): void {
        this.stopAutoHide();

        if (!this.node.active) {
            return;
        }

        this.stopShowHideTweens();

        this.hideTween = tween(this.node)
            .to(this.hideDuration, { scale: new Vec3(
                this.baseScale.x * 0.96,
                this.baseScale.y * 0.96,
                this.baseScale.z
            ) })
            .call(() => {
                if (this.opacityComponent) {
                    tween(this.opacityComponent)
                        .to(this.hideDuration, { opacity: 0 })
                        .call(() => {
                            this.node.active = false;
                            this.node.setScale(this.baseScale);
                        })
                        .start();
                } else {
                    this.node.active = false;
                    this.node.setScale(this.baseScale);
                }
            })
            .start();
    }

    private playShowAnimation(): void {
        this.stopShowHideTweens();

        this.node.active = true;
        this.node.setScale(
            this.baseScale.x * this.showScaleMultiplier,
            this.baseScale.y * this.showScaleMultiplier,
            this.baseScale.z
        );

        if (this.opacityComponent) {
            this.opacityComponent.opacity = 0;
        }

        this.showTween = tween(this.node)
            .to(this.showDuration, { scale: this.baseScale.clone() }, { easing: 'backOut' })
            .start();

        if (this.opacityComponent) {
            tween(this.opacityComponent)
                .to(this.showDuration, { opacity: 255 })
                .start();
        }
    }

    private stopShowHideTweens(): void {
        if (this.showTween) {
            this.showTween.stop();
            this.showTween = null;
        }

        if (this.hideTween) {
            this.hideTween.stop();
            this.hideTween = null;
        }
    }

    private stopAutoHide(): void {
        if (this.autoHideTween) {
            this.autoHideTween.stop();
            this.autoHideTween = null;
        }
    }

    private stopTweens(): void {
        this.stopShowHideTweens();
        this.stopAutoHide();
    }
}