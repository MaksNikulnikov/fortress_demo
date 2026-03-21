import { _decorator, Component, Node, Sprite, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { GameplayConfig } from '../Core/GameplayConfig';

const { ccclass, property } = _decorator;

@ccclass('FireballController')
export class FireballController extends Component {
    @property(Node)
    public impactNode: Node | null = null;

    @property(UIOpacity)
    public fireballOpacity: UIOpacity | null = null;

    @property(UIOpacity)
    public impactOpacity: UIOpacity | null = null;

    @property(Sprite)
    public impactSprite: Sprite | null = null;

    private flightTween: Tween<Node> | null = null;
    private impactScaleTween: Tween<Node> | null = null;
    private impactOpacityTween: Tween<UIOpacity> | null = null;
    private currentRotation = 0;
    private isFlying = false;
    private targetNode: Node | null = null;
    private baseImpactScale = new Vec3(1, 1, 1);

    protected onLoad(): void {
        if (!this.fireballOpacity) {
            this.fireballOpacity = this.getComponent(UIOpacity);
        }

        if (this.impactNode) {
            this.baseImpactScale.set(this.impactNode.scale);
            this.impactNode.active = false;
        }

        if (this.impactOpacity) {
            this.impactOpacity.opacity = 0;
        }

        this.node.active = false;
    }

    protected update(deltaTime: number): void {
        if (!this.isFlying) {
            return;
        }

        this.currentRotation += GameplayConfig.fireballRotationSpeed * deltaTime;
        this.node.setRotationFromEuler(0, 0, this.currentRotation);
    }

    public castFromSky(targetNode: Node, skyCastPointNode: Node): void {
        this.stopTweens();

        this.targetNode = targetNode;
        this.isFlying = true;
        this.currentRotation = 0;

        this.node.active = true;
        this.node.setWorldPosition(skyCastPointNode.worldPosition);
        this.node.setScale(
            GameplayConfig.fireballStartScale,
            GameplayConfig.fireballStartScale,
            1
        );
        this.node.setRotationFromEuler(0, 0, 0);

        if (this.fireballOpacity) {
            this.fireballOpacity.opacity = 255;
        }

        if (this.impactNode) {
            this.impactNode.active = false;
        }

        const targetWorldPosition = targetNode.worldPosition.clone();

        this.flightTween = tween(this.node)
            .to(
                GameplayConfig.fireballFlightDuration,
                {
                    worldPosition: targetWorldPosition,
                    scale: new Vec3(
                        GameplayConfig.fireballEndScale,
                        GameplayConfig.fireballEndScale,
                        1
                    ),
                },
                { easing: 'quadIn' }
            )
            .call(() => {
                this.onImpact();
            })
            .start();
    }

    private onImpact(): void {
        this.isFlying = false;
        this.node.active = false;

        if (!this.targetNode || !this.impactNode) {
            GameEventBus.emit(GameEvent.FireballImpactFinished);
            return;
        }

        this.impactNode.active = true;
        this.impactNode.setWorldPosition(this.targetNode.worldPosition);
        this.impactNode.setScale(
            this.baseImpactScale.x * 0.7,
            this.baseImpactScale.y * 0.7,
            this.baseImpactScale.z
        );

        if (this.impactOpacity) {
            this.impactOpacity.opacity = 255;
        }

        this.impactScaleTween = tween(this.impactNode)
            .to(
                GameplayConfig.fireballImpactDuration,
                {
                    scale: new Vec3(
                        this.baseImpactScale.x * 1.2,
                        this.baseImpactScale.y * 1.2,
                        this.baseImpactScale.z
                    ),
                },
                { easing: 'quadOut' }
            )
            .start();

        if (this.impactOpacity) {
            this.impactOpacityTween = tween(this.impactOpacity)
                .to(GameplayConfig.fireballImpactDuration, { opacity: 0 })
                .call(() => {
                    if (this.impactNode) {
                        this.impactNode.active = false;
                    }

                    GameEventBus.emit(GameEvent.FireballImpactFinished);
                })
                .start();
        } else {
            GameEventBus.emit(GameEvent.FireballImpactFinished);
        }
    }

    private stopTweens(): void {
        if (this.flightTween) {
            this.flightTween.stop();
            this.flightTween = null;
        }

        if (this.impactScaleTween) {
            this.impactScaleTween.stop();
            this.impactScaleTween = null;
        }

        if (this.impactOpacityTween) {
            this.impactOpacityTween.stop();
            this.impactOpacityTween = null;
        }
    }
}