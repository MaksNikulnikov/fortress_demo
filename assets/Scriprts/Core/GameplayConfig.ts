export const GameplayConfig = {
    goldPerMineTap: 1,
    goldTargetForTowerBuild: 5,

    lightEnemyMaxHealth: 3,
    heavyEnemyMaxHealth: 8,
    enemyMoveSpeed: 120,
    enemyAttackInterval: 0.8,

    towerAttackRange: 260,
    towerAttackInterval: 0.6,
    towerDamage: 1,

    fortressAttackRange: 420,
    fortressAttackInterval: 0.9,
    fortressDamage: 1,

    arrowFlightDuration: 0.16,
    skillDamage: 999,

    fireballFlightDuration: 0.45,
    fireballImpactDuration: 0.35,
    fireballStartScale: 0.7,
    fireballEndScale: 1.15,
    fireballRotationSpeed: 720,
} as const;