import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CtaButtonController')
export class CtaButtonController extends Component {
    @property
    public pressScaleMultiplier = 0.94;

    @property
    public pressDuration = 0.08;

    private isInteractionEnabled = true;
    private baseScale = new Vec3(1, 1, 1);
    private pressTween: Tween<Node> | null = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.baseScale.set(this.node.scale);
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

    public playShowAnimation(): void {
        this.node.setScale(
            this.baseScale.x * 0.9,
            this.baseScale.y * 0.9,
            this.baseScale.z
        );

        tween(this.node)
            .to(0.22, { scale: this.baseScale.clone() }, { easing: 'backOut' })
            .start();
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
                this.fireCta();
            })
            .start();
    }

    private fireCta(): void {
        const globalWindow = window as Window & {
            openStore?: () => void;
            install?: () => void;
            cta?: () => void;
        };

        if (typeof globalWindow.openStore === 'function') {
            globalWindow.openStore();
            return;
        }

        if (typeof globalWindow.install === 'function') {
            globalWindow.install();
            return;
        }

        if (typeof globalWindow.cta === 'function') {
            globalWindow.cta();
            return;
        }

        console.log('[CtaButtonController] CTA clicked');
    }
}