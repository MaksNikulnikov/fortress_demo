import { _decorator, Component, Node, tween, Tween, Vec3 } from 'cc';
import { GameplayConfig } from '../Core/GameplayConfig';
import { ArrowProjectileController } from './ArrowProjectileController';
import { EnemyController } from './EnemyController';

const { ccclass, property } = _decorator;

@ccclass('TowerController')
export class TowerController extends Component {
    @property(Node)
    public attackPoint: Node | null = null;

    @property(Node)
    public projectileNode: Node | null = null;

    @property
    public attackRange = GameplayConfig.towerAttackRange;

    @property
    public attackInterval = GameplayConfig.towerAttackInterval;

    @property
    public attackDamage = GameplayConfig.towerDamage;

    @property
    public attackPunchScaleMultiplier = 1.08;

    @property
    public attackPunchDuration = 0.08;

    private enemyController: EnemyController | null = null;
    private enemyNode: Node | null = null;
    private projectileController: ArrowProjectileController | null = null;
    private isBattleActive = false;
    private attackCooldown = 0;
    private baseScale = new Vec3(1, 1, 1);
    private attackTween: Tween<Node> | null = null;

    protected onLoad(): void {
        this.baseScale.set(this.node.scale);
        this.projectileController = this.projectileNode?.getComponent(ArrowProjectileController) ?? null;
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

        if (this.projectileController?.isBusy()) {
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

        if (distance > this.attackRange) {
            return;
        }

        this.playAttackFeedback();
        this.attackCooldown = this.attackInterval;

        if (this.projectileController) {
            this.projectileController.shoot(sourceNode, this.enemyNode, () => {
                if (!this.enemyController || !this.enemyController.isAlive()) {
                    return;
                }

                this.enemyController.receiveDamage(this.attackDamage);
            });

            return;
        }

        this.enemyController.receiveDamage(this.attackDamage);
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