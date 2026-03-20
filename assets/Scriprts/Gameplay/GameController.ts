import { _decorator, Component, Label, Node } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { GameplayConfig } from '../Core/GameplayConfig';
import { GameState } from '../Core/GameState';
import { BuildSpotController } from './BuildSpotController';
import { EnemyController } from './EnemyController';
import { MineController } from './MineController';
import { SkillButtonController } from './SkillButtonController';
import { TowerController } from './TowerController';

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
    public lightEnemyNode: Node | null = null;

    @property(Node)
    public heavyEnemyNode: Node | null = null;

    @property(Node)
    public enemyPathStartNode: Node | null = null;

    @property(Node)
    public enemyPathEndNode: Node | null = null;

    @property(Node)
    public skillButtonNode: Node | null = null;

    private currentState: GameState = GameState.TapMineTutorial;
    private goldAmount = 0;
    private defeatedEnemiesCount = 0;

    private mineController: MineController | null = null;
    private buildSpotController: BuildSpotController | null = null;
    private towerController: TowerController | null = null;
    private lightEnemyController: EnemyController | null = null;
    private heavyEnemyController: EnemyController | null = null;
    private skillButtonController: SkillButtonController | null = null;

    protected onLoad(): void {
        this.mineController = this.mineNode?.getComponent(MineController) ?? null;
        this.buildSpotController = this.buildSpotNode?.getComponent(BuildSpotController) ?? null;
        this.towerController = this.towerNode?.getComponent(TowerController) ?? null;
        this.lightEnemyController = this.lightEnemyNode?.getComponent(EnemyController) ?? null;
        this.heavyEnemyController = this.heavyEnemyNode?.getComponent(EnemyController) ?? null;
        this.skillButtonController = this.skillButtonNode?.getComponent(SkillButtonController) ?? null;

        GameEventBus.on(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.on(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);
        GameEventBus.on(GameEvent.EnemyDefeated, this.onEnemyDefeated);
        GameEventBus.on(GameEvent.SkillButtonTapped, this.onSkillButtonTapped);
    }

    protected start(): void {
        this.refreshView();
        this.emitStateChanged();
    }

    protected onDestroy(): void {
        GameEventBus.off(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.off(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);
        GameEventBus.off(GameEvent.EnemyDefeated, this.onEnemyDefeated);
        GameEventBus.off(GameEvent.SkillButtonTapped, this.onSkillButtonTapped);
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
        this.defeatedEnemiesCount += 1;

        if (this.currentState === GameState.BattleOne && this.defeatedEnemiesCount === 1) {
            this.currentState = GameState.SkillTutorial;
            this.emitStateChanged();
            this.startSecondBattle();
            this.refreshView();
            return;
        }

        if (this.currentState === GameState.SkillTutorial && this.defeatedEnemiesCount === 2) {
            this.currentState = GameState.Victory;
            this.emitStateChanged();
            this.towerController?.stopBattle();
            this.refreshView();
        }
    };

    private onSkillButtonTapped = (): void => {
        if (this.currentState !== GameState.SkillTutorial) {
            return;
        }

        this.heavyEnemyController?.receiveDamage(GameplayConfig.skillDamage);
    };

    private startFirstBattle(): void {
        if (!this.lightEnemyController || !this.lightEnemyNode || !this.enemyPathStartNode || !this.enemyPathEndNode) {
            return;
        }

        this.hideAllEnemies();

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
            this.currentState === GameState.SkillTutorial ||
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
            this.currentState === GameState.SkillTutorial ||
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

            case GameState.SkillTutorial:
                return 'Use fireball';

            case GameState.Victory:
                return 'Great';

            default:
                return '';
        }
    }
}