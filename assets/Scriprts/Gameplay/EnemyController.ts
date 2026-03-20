import { _decorator, Component, Node, Vec3 } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { GameplayConfig } from '../Core/GameplayConfig';

const { ccclass } = _decorator;

@ccclass('EnemyController')
export class EnemyController extends Component {
    private moveTarget: Node | null = null;
    private isMoving = false;
    private currentHealth: number = GameplayConfig.lightEnemyMaxHealth;
    private movementDirection = new Vec3();

    protected update(deltaTime: number): void {
        if (!this.isMoving || !this.moveTarget || !this.node.active) {
            return;
        }

        const currentPosition = this.node.worldPosition;
        const targetPosition = this.moveTarget.worldPosition;

        Vec3.subtract(this.movementDirection, targetPosition, currentPosition);
        const distanceToTarget = this.movementDirection.length();

        if (distanceToTarget <= GameplayConfig.enemyMoveSpeed * deltaTime) {
            this.node.setWorldPosition(targetPosition);
            this.isMoving = false;
            return;
        }

        this.movementDirection.normalize();

        this.node.setWorldPosition(
            currentPosition.x + this.movementDirection.x * GameplayConfig.enemyMoveSpeed * deltaTime,
            currentPosition.y + this.movementDirection.y * GameplayConfig.enemyMoveSpeed * deltaTime,
            currentPosition.z + this.movementDirection.z * GameplayConfig.enemyMoveSpeed * deltaTime
        );
    }

    public startBattle(startNode: Node, endNode: Node, maxHealth: number): void {
        this.currentHealth = maxHealth;
        this.moveTarget = endNode;
        this.isMoving = true;
        this.node.active = true;
        this.node.setWorldPosition(startNode.worldPosition);
    }

    public receiveDamage(damage: number): void {
        if (!this.node.active) {
            return;
        }

        this.currentHealth -= damage;

        if (this.currentHealth > 0) {
            return;
        }

        this.isMoving = false;
        this.node.active = false;
        GameEventBus.emit(GameEvent.EnemyDefeated);
    }

    public isAlive(): boolean {
        return this.node.active && this.currentHealth > 0;
    }
}