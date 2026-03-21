import { _decorator, Component, director, Node, tween, Tween, Vec3 } from 'cc';

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
    private showTween: Tween<Node> | null = null;

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

        if (this.showTween) {
            this.showTween.stop();
            this.showTween = null;
        }
    }

    public setInteractionEnabled(isEnabled: boolean): void {
        this.isInteractionEnabled = isEnabled;
    }

    public playShowAnimation(): void {
        if (this.showTween) {
            this.showTween.stop();
        }

        this.node.setScale(
            this.baseScale.x * 0.9,
            this.baseScale.y * 0.9,
            this.baseScale.z
        );

        this.showTween = tween(this.node)
            .to(0.22, { scale: this.baseScale.clone() }, { easing: 'backOut' })
            .start();
    }

    private onTouchEnd(): void {
        if (!this.isInteractionEnabled) {
            return;
        }

        this.isInteractionEnabled = false;

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
                this.restartCurrentScene();
            })
            .start();
    }

    private restartCurrentScene(): void {
        const currentScene = director.getScene();

        if (!currentScene) {
            return;
        }

        director.loadScene(currentScene.name);
    }
}
