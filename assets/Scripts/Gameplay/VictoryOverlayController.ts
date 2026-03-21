import { _decorator, Component, Node, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { CtaButtonController } from './CtaButtonController';

const { ccclass, property } = _decorator;

@ccclass('VictoryOverlayController')
export class VictoryOverlayController extends Component {
    @property(UIOpacity)
    public dimmerOpacity: UIOpacity | null = null;

    @property(Node)
    public panelNode: Node | null = null;

    @property(UIOpacity)
    public panelOpacity: UIOpacity | null = null;

    @property(Node)
    public ctaButtonNode: Node | null = null;

    @property
    public dimmerTargetOpacity = 180;

    @property
    public showDuration = 0.3;

    @property
    public ctaDelay = 0.12;

    private basePanelScale = new Vec3(1, 1, 1);
    private ctaButtonController: CtaButtonController | null = null;
    private dimmerTween: Tween<UIOpacity> | null = null;
    private panelScaleTween: Tween<Node> | null = null;
    private panelOpacityTween: Tween<UIOpacity> | null = null;
    private ctaRevealTween: Tween<Node> | null = null;

    protected onLoad(): void {
        if (this.panelNode) {
            this.basePanelScale.set(this.panelNode.scale);
        }

        this.ctaButtonController = this.ctaButtonNode?.getComponent(CtaButtonController) ?? null;
        this.hideImmediately();
    }

    protected onDestroy(): void {
        this.stopTweens();
    }

    public show(): void {
        this.stopTweens();

        this.node.active = true;
        this.ctaButtonController?.setInteractionEnabled(true);

        if (this.dimmerOpacity) {
            this.dimmerOpacity.opacity = 0;
        }

        if (this.panelOpacity) {
            this.panelOpacity.opacity = 0;
        }

        if (this.panelNode) {
            this.panelNode.setScale(
                this.basePanelScale.x * 0.9,
                this.basePanelScale.y * 0.9,
                this.basePanelScale.z
            );
        }

        if (this.ctaButtonNode) {
            this.ctaButtonNode.active = false;
        }

        if (this.dimmerOpacity) {
            this.dimmerTween = tween(this.dimmerOpacity)
                .to(this.showDuration, { opacity: this.dimmerTargetOpacity })
                .start();
        }

        if (this.panelOpacity) {
            this.panelOpacityTween = tween(this.panelOpacity)
                .to(this.showDuration, { opacity: 255 })
                .start();
        }

        if (this.panelNode) {
            this.panelScaleTween = tween(this.panelNode)
                .to(this.showDuration, { scale: this.basePanelScale.clone() }, { easing: 'backOut' })
                .call(() => {
                    this.showCtaButton();
                })
                .start();
        }
    }

    private showCtaButton(): void {
        if (!this.ctaButtonNode) {
            return;
        }

        this.ctaButtonNode.active = true;

        this.ctaRevealTween = tween(this.ctaButtonNode)
            .delay(this.ctaDelay)
            .call(() => {
                this.ctaButtonController?.playShowAnimation();
            })
            .start();
    }

    private hideImmediately(): void {
        if (this.dimmerOpacity) {
            this.dimmerOpacity.opacity = 0;
        }

        if (this.panelOpacity) {
            this.panelOpacity.opacity = 0;
        }

        if (this.panelNode) {
            this.panelNode.setScale(this.basePanelScale);
        }

        if (this.ctaButtonNode) {
            this.ctaButtonNode.active = false;
        }

        this.node.active = false;
    }

    private stopTweens(): void {
        if (this.dimmerTween) {
            this.dimmerTween.stop();
            this.dimmerTween = null;
        }

        if (this.panelScaleTween) {
            this.panelScaleTween.stop();
            this.panelScaleTween = null;
        }

        if (this.panelOpacityTween) {
            this.panelOpacityTween.stop();
            this.panelOpacityTween = null;
        }

        if (this.ctaRevealTween) {
            this.ctaRevealTween.stop();
            this.ctaRevealTween = null;
        }
    }
}
