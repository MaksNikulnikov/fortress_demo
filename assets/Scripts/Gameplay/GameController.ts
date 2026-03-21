import { _decorator, Component, Label, Node, tween, Tween } from 'cc';
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

type TutorialTextType = 'persistent' | 'temporary' | 'hidden';

interface TutorialMessage {
    text: string;
    type: TutorialTextType;
}

const BUILD_SPOT_HIDDEN_STATES: GameState[] = [
    GameState.BattleOne,
    GameState.BattleTwo,
    GameState.SkillTutorial,
    GameState.FireballCast,
    GameState.Victory,
];

const TOWER_VISIBLE_STATES: GameState[] = [
    GameState.BattleOne,
    GameState.BattleTwo,
    GameState.SkillTutorial,
    GameState.FireballCast,
    GameState.Victory,
];

const ENEMY_HIDDEN_STATES: GameState[] = [
    GameState.TapMineTutorial,
    GameState.BuildTowerTutorial,
    GameState.Victory,
];

function getTutorialMessage(
    state: GameState,
    goldAmount: number,
    hasShownBattleOneTutorial: boolean
): TutorialMessage {
    switch (state) {
        case GameState.TapMineTutorial:
            return {
                text: `Tap the mine ${goldAmount}/${GameplayConfig.goldTargetForTowerBuild}`,
                type: 'persistent',
            };

        case GameState.BuildTowerTutorial:
            return {
                text: 'Build the tower',
                type: 'persistent',
            };

        case GameState.BattleOne:
            return {
                text: hasShownBattleOneTutorial ? '' : 'Defend the fortress',
                type: hasShownBattleOneTutorial ? 'hidden' : 'temporary',
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
        case GameState.Victory:
        default:
            return {
                text: '',
                type: 'hidden',
            };
    }
}

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
    private lightWaveTweens: Array<Tween<Node>> = [];

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
    }

    protected onDestroy(): void {
        GameEventBus.off(GameEvent.MineTapped, this.onMineTapped);
        GameEventBus.off(GameEvent.BuildSpotTapped, this.onBuildSpotTapped);
        GameEventBus.off(GameEvent.EnemyDefeated, this.onEnemyDefeated);
        GameEventBus.off(GameEvent.EnemyReachedGoal, this.onEnemyReachedGoal);
        GameEventBus.off(GameEvent.EnemyAttackPerformed, this.onEnemyAttackPerformed);
        GameEventBus.off(GameEvent.SkillButtonTapped, this.onSkillButtonTapped);
        GameEventBus.off(GameEvent.FireballImpactFinished, this.onFireballImpactFinished);

        this.stopLightWaveTweens();
    }

    private onMineTapped = (): void => {
        if (this.currentState !== GameState.TapMineTutorial) {
            return;
        }

        this.goldAmount += GameplayConfig.goldPerMineTap;

        if (this.goldAmount >= GameplayConfig.goldTargetForTowerBuild) {
            this.enterBuildTowerTutorial();
            return;
        }

        this.refreshView();
    };

    private onBuildSpotTapped = (): void => {
        if (this.currentState !== GameState.BuildTowerTutorial) {
            return;
        }

        this.enterBattleOne();
    };

    private onEnemyDefeated = (): void => {
        if (this.currentState === GameState.BattleOne) {
            this.defeatedLightEnemiesCount += 1;

            if (this.defeatedLightEnemiesCount >= GameplayConfig.lightEnemyCountInWave) {
                this.enterBattleTwo();
                return;
            }

            this.refreshView();
            return;
        }

        if (this.isHeavyEnemyBattleState()) {
            this.enterVictory();
        }
    };

    private onEnemyReachedGoal = (): void => {
        if (this.currentState !== GameState.BattleTwo) {
            return;
        }

        this.enterSkillTutorial();
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

        this.enterFireballCast();
    };

    private onFireballImpactFinished = (): void => {
        if (this.currentState !== GameState.FireballCast) {
            return;
        }

        this.heavyEnemyController?.receiveDamage(GameplayConfig.skillDamage);
    };

    private enterBuildTowerTutorial(): void {
        this.currentState = GameState.BuildTowerTutorial;
        this.refreshView();
    }

    private enterBattleOne(): void {
        this.currentState = GameState.BattleOne;
        this.defeatedLightEnemiesCount = 0;
        this.spawnedLightEnemiesCount = 0;
        this.hasShownBattleOneTutorial = false;

        this.startLightWave();
        this.refreshView();
    }

    private enterBattleTwo(): void {
        this.currentState = GameState.BattleTwo;

        this.stopLightWaveTweens();
        this.startSecondBattle();
        this.refreshView();
    }

    private enterSkillTutorial(): void {
        this.currentState = GameState.SkillTutorial;

        this.stopLightWaveTweens();
        this.towerController?.stopBattle();

        if (this.heavyEnemyNode) {
            this.fortressAttackController?.startBattle(this.heavyEnemyNode);
        }

        this.refreshView();
        this.skillButtonController?.playShowAnimation();
    }

    private enterFireballCast(): void {
        this.currentState = GameState.FireballCast;

        this.stopLightWaveTweens();
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
    }

    private enterVictory(): void {
        this.currentState = GameState.Victory;

        this.stopLightWaveTweens();
        this.towerController?.stopBattle();
        this.fortressAttackController?.stopBattle();

        this.refreshView();
        this.victoryOverlayController?.show();
    }

    private isHeavyEnemyBattleState(): boolean {
        return this.currentState === GameState.BattleTwo
            || this.currentState === GameState.SkillTutorial
            || this.currentState === GameState.FireballCast;
    }

    private startLightWave(): void {
        this.hideAllEnemies();
        this.fortressAttackController?.stopBattle();
        this.stopLightWaveTweens();

        for (let index = 0; index < GameplayConfig.lightEnemyCountInWave; index += 1) {
            const spawnTween = tween(this.node)
                .delay(index * GameplayConfig.lightEnemySpawnInterval)
                .call(() => {
                    if (this.currentState !== GameState.BattleOne) {
                        return;
                    }

                    this.spawnNextLightEnemy();
                });

            this.lightWaveTweens.push(spawnTween);
            spawnTween.start();
        }
    }

    private stopLightWaveTweens(): void {
        for (let index = 0; index < this.lightWaveTweens.length; index += 1) {
            this.lightWaveTweens[index].stop();
        }

        this.lightWaveTweens.length = 0;
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
        for (let index = 0; index < this.lightEnemyNodes.length; index += 1) {
            this.lightEnemyNodes[index].active = false;
        }
    }

    private hideAllEnemies(): void {
        this.hideAllLightEnemies();

        if (this.heavyEnemyNode) {
            this.heavyEnemyNode.active = false;
        }
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
        const tutorialMessage = getTutorialMessage(
            this.currentState,
            this.goldAmount,
            this.hasShownBattleOneTutorial
        );

        if (this.tutorialLabelController) {
            if (tutorialMessage.type === 'persistent') {
                this.tutorialLabelController.showPersistentText(tutorialMessage.text);
            } else if (tutorialMessage.type === 'temporary') {
                this.tutorialLabelController.showTemporaryText(tutorialMessage.text);

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

        this.tutorialLabel.string = tutorialMessage.text;

        if (tutorialMessage.type === 'temporary' && this.currentState === GameState.BattleOne) {
            this.hasShownBattleOneTutorial = true;
        }
    }

    private updateMineView(): void {
        const isMineStep = this.currentState === GameState.TapMineTutorial;
        this.mineController?.setHighlightVisible(isMineStep);
    }

    private updateBuildSpotView(): void {
        const isBuildStep = this.currentState === GameState.BuildTowerTutorial;

        if (this.buildSpotNode) {
            this.buildSpotNode.active = !BUILD_SPOT_HIDDEN_STATES.includes(this.currentState);
        }

        this.buildSpotController?.setInteractionEnabled(isBuildStep);
        this.buildSpotController?.setHighlightVisible(isBuildStep);
    }

    private updateTowerView(): void {
        if (!this.towerNode) {
            return;
        }

        this.towerNode.active = TOWER_VISIBLE_STATES.includes(this.currentState);
    }

    private updateEnemyView(): void {
        if (ENEMY_HIDDEN_STATES.includes(this.currentState)) {
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
}
