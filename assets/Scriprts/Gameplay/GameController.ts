import { _decorator, Component, Label } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { GameState } from '../Core/GameState';
import { GameplayConfig } from '../Core/GameplayConfig';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Label)
    public goldLabel: Label | null = null;

    @property(Label)
    public tutorialLabel: Label | null = null;

    private currentState: GameState = GameState.TapMineTutorial;
    private goldAmount = 0;

    protected onLoad(): void {
        GameEventBus.on(GameEvent.MineTapped, this.onMineTapped);
        this.refreshView();
        this.emitStateChanged();
    }

    protected onDestroy(): void {
        GameEventBus.off(GameEvent.MineTapped, this.onMineTapped);
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

            GameEventBus.emit(GameEvent.TutorialUpdated, {
                state: this.currentState,
                text: this.getTutorialText(),
            });
        }

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

    private getTutorialText(): string {
        switch (this.currentState) {
            case GameState.TapMineTutorial:
                return 'Tap the mine';

            case GameState.BuildTowerTutorial:
                return 'Build the tower';

            default:
                return '';
        }
    }
}