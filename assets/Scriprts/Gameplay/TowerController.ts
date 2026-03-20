import { _decorator, Component, Node, Vec3 } from 'cc';
import { GameplayConfig } from '../Core/GameplayConfig';
import { EnemyController } from './EnemyController';

const { ccclass, property } = _decorator;

@ccclass('TowerController')
export class TowerController extends Component {
    @property(Node)
    public attackPoint: Node | null = null;

    private enemyController: EnemyController | null = null;
    private enemyNode: Node | null = null;
    private isBattleActive = false;
    private attackCooldown = 0;

    public startBattle(enemyNode: Node): void {
        this.enemyNode = enemyNode;
        this.enemyController = enemyNode.getComponent(EnemyController);
        this.isBattleActive = true;
        this.attackCooldown = 0;
    }

    public stopBattle(): void {
        this.isBattleActive = false;
        this.attackCooldown = 0;
        this.enemyNode = null;
        this.enemyController = null;
    }

    protected update(deltaTime: number): void {
        if (!this.isBattleActive || !this.enemyNode || !this.enemyController) {
            return;
        }

        if (!this.enemyController.isAlive()) {
            return;
        }

        this.attackCooldown -= deltaTime;

        if (this.attackCooldown > 0) {
            return;
        }

        const sourceNode = this.attackPoint ?? this.node;
        const sourcePosition = sourceNode.worldPosition;
        const enemyPosition = this.enemyNode.worldPosition;

        const distance = Vec3.distance(sourcePosition, enemyPosition);

        if (distance > GameplayConfig.towerAttackRange) {
            return;
        }

        this.enemyController.receiveDamage(GameplayConfig.towerDamage);
        this.attackCooldown = GameplayConfig.towerAttackInterval;
    }
}