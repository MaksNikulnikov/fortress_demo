import { _decorator, Component, Label, Node } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { GameplayConfig } from '../Core/GameplayConfig';
import { GameState } from '../Core/GameState';
import { BuildSpotController } from './BuildSpotController';

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

    private currentState: GameState = GameState.TapMineTutorial;
    private goldAmount = 0;
    private buildSpotController: BuildSpotController | null = null;

    protected onLoad(): void {
        this.buildSpotController = this.buildSpotNode?.getComponent(BuildSpotController) ?? null;

        GameEventBus.on(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.on(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);

        this.refreshView();
        this.emitStateChanged();
    }

    protected onDestroy(): void {
        GameEventBus.off(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.off(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);
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

        this.currentState = GameState.TowerBuilt;
        this.emitStateChanged();
        this.refreshView();
    };

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
        const isTowerBuilt = this.currentState === GameState.TowerBuilt;

        if (this.buildSpotNode) {
            this.buildSpotNode.active = !isTowerBuilt;
        }

        this.buildSpotController?.setInteractionEnabled(isBuildStep);
        this.buildSpotController?.setHighlightVisible(isBuildStep);
    }

    private updateTowerView(): void {
        if (!this.towerNode) {
            return;
        }

        this.towerNode.active = this.currentState === GameState.TowerBuilt;
    }

    private getTutorialText(): string {
        switch (this.currentState) {
            case GameState.TapMineTutorial:
                return 'Tap the mine';
            case GameState.BuildTowerTutorial:
                return 'Build the tower';
            case GameState.TowerBuilt:
                return 'Good';
            default:
                return '';
        }
    }
}