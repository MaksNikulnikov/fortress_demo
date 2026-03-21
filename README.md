# Fortress Demo

`Fortress Demo` is a small `Cocos Creator 3.8.8` portfolio project built as a polished vertical slice of a simple fortress-defense loop.

The player mines gold, builds a tower, survives a light wave, stops a heavy enemy, and ends on a CTA screen that restarts the playable. The scope is intentionally compact: one scene, one readable gameplay loop, and enough feedback to make the interactions feel finished instead of prototype-only.

## Project Snapshot

- Engine: `Cocos Creator 3.8.8`
- Language: `TypeScript`
- Format: single-scene web playable
- Focus: clean gameplay flow, readable architecture, responsive feedback, lightweight build

## Portfolio Focus

This project was built as a small but presentable gameplay slice rather than a system-heavy game framework.

The main goal was to show that even a compact playable can still be treated like a production-facing piece:

- clear player onboarding
- consistent state-driven flow
- tight interaction feedback
- readable gameplay code
- deliberate build-size constraints

## Stack

- `Cocos Creator 3.8.8`
- `TypeScript`
- Scene-driven workflow with serialized references and lightweight gameplay components

## Open And Run

1. Open the project in `Cocos Creator 3.8.8`.
2. Load [assets/Scenes/Game.scene](assets/Scenes/Game.scene).
3. Run `Preview` in the editor or build through the `Build` panel for web.

## Gameplay Flow

- Tap the mine to collect gold.
- Build the tower when the gold target is reached.
- Defend the fortress from the first enemy wave.
- Reach the heavy enemy phase and optionally use the fireball skill.
- Finish on the victory overlay and restart through the CTA button.

## What This Demonstrates

- A compact tutorial funnel that moves from input teaching to combat escalation.
- A state-driven gameplay controller that keeps the sequence predictable and easy to tune.
- Separation between presentation components and gameplay rules.
- Small but important polish details such as highlights, punch animations, counter feedback, projectile timing, and clean end-state handling.

## Controls

- `Tap / Click`: interact with gameplay objects and UI buttons.

## Project Structure

- [assets/Scripts/Core](assets/Scripts/Core): shared config, game state, event bus.
- [assets/Scripts/Gameplay](assets/Scripts/Gameplay): gameplay and UI controllers.
- [assets/Scenes](assets/Scenes): playable scene.
- [assets/Prefabs/Common](assets/Prefabs/Common): reusable gameplay prefabs.
- [assets/Art](assets/Art): sprites and UI textures.
- [assets/Animations](assets/Animations): character animation clips.

## Engineering Notes

- Gameplay progression is state-driven and coordinated from `GameController`.
- Feedback animations are kept inside dedicated components such as highlights, counters, labels, projectiles, and overlay controllers.
- Runtime references are wired through Cocos Creator, while gameplay rules stay in TypeScript for readability.
- Combat stats are kept in `GameplayConfig`, while scene components sync their runtime values from config to avoid hidden serialized overrides.

## Build Metric

- One of the explicit production constraints for this playable was a web build smaller than `5 MB`.
- The current `web-desktop` build is `4.81 MB` (`4,805,034` bytes), so that target is met.
- The most obvious next step for size reduction would be switching character animation from frame-by-frame sprite sheets to `Spine`.
- For this project, only frame-by-frame animation assets were available, so optimization focused on texture compression, asset cleanup, and keeping the playable intentionally small in scope.

## Constraint Note

The animation pipeline is the clearest technical compromise in the project.

From a portfolio perspective, `Spine` would have been the cleaner runtime choice for both asset size and animation scalability. That option was not available here because the source material already existed as frame-by-frame sequences, so the project was optimized around that limitation instead of pretending it did not exist.

## Project Intent

This repository is meant to present a focused, readable, presentation-ready gameplay slice. The emphasis is not on content volume, but on clarity, polish, and disciplined execution inside a small scope.
