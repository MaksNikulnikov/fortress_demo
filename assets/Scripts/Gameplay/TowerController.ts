import { _decorator, Component, Enum, Node, tween, Tween, Vec3 } from 'cc';
import { GameplayConfig } from '../Core/GameplayConfig';
import { ArrowProjectileController } from './ArrowProjectileController';
import { EnemyController } from './EnemyController';

const { ccclass, property } = _decorator;

enum CombatStatsProfile {
    Auto = 0,
    Tower = 1,
    Fortress = 2,
    Custom = 3,
}

@ccclass('TowerController')
export class TowerController extends Component {
    @property(Node)
    public attackPoint: Node | null = null;

    @property(Node)
    public projectileNode: Node | null = null;

    @property({ type: Enum(CombatStatsProfile) })
    public statsProfile = CombatStatsProfile.Auto;

    @property
    public attackRange: number = GameplayConfig.towerAttackRange;

    @property
    public attackInterval: number = GameplayConfig.towerAttackInterval;

    @property
    public attackDamage: number = GameplayConfig.towerDamage;

    @property
    public attackPunchScaleMultiplier = 1.08;

    @property
    public attackPunchDuration = 0.08;

    private enemyController: EnemyController | null = null;
    private enemyNode: Node | null = null;
    private enemyNodes: Node[] = [];
    private projectileController: ArrowProjectileController | null = null;
    private isBattleActive = false;
    private attackCooldown = 0;
    private baseScale = new Vec3(1, 1, 1);
    private attackTween: Tween<Node> | null = null;

    protected onLoad(): void {
        this.baseScale.set(this.node.scale);
        this.syncCombatStatsFromConfig();
        this.projectileController = this.projectileNode?.getComponent(ArrowProjectileController) ?? null;
    }

    public startBattle(enemyNode: Node): void {
        this.enemyNodes = [enemyNode];
        this.setCurrentTarget(enemyNode);
        this.isBattleActive = true;
        this.attackCooldown = 0;
    }

    public startBattleWithTargets(enemyNodes: Node[]): void {
        this.enemyNodes = enemyNodes;
        this.setCurrentTarget(this.findBestAvailableTarget());
        this.isBattleActive = true;
        this.attackCooldown = 0;
    }

    public stopBattle(): void {
        this.isBattleActive = false;
        this.attackCooldown = 0;
        this.enemyNode = null;
        this.enemyController = null;
        this.enemyNodes = [];

        if (this.attackTween) {
            this.attackTween.stop();
            this.attackTween = null;
        }

        this.node.setScale(this.baseScale);
    }

    protected update(deltaTime: number): void {
        if (!this.isBattleActive) {
            return;
        }

        this.ensureCurrentTarget();

        if (!this.enemyNode || !this.enemyController) {
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
            const targetNode = this.enemyNode;
            const targetController = this.enemyController;

            this.projectileController.shoot(sourceNode, targetNode, () => {
                if (!targetController.isAlive()) {
                    return;
                }

                targetController.receiveDamage(this.attackDamage);
            });

            return;
        }

        this.enemyController.receiveDamage(this.attackDamage);
    }

    private ensureCurrentTarget(): void {
        if (this.enemyController && this.enemyController.isAlive() && this.enemyNode?.active) {
            return;
        }

        this.setCurrentTarget(this.findBestAvailableTarget());
    }

    private findBestAvailableTarget(): Node | null {
        if (this.enemyNodes.length === 0) {
            return null;
        }

        const sourceNode = this.attackPoint ?? this.node;
        const sourcePosition = sourceNode.worldPosition;

        let bestNode: Node | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (let index = 0; index < this.enemyNodes.length; index += 1) {
            const enemyNode = this.enemyNodes[index];

            if (!enemyNode?.active) {
                continue;
            }

            const enemyController = enemyNode.getComponent(EnemyController);

            if (!enemyController || !enemyController.isAlive()) {
                continue;
            }

            const distance = Vec3.distance(sourcePosition, enemyNode.worldPosition);

            if (distance > this.attackRange) {
                continue;
            }

            if (distance < bestDistance) {
                bestDistance = distance;
                bestNode = enemyNode;
            }
        }

        return bestNode;
    }

    private setCurrentTarget(enemyNode: Node | null): void {
        this.enemyNode = enemyNode;
        this.enemyController = enemyNode?.getComponent(EnemyController) ?? null;
    }

    private syncCombatStatsFromConfig(): void {
        const resolvedProfile = this.resolveStatsProfile();

        if (resolvedProfile === CombatStatsProfile.Tower) {
            this.attackRange = GameplayConfig.towerAttackRange;
            this.attackInterval = GameplayConfig.towerAttackInterval;
            this.attackDamage = GameplayConfig.towerDamage;
            return;
        }

        if (resolvedProfile === CombatStatsProfile.Fortress) {
            this.attackRange = GameplayConfig.fortressAttackRange;
            this.attackInterval = GameplayConfig.fortressAttackInterval;
            this.attackDamage = GameplayConfig.fortressDamage;
        }
    }

    private resolveStatsProfile(): CombatStatsProfile {
        if (this.statsProfile !== CombatStatsProfile.Auto) {
            return this.statsProfile;
        }

        const nodeName = this.node.name.toLowerCase();

        if (nodeName.includes('fortress')) {
            return CombatStatsProfile.Fortress;
        }

        if (nodeName.includes('tower')) {
            return CombatStatsProfile.Tower;
        }

        return CombatStatsProfile.Custom;
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
