import { _decorator, Animation, Color, Component, Node, Sprite, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { GameplayConfig } from '../Core/GameplayConfig';

const { ccclass, property } = _decorator;

enum EnemyPhase {
    Idle = 'Idle',
    Moving = 'Moving',
    Attacking = 'Attacking',
    Dying = 'Dying',
    Dead = 'Dead',
}

@ccclass('EnemyController')
export class EnemyController extends Component {
    @property(Animation)
    public animationComponent: Animation | null = null;

    @property(Sprite)
    public bodySprite: Sprite | null = null;

    @property(UIOpacity)
    public bodyOpacity: UIOpacity | null = null;

    @property
    public walkAnimationName = '';

    @property
    public attackAnimationName = '';

    @property
    public deathAnimationName = '';

    @property
    public canAttackAtGoal = false;

    @property
    public deathFadeDelay = 1;

    @property
    public deathFadeDuration = 0.35;

    private moveTarget: Node | null = null;
    private currentHealth: number = GameplayConfig.lightEnemyMaxHealth;
    private movementDirection = new Vec3();
    private currentPhase: EnemyPhase = EnemyPhase.Idle;
    private hasReachedGoal = false;
    private hitTween: Tween<Sprite> | null = null;
    private fadeTween: Tween<UIOpacity> | null = null;

    protected onLoad(): void {
        if (!this.animationComponent) {
            this.animationComponent = this.getComponent(Animation);
        }

        if (!this.bodySprite) {
            this.bodySprite = this.getComponent(Sprite);
        }

        if (!this.bodyOpacity) {
            this.bodyOpacity = this.getComponent(UIOpacity);
        }
    }

    protected onDestroy(): void {
        this.animationComponent?.off(Animation.EventType.FINISHED, this.onDeathAnimationFinished, this);

        if (this.hitTween) {
            this.hitTween.stop();
            this.hitTween = null;
        }

        if (this.fadeTween) {
            this.fadeTween.stop();
            this.fadeTween = null;
        }
    }

    protected update(deltaTime: number): void {
        if (this.currentPhase !== EnemyPhase.Moving || !this.moveTarget || !this.node.active) {
            return;
        }

        const currentPosition = this.node.worldPosition;
        const targetPosition = this.moveTarget.worldPosition;

        Vec3.subtract(this.movementDirection, targetPosition, currentPosition);
        const distanceToTarget = this.movementDirection.length();

        if (distanceToTarget <= GameplayConfig.enemyMoveSpeed * deltaTime) {
            this.node.setWorldPosition(targetPosition);
            this.onReachedGoal();
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
        this.stopRunningTweens();
        this.animationComponent?.off(Animation.EventType.FINISHED, this.onDeathAnimationFinished, this);

        this.currentHealth = maxHealth;
        this.moveTarget = endNode;
        this.currentPhase = EnemyPhase.Moving;
        this.hasReachedGoal = false;

        this.node.active = true;
        this.node.setWorldPosition(startNode.worldPosition);

        if (this.bodyOpacity) {
            this.bodyOpacity.opacity = 255;
        }

        if (this.bodySprite) {
            this.bodySprite.color = Color.WHITE.clone();
        }

        this.playAnimation(this.walkAnimationName);
    }

    public receiveDamage(damage: number): void {
        if (!this.node.active) {
            return;
        }

        if (this.currentPhase === EnemyPhase.Dying || this.currentPhase === EnemyPhase.Dead) {
            return;
        }

        this.playHitFeedback();

        this.currentHealth -= damage;

        if (this.currentHealth > 0) {
            return;
        }

        this.playDeathSequence();
    }

    public isAlive(): boolean {
        return this.node.active && this.currentPhase !== EnemyPhase.Dying && this.currentPhase !== EnemyPhase.Dead;
    }

    private onReachedGoal(): void {
        this.currentPhase = this.canAttackAtGoal ? EnemyPhase.Attacking : EnemyPhase.Idle;

        if (this.canAttackAtGoal) {
            this.playAnimation(this.attackAnimationName);

            if (!this.hasReachedGoal) {
                this.hasReachedGoal = true;
                GameEventBus.emit(GameEvent.EnemyReachedGoal);
            }
        }
    }

    private playDeathSequence(): void {
        this.currentPhase = EnemyPhase.Dying;
        this.animationComponent?.off(Animation.EventType.FINISHED, this.onDeathAnimationFinished, this);

        if (this.deathAnimationName && this.animationComponent) {
            this.animationComponent.once(Animation.EventType.FINISHED, this.onDeathAnimationFinished, this);
            this.playAnimation(this.deathAnimationName);
            return;
        }

        this.onDeathAnimationFinished();
    }

    private onDeathAnimationFinished(): void {
        if (this.currentPhase !== EnemyPhase.Dying) {
            return;
        }

        if (!this.bodyOpacity) {
            this.finishDeath();
            return;
        }

        this.fadeTween = tween(this.bodyOpacity)
            .delay(this.deathFadeDelay)
            .to(this.deathFadeDuration, { opacity: 0 })
            .call(() => {
                this.finishDeath();
            })
            .start();
    }

    private finishDeath(): void {
        this.currentPhase = EnemyPhase.Dead;
        this.node.active = false;
        GameEventBus.emit(GameEvent.EnemyDefeated);
    }

    private playAnimation(animationName: string): void {
        if (!animationName || !this.animationComponent) {
            return;
        }

        this.animationComponent.play(animationName);
    }

    private playHitFeedback(): void {
        if (!this.bodySprite) {
            return;
        }

        if (this.hitTween) {
            this.hitTween.stop();
        }

        this.bodySprite.color = new Color(255, 255, 255, 255);

        this.hitTween = tween(this.bodySprite)
            .to(0.06, { color: new Color(255, 180, 180, 255) })
            .to(0.08, { color: Color.WHITE.clone() })
            .start();
    }

    private stopRunningTweens(): void {
        if (this.hitTween) {
            this.hitTween.stop();
            this.hitTween = null;
        }

        if (this.fadeTween) {
            this.fadeTween.stop();
            this.fadeTween = null;
        }
    }
}