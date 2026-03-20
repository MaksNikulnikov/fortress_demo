import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
import { GameplayConfig } from '../Core/GameplayConfig';
import { EnemyController } from './EnemyController';

const { ccclass, property } = _decorator;

@ccclass('TowerController')
export class TowerController extends Component {
    @property(Node)
    public attackPoint: Node | null = null;

    @property
    public attackPunchScaleMultiplier = 1.08;

    @property
    public attackPunchDuration = 0.08;

    private enemyController: EnemyController | null = null;
    private enemyNode: Node | null = null;
    private isBattleActive = false;
    private attackCooldown = 0;
    private baseScale = new Vec3(1, 1, 1);
    private attackTween: Tween<Node> | null = null;

    protected onLoad(): void {
        this.baseScale.set(this.node.scale);
    }

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

        if (this.attackTween) {
            this.attackTween.stop();
            this.attackTween = null;
        }

        this.node.setScale(this.baseScale);
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

        this.playAttackFeedback();
        this.enemyController.receiveDamage(GameplayConfig.towerDamage);
        this.attackCooldown = GameplayConfig.towerAttackInterval;
    }

    private playAttackFeedback(): void {
        if (this.attackTween) {
            this.attackTween.stop();
        }

        const punchScale = new Vec3(
            this.baseScale.x * this.attackPunchScaleMultiplier,
            this.baseScale.y * this.attackPunchScaleMultiplier,
            this.baseScale.z
        );

        this.attackTween = tween(this.node)
            .to(this.attackPunchDuration, { scale: punchScale })
            .to(this.attackPunchDuration, { scale: this.baseScale.clone() })
            .start();
    }
}