import { _decorator, Component, Label, Node, tween } from 'cc';
import { GameEvent } from '../Core/GameEvent';
import { GameEventBus } from '../Core/GameEventBus';
import { GameplayConfig } from '../Core/GameplayConfig';
import { GameState } from '../Core/GameState';
import { BuildSpotController } from './BuildSpotController';
import { EnemyController } from './EnemyController';
import { FireballController } from './FireballController';
import { FortressController } from './FortressController';
import { GoldCounterController } from './GoldCounterController';
import { MineController } from './MineController';
import { SkillButtonController } from './SkillButtonController';
import { TowerController } from './TowerController';
import { TutorialLabelController } from './TutorialLabelController';
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

    @property([Node])
    public lightEnemyNodes: Node[] = [];

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
    private defeatedLightEnemiesCount = 0;
    private spawnedLightEnemiesCount = 0;
    private hasShownBattleOneTutorial = false;

    private mineController: MineController | null = null;
    private buildSpotController: BuildSpotController | null = null;
    private towerController: TowerController | null = null;
    private fortressAttackController: TowerController | null = null;
    private fortressController: FortressController | null = null;
    private heavyEnemyController: EnemyController | null = null;
    private skillButtonController: SkillButtonController | null = null;
    private victoryOverlayController: VictoryOverlayController | null = null;
    private fireballController: FireballController | null = null;
    private tutorialLabelController: TutorialLabelController | null = null;
    private goldCounterController: GoldCounterController | null = null;

    protected onLoad(): void {
        this.mineController = this.mineNode?.getComponent(MineController) ?? null;
        this.buildSpotController = this.buildSpotNode?.getComponent(BuildSpotController) ?? null;
        this.towerController = this.towerNode?.getComponent(TowerController) ?? null;
        this.fortressAttackController = this.fortressNode?.getComponent(TowerController) ?? null;
        this.fortressController = this.fortressNode?.getComponent(FortressController) ?? null;
        this.heavyEnemyController = this.heavyEnemyNode?.getComponent(EnemyController) ?? null;
        this.skillButtonController = this.skillButtonNode?.getComponent(SkillButtonController) ?? null;
        this.victoryOverlayController = this.victoryOverlayNode?.getComponent(VictoryOverlayController) ?? null;
        this.fireballController = this.fireballNode?.getComponent(FireballController) ?? null;
        this.tutorialLabelController = this.tutorialLabel?.getComponent(TutorialLabelController) ?? null;
        this.goldCounterController = this.goldLabel?.getComponent(GoldCounterController) ?? null;

        GameEventBus.on(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.on(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);
        GameEventBus.on(GameEvent.EnemyDefeated, this.onEnemyDefeated);
        GameEventBus.on(GameEvent.EnemyReachedGoal, this.onEnemyReachedGoal);
        GameEventBus.on(GameEvent.EnemyAttackPerformed, this.onEnemyAttackPerformed);
        GameEventBus.on(GameEvent.SkillButtonTapped, this.onSkillButtonTapped);
        GameEventBus.on(GameEvent.FireballImpactFinished, this.onFireballImpactFinished);

        this.hideAllLightEnemies();

        if (this.heavyEnemyNode) {
            this.heavyEnemyNode.active = false;
        }
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
        this.defeatedLightEnemiesCount = 0;
        this.spawnedLightEnemiesCount = 0;
        this.hasShownBattleOneTutorial = false;

        this.emitStateChanged();
        this.startLightWave();
        this.refreshView();
    };

    private onEnemyDefeated = (): void => {
        if (this.currentState === GameState.BattleOne) {
            this.defeatedLightEnemiesCount += 1;

            if (this.defeatedLightEnemiesCount >= GameplayConfig.lightEnemyCountInWave) {
                this.currentState = GameState.BattleTwo;
                this.emitStateChanged();
                this.startSecondBattle();
                this.refreshView();
                return;
            }

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

        if (this.heavyEnemyNode) {
            this.fortressAttackController?.startBattle(this.heavyEnemyNode);
        }

        this.refreshView();
        this.skillButtonController?.playShowAnimation();
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

        this.towerController?.stopBattle();
        this.fortressAttackController?.stopBattle();

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

    private startLightWave(): void {
        this.hideAllEnemies();
        this.fortressAttackController?.stopBattle();

        for (let index = 0; index < GameplayConfig.lightEnemyCountInWave; index += 1) {
            tween(this.node)
                .delay(index * GameplayConfig.lightEnemySpawnInterval)
                .call(() => {
                    if (this.currentState !== GameState.BattleOne) {
                        return;
                    }

                    this.spawnNextLightEnemy();
                })
                .start();
        }
    }

    private spawnNextLightEnemy(): void {
        if (!this.enemyPathStartNode || !this.enemyPathEndNode) {
            return;
        }

        if (this.spawnedLightEnemiesCount >= GameplayConfig.lightEnemyCountInWave) {
            return;
        }

        const nextEnemyNode = this.getAvailableLightEnemyNode();

        if (!nextEnemyNode) {
            return;
        }

        const nextEnemyController = nextEnemyNode.getComponent(EnemyController);

        if (!nextEnemyController) {
            return;
        }

        nextEnemyController.startBattle(
            this.enemyPathStartNode,
            this.enemyPathEndNode,
            GameplayConfig.lightEnemyMaxHealth
        );

        this.spawnedLightEnemiesCount += 1;

        this.towerController?.startBattleWithTargets(this.lightEnemyNodes);
    }

    private getAvailableLightEnemyNode(): Node | null {
        return this.lightEnemyNodes.find((enemyNode) => !enemyNode.active) ?? null;
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

    private hideAllLightEnemies(): void {
        for (const enemyNode of this.lightEnemyNodes) {
            enemyNode.active = false;
        }
    }

    private hideAllEnemies(): void {
        this.hideAllLightEnemies();

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
        const shouldShowTarget = this.currentState === GameState.TapMineTutorial;

        if (this.goldCounterController) {
            this.goldCounterController.updateValue(
                this.goldAmount,
                GameplayConfig.goldTargetForTowerBuild,
                shouldShowTarget
            );
            return;
        }

        if (!this.goldLabel) {
            return;
        }

        this.goldLabel.string = shouldShowTarget
            ? `Gold: ${this.goldAmount}/${GameplayConfig.goldTargetForTowerBuild}`
            : `Gold: ${this.goldAmount}`;
    }

    private updateTutorialLabel(): void {
        const tutorialText = this.getTutorialText();

        if (this.tutorialLabelController) {
            if (tutorialText.type === 'persistent') {
                this.tutorialLabelController.showPersistentText(tutorialText.text);
            } else if (tutorialText.type === 'temporary') {
                this.tutorialLabelController.showTemporaryText(tutorialText.text);

                if (this.currentState === GameState.BattleOne) {
                    this.hasShownBattleOneTutorial = true;
                }
            } else {
                this.tutorialLabelController.hide();
            }

            return;
        }

        if (!this.tutorialLabel) {
            return;
        }

        this.tutorialLabel.string = tutorialText.text;

        if (tutorialText.type === 'temporary' && this.currentState === GameState.BattleOne) {
            this.hasShownBattleOneTutorial = true;
        }
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

    private getTutorialText(): { text: string; type: 'persistent' | 'temporary' | 'hidden' } {
        switch (this.currentState) {
            case GameState.TapMineTutorial:
                return {
                    text: `Tap the mine ${this.goldAmount}/${GameplayConfig.goldTargetForTowerBuild}`,
                    type: 'persistent',
                };

            case GameState.BuildTowerTutorial:
                return {
                    text: 'Build the tower',
                    type: 'persistent',
                };

            case GameState.BattleOne:
                return {
                    text: this.hasShownBattleOneTutorial ? '' : 'Defend the fortress',
                    type: this.hasShownBattleOneTutorial ? 'hidden' : 'temporary',
                };

            case GameState.BattleTwo:
                return {
                    text: 'Heavy enemy incoming',
                    type: 'temporary',
                };

            case GameState.SkillTutorial:
                return {
                    text: 'Use fireball',
                    type: 'persistent',
                };

            case GameState.FireballCast:
                return {
                    text: '',
                    type: 'hidden',
                };

            case GameState.Victory:
                return {
                    text: '',
                    type: 'hidden',
                };

            default:
                return {
                    text: '',
                    type: 'hidden',
                };
        }
    }
}