import { _decorator, Component, Label, Node } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { GameplayConfig } from '../Core/GameplayConfig';
import { GameState } from '../Core/GameState';
import { BuildSpotController } from './BuildSpotController';
import { EnemyController } from './EnemyController';
import { FireballController } from './FireballController';
import { FortressController } from './FortressController';
import { MineController } from './MineController';
import { SkillButtonController } from './SkillButtonController';
import { TowerController } from './TowerController';
import { VictoryOverlayController } from './VictoryOverlayController';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Label)
    public goldLabel: Label | null = null;

    @property(Label)
    public tutorialLabel: Label | null = null;

    @property(Node)
    public mineNode: Node | null = null;

    @property(Node)
    public buildSpotNode: Node | null = null;

    @property(Node)
    public towerNode: Node | null = null;

    @property(Node)
    public fortressNode: Node | null = null;

    @property(Node)
    public lightEnemyNode: Node | null = null;

    @property(Node)
    public heavyEnemyNode: Node | null = null;

    @property(Node)
    public enemyPathStartNode: Node | null = null;

    @property(Node)
    public enemyPathEndNode: Node | null = null;

    @property(Node)
    public skillButtonNode: Node | null = null;

    @property(Node)
    public victoryOverlayNode: Node | null = null;

    @property(Node)
    public fireballNode: Node | null = null;

    @property(Node)
    public fireballSkyCastPointNode: Node | null = null;

    private currentState: GameState = GameState.TapMineTutorial;
    private goldAmount = 0;

    private mineController: MineController | null = null;
    private buildSpotController: BuildSpotController | null = null;
    private towerController: TowerController | null = null;
    private fortressAttackController: TowerController | null = null;
    private fortressController: FortressController | null = null;
    private lightEnemyController: EnemyController | null = null;
    private heavyEnemyController: EnemyController | null = null;
    private skillButtonController: SkillButtonController | null = null;
    private victoryOverlayController: VictoryOverlayController | null = null;
    private fireballController: FireballController | null = null;

    protected onLoad(): void {
        this.mineController = this.mineNode?.getComponent(MineController) ?? null;
        this.buildSpotController = this.buildSpotNode?.getComponent(BuildSpotController) ?? null;
        this.towerController = this.towerNode?.getComponent(TowerController) ?? null;
        this.fortressAttackController = this.fortressNode?.getComponent(TowerController) ?? null;
        this.fortressController = this.fortressNode?.getComponent(FortressController) ?? null;
        this.lightEnemyController = this.lightEnemyNode?.getComponent(EnemyController) ?? null;
        this.heavyEnemyController = this.heavyEnemyNode?.getComponent(EnemyController) ?? null;
        this.skillButtonController = this.skillButtonNode?.getComponent(SkillButtonController) ?? null;
        this.victoryOverlayController = this.victoryOverlayNode?.getComponent(VictoryOverlayController) ?? null;
        this.fireballController = this.fireballNode?.getComponent(FireballController) ?? null;

        GameEventBus.on(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.on(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);
        GameEventBus.on(GameEvent.EnemyDefeated, this.onEnemyDefeated);
        GameEventBus.on(GameEvent.EnemyReachedGoal, this.onEnemyReachedGoal);
        GameEventBus.on(GameEvent.EnemyAttackPerformed, this.onEnemyAttackPerformed);
        GameEventBus.on(GameEvent.SkillButtonTapped, this.onSkillButtonTapped);
        GameEventBus.on(GameEvent.FireballImpactFinished, this.onFireballImpactFinished);
    }

    protected start(): void {
        this.refreshView();
        this.emitStateChanged();
    }

    protected onDestroy(): void {
        GameEventBus.off(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.off(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);
        GameEventBus.off(GameEvent.EnemyDefeated, this.onEnemyDefeated);
        GameEventBus.off(GameEvent.EnemyReachedGoal, this.onEnemyReachedGoal);
        GameEventBus.off(GameEvent.EnemyAttackPerformed, this.onEnemyAttackPerformed);
        GameEventBus.off(GameEvent.SkillButtonTapped, this.onSkillButtonTapped);
        GameEventBus.off(GameEvent.FireballImpactFinished, this.onFireballImpactFinished);
    }

    private onMineTapped = (): void => {
        if (this.currentState !== GameState.TapMineTutorial) {
            return;
        }

        this.goldAmount += GameplayConfig.goldPerMineTap;

        GameEventBus.emit(GameEvent.GoldChanged, {
            goldAmount: this.goldAmount,
        });

        if (this.goldAmount >= GameplayConfig.goldTargetForTowerBuild) {
            this.currentState = GameState.BuildTowerTutorial;
            this.emitStateChanged();
        }

        this.refreshView();
    };

    private onBuildSpotTapped = (): void => {
        if (this.currentState !== GameState.BuildTowerTutorial) {
            return;
        }

        this.currentState = GameState.BattleOne;
        this.emitStateChanged();
        this.startFirstBattle();
        this.refreshView();
    };

    private onEnemyDefeated = (): void => {
        if (this.currentState === GameState.BattleOne) {
            this.currentState = GameState.BattleTwo;
            this.emitStateChanged();
            this.startSecondBattle();
            this.refreshView();
            return;
        }

        if (this.currentState === GameState.FireballCast) {
            this.currentState = GameState.Victory;
            this.emitStateChanged();
            this.towerController?.stopBattle();
            this.fortressAttackController?.stopBattle();
            this.refreshView();
            this.victoryOverlayController?.show();
        }
    };

    private onEnemyReachedGoal = (): void => {
        if (this.currentState !== GameState.BattleTwo) {
            return;
        }

        this.currentState = GameState.SkillTutorial;
        this.emitStateChanged();
        this.towerController?.stopBattle();
        this.fortressAttackController?.startBattle(this.heavyEnemyNode as Node);
        this.refreshView();
    };

    private onEnemyAttackPerformed = (): void => {
        if (this.currentState !== GameState.SkillTutorial) {
            return;
        }

        this.fortressController?.playDamageFeedback();
    };

    private onSkillButtonTapped = (): void => {
        if (this.currentState !== GameState.SkillTutorial) {
            return;
        }

        this.currentState = GameState.FireballCast;
        this.emitStateChanged();

        this.skillButtonController?.setInteractionEnabled(false);
        this.skillButtonController?.setHighlightVisible(false);
        this.refreshView();

        if (!this.fireballController || !this.heavyEnemyNode || !this.fireballSkyCastPointNode) {
            this.heavyEnemyController?.receiveDamage(GameplayConfig.skillDamage);
            return;
        }

        this.fireballController.castFromSky(this.heavyEnemyNode, this.fireballSkyCastPointNode);
    };

    private onFireballImpactFinished = (): void => {
        if (this.currentState !== GameState.FireballCast) {
            return;
        }

        this.heavyEnemyController?.receiveDamage(GameplayConfig.skillDamage);
    };

    private startFirstBattle(): void {
        if (!this.lightEnemyController || !this.lightEnemyNode || !this.enemyPathStartNode || !this.enemyPathEndNode) {
            return;
        }

        this.hideAllEnemies();
        this.fortressAttackController?.stopBattle();

        this.lightEnemyController.startBattle(
            this.enemyPathStartNode,
            this.enemyPathEndNode,
            GameplayConfig.lightEnemyMaxHealth
        );

        this.towerController?.startBattle(this.lightEnemyNode);
    }

    private startSecondBattle(): void {
        if (!this.heavyEnemyController || !this.heavyEnemyNode || !this.enemyPathStartNode || !this.enemyPathEndNode) {
            return;
        }

        this.hideAllEnemies();
        this.fortressAttackController?.stopBattle();

        this.heavyEnemyController.startBattle(
            this.enemyPathStartNode,
            this.enemyPathEndNode,
            GameplayConfig.heavyEnemyMaxHealth
        );

        this.towerController?.startBattle(this.heavyEnemyNode);
    }

    private hideAllEnemies(): void {
        if (this.lightEnemyNode) {
            this.lightEnemyNode.active = false;
        }

        if (this.heavyEnemyNode) {
            this.heavyEnemyNode.active = false;
        }
    }

    private emitStateChanged(): void {
        GameEventBus.emit(GameEvent.StateChanged, {
            state: this.currentState,
        });
    }

    private refreshView(): void {
        this.updateGoldLabel();
        this.updateTutorialLabel();
        this.updateMineView();
        this.updateBuildSpotView();
        this.updateTowerView();
        this.updateEnemyView();
        this.updateSkillButtonView();
    }

    private updateGoldLabel(): void {
        if (!this.goldLabel) {
            return;
        }

        this.goldLabel.string = `Gold: ${this.goldAmount}`;
    }

    private updateTutorialLabel(): void {
        if (!this.tutorialLabel) {
            return;
        }

        this.tutorialLabel.string = this.getTutorialText();
    }

    private updateMineView(): void {
        const isMineStep = this.currentState === GameState.TapMineTutorial;
        this.mineController?.setHighlightVisible(isMineStep);
    }

    private updateBuildSpotView(): void {
        const isBuildStep = this.currentState === GameState.BuildTowerTutorial;
        const shouldHideBuildSpot =
            this.currentState === GameState.BattleOne ||
            this.currentState === GameState.BattleTwo ||
            this.currentState === GameState.SkillTutorial ||
            this.currentState === GameState.FireballCast ||
            this.currentState === GameState.Victory;

        if (this.buildSpotNode) {
            this.buildSpotNode.active = !shouldHideBuildSpot;
        }

        this.buildSpotController?.setInteractionEnabled(isBuildStep);
        this.buildSpotController?.setHighlightVisible(isBuildStep);
    }

    private updateTowerView(): void {
        if (!this.towerNode) {
            return;
        }

        this.towerNode.active =
            this.currentState === GameState.BattleOne ||
            this.currentState === GameState.BattleTwo ||
            this.currentState === GameState.SkillTutorial ||
            this.currentState === GameState.FireballCast ||
            this.currentState === GameState.Victory;
    }

    private updateEnemyView(): void {
        if (
            this.currentState === GameState.TapMineTutorial ||
            this.currentState === GameState.BuildTowerTutorial ||
            this.currentState === GameState.Victory
        ) {
            this.hideAllEnemies();
        }
    }

    private updateSkillButtonView(): void {
        if (!this.skillButtonNode) {
            return;
        }

        const isSkillStep = this.currentState === GameState.SkillTutorial;

        this.skillButtonNode.active = isSkillStep;
        this.skillButtonController?.setInteractionEnabled(isSkillStep);
        this.skillButtonController?.setHighlightVisible(isSkillStep);
    }

    private getTutorialText(): string {
        switch (this.currentState) {
            case GameState.TapMineTutorial:
                return 'Tap the mine';

            case GameState.BuildTowerTutorial:
                return 'Build the tower';

            case GameState.BattleOne:
                return 'Defend the fortress';

            case GameState.BattleTwo:
                return 'Heavy enemy incoming';

            case GameState.SkillTutorial:
                return 'Use fireball';

            case GameState.FireballCast:
                return '';

            case GameState.Victory:
                return '';

            default:
                return '';
        }
    }
}