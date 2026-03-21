import { _decorator, Component, Node, UIOpacity, Vec3 } from 'cc';
import { GameplayConfig } from '../Core/GameplayConfig';

const { ccclass, property } = _decorator;

@ccclass('ArrowProjectileController')
export class ArrowProjectileController extends Component {
    @property(UIOpacity)
    public bodyOpacity: UIOpacity | null = null;

    @property
    public flightDuration = GameplayConfig.arrowFlightDuration;

    @property
    public rotationOffset = 0;

    private isFlightActive = false;
    private elapsedTime = 0;
    private startWorldPosition = new Vec3();
    private targetWorldPosition = new Vec3();
    private impactCallback: (() => void) | null = null;

    protected onLoad(): void {
        if (!this.bodyOpacity) {
            this.bodyOpacity = this.getComponent(UIOpacity);
        }

        this.node.active = false;
    }

    protected update(deltaTime: number): void {
        if (!this.isFlightActive) {
            return;
        }

        this.elapsedTime += deltaTime;

        const progress = Math.min(this.elapsedTime / this.flightDuration, 1);

        const currentWorldPosition = new Vec3();
        Vec3.lerp(currentWorldPosition, this.startWorldPosition, this.targetWorldPosition, progress);
        this.node.setWorldPosition(currentWorldPosition);

        if (progress < 1) {
            return;
        }

        this.isFlightActive = false;
        this.node.active = false;

        const impactCallback = this.impactCallback;
        this.impactCallback = null;
        impactCallback?.();
    }

    public shoot(originNode: Node, targetNode: Node, impactCallback: () => void): boolean {
        if (this.isFlightActive) {
            return false;
        }

        this.startWorldPosition.set(originNode.worldPosition);
        this.targetWorldPosition.set(targetNode.worldPosition);
        this.impactCallback = impactCallback;
        this.elapsedTime = 0;
        this.isFlightActive = true;

        this.node.active = true;
        this.node.setWorldPosition(this.startWorldPosition);

        if (this.bodyOpacity) {
            this.bodyOpacity.opacity = 255;
        }

        this.updateRotation();

        return true;
    }

    public isBusy(): boolean {
        return this.isFlightActive;
    }

    private updateRotation(): void {
        const directionX = this.targetWorldPosition.x - this.startWorldPosition.x;
        const directionY = this.targetWorldPosition.y - this.startWorldPosition.y;
        const angle = Math.atan2(directionY, directionX) * 180 / Math.PI;

        this.node.setRotationFromEuler(0, 0, angle + this.rotationOffset);
    }
}