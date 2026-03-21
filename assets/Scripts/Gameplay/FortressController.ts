import { _decorator, Color, Component, Node, Sprite, tween, Tween, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('FortressController')
export class FortressController extends Component {
    @property(Sprite)
    public bodySprite: Sprite | null = null;

    @property
    public damageFlashDuration = 0.08;

    @property
    public damageScaleMultiplier = 1.03;

    private colorTween: Tween<Sprite> | null = null;
    private scaleTween: Tween<Node> | null = null;
    private baseScale = new Vec3(1, 1, 1);

    protected onLoad(): void {
        if (!this.bodySprite) {
            this.bodySprite = this.getComponent(Sprite);
        }

        this.baseScale.set(this.node.scale);
    }

    protected onDestroy(): void {
        if (this.colorTween) {
            this.colorTween.stop();
            this.colorTween = null;
        }

        if (this.scaleTween) {
            this.scaleTween.stop();
            this.scaleTween = null;
        }
    }

    public playDamageFeedback(): void {
        this.playColorFeedback();
        this.playScaleFeedback();
    }

    private playColorFeedback(): void {
        if (!this.bodySprite) {
            return;
        }

        if (this.colorTween) {
            this.colorTween.stop();
        }

        this.bodySprite.color = new Color(255, 255, 255, 255);

        this.colorTween = tween(this.bodySprite)
            .to(this.damageFlashDuration, { color: new Color(255, 180, 180, 255) })
            .to(this.damageFlashDuration, { color: Color.WHITE.clone() })
            .start();
    }

    private playScaleFeedback(): void {
        if (this.scaleTween) {
            this.scaleTween.stop();
        }

        const damageScale = new Vec3(
            this.baseScale.x * this.damageScaleMultiplier,
            this.baseScale.y * this.damageScaleMultiplier,
            this.baseScale.z
        );

        this.scaleTween = tween(this.node)
            .to(this.damageFlashDuration, { scale: damageScale })
            .to(this.damageFlashDuration, { scale: this.baseScale.clone() })
            .start();
    }
}