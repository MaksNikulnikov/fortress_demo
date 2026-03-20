import { _decorator, Component, Node, tween, Tween, UIOpacity, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('VictoryOverlayController')
export class VictoryOverlayController extends Component {
    @property(UIOpacity)
    public dimmerOpacity: UIOpacity | null = null;

    @property(Node)
    public panelNode: Node | null = null;

    @property(UIOpacity)
    public panelOpacity: UIOpacity | null = null;

    @property
    public dimmerTargetOpacity = 180;

    @property
    public showDuration = 0.3;

    private basePanelScale = new Vec3(1, 1, 1);
    private dimmerTween: Tween<UIOpacity> | null = null;
    private panelScaleTween: Tween<Node> | null = null;
    private panelOpacityTween: Tween<UIOpacity> | null = null;

    protected onLoad(): void {
        if (this.panelNode) {
            this.basePanelScale.set(this.panelNode.scale);
        }

        this.hideImmediately();
    }

    public show(): void {
        this.stopTweens();

        this.node.active = true;

        if (this.dimmerOpacity) {
            this.dimmerOpacity.opacity = 0;
        }

        if (this.panelOpacity) {
            this.panelOpacity.opacity = 0;
        }

        if (this.panelNode) {
            this.panelNode.setScale(
                this.basePanelScale.x * 0.92,
                this.basePanelScale.y * 0.92,
                this.basePanelScale.z
            );
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
                .start();
        }
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
    }
}