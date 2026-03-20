import { _decorator, Component, Label, Node } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { GameplayConfig } from '../Core/GameplayConfig';
import { GameState } from '../Core/GameState';
import { BuildSpotController } from './BuildSpotController';
import { EnemyController } from './EnemyController';
import { TowerController } from './TowerController';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Label)
    public goldLabel: Label | null = null;

    @property(Label)
    public tutorialLabel: Label | null = null;

    @property(Node)
    public buildSpotNode: Node | null = null;

    @property(Node)
    public towerNode: Node | null = null;

    @property(Node)
    public enemyNode: Node | null = null;

    @property(Node)
    public enemyPathStartNode: Node | null = null;

    @property(Node)
    public enemyPathEndNode: Node | null = null;

    private currentState: GameState = GameState.TapMineTutorial;
    private goldAmount = 0;
    private buildSpotController: BuildSpotController | null = null;
    private towerController: TowerController | null = null;
    private enemyController: EnemyController | null = null;

    protected onLoad(): void {
        this.buildSpotController = this.buildSpotNode?.getComponent(BuildSpotController) ?? null;
        this.towerController = this.towerNode?.getComponent(TowerController) ?? null;
        this.enemyController = this.enemyNode?.getComponent(EnemyController) ?? null;

        GameEventBus.on(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.on(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);
        GameEventBus.on(GameEvent.EnemyDefeated, this.onEnemyDefeated);

        this.refreshView();
        this.emitStateChanged();
    }

    protected onDestroy(): void {
        GameEventBus.off(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.off(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);
        GameEventBus.off(GameEvent.EnemyDefeated, this.onEnemyDefeated);
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

        this.currentState = GameState.Battle;
        this.emitStateChanged();
        this.startBattle();
        this.refreshView();
    };

    private onEnemyDefeated = (): void => {
        if (this.currentState !== GameState.Battle) {
            return;
        }

        this.currentState = GameState.Victory;
        this.emitStateChanged();
        this.towerController?.stopBattle();
        this.refreshView();
    };

    private startBattle(): void {
        if (!this.enemyController || !this.enemyPathStartNode || !this.enemyPathEndNode || !this.enemyNode) {
            return;
        }

        this.enemyController.startBattle(this.enemyPathStartNode, this.enemyPathEndNode);
        this.towerController?.startBattle(this.enemyNode);
    }

    private emitStateChanged(): void {
        GameEventBus.emit(GameEvent.StateChanged, {
            state: this.currentState,
        });
    }

    private refreshView(): void {
        this.updateGoldLabel();
        this.updateTutorialLabel();
        this.updateBuildSpotView();
        this.updateTowerView();
        this.updateEnemyView();
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

    private updateBuildSpotView(): void {
        const isBuildStep = this.currentState === GameState.BuildTowerTutorial;
        const shouldHideBuildSpot =
            this.currentState === GameState.Battle || this.currentState === GameState.Victory;

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
            this.currentState === GameState.Battle || this.currentState === GameState.Victory;
    }

    private updateEnemyView(): void {
        if (!this.enemyNode) {
            return;
        }

        if (this.currentState === GameState.TapMineTutorial || this.currentState === GameState.BuildTowerTutorial) {
            this.enemyNode.active = false;
        }
    }

    private getTutorialText(): string {
        switch (this.currentState) {
            case GameState.TapMineTutorial:
                return 'Tap the mine';

            case GameState.BuildTowerTutorial:
                return 'Build the tower';

            case GameState.Battle:
                return 'Defend the fortress';

            case GameState.Victory:
                return 'Great';

            default:
                return '';
        }
    }
}