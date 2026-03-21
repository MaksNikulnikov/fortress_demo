import { _decorator, Color, Component, Label, Node, tween, Tween, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GoldCounterController')
export class GoldCounterController extends Component {
    @property(Label)
    public label: Label | null = null;

    @property
    public punchScaleMultiplier = 1.08;

    @property
    public punchDuration = 0.08;

    private baseScale = new Vec3(1, 1, 1);
    private punchTween: Tween<Node> | null = null;
    private colorTween: Tween<Label> | null = null;
    private previousValue = -1;

    protected onLoad(): void {
        if (!this.label) {
            this.label = this.getComponent(Label);
        }

        this.baseScale.set(this.node.scale);
    }

    protected onDestroy(): void {
        if (this.punchTween) {
            this.punchTween.stop();
            this.punchTween = null;
        }

        if (this.colorTween) {
            this.colorTween.stop();
            this.colorTween = null;
        }
    }

    public updateValue(currentGold: number, targetGold: number, showTarget: boolean): void {
        if (!this.label) {
            return;
        }

        if (showTarget) {
            this.label.string = `Gold: ${currentGold}/${targetGold}`;
        } else {
            this.label.string = `Gold: ${currentGold}`;
        }

        if (this.previousValue >= 0 && currentGold > this.previousValue) {
            this.playGainFeedback();
        }

        this.previousValue = currentGold;
    }

    private playGainFeedback(): void {
        if (!this.label) {
            return;
        }

        if (this.punchTween) {
            this.punchTween.stop();
        }

        if (this.colorTween) {
            this.colorTween.stop();
        }

        const punchScale = new Vec3(
            this.baseScale.x * this.punchScaleMultiplier,
            this.baseScale.y * this.punchScaleMultiplier,
            this.baseScale.z
        );

        this.punchTween = tween(this.node)
            .to(this.punchDuration, { scale: punchScale })
            .to(this.punchDuration, { scale: this.baseScale.clone() })
            .start();

        this.label.color = Color.WHITE.clone();

        this.colorTween = tween(this.label)
            .to(this.punchDuration, { color: new Color(255, 235, 140, 255) })
            .to(this.punchDuration, { color: Color.WHITE.clone() })
            .start();
    }
}
