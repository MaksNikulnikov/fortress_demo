# Fortress Demo

Small `Cocos Creator 3.8.8` portfolio project built as a polished vertical slice of a simple fortress-defense loop.

The player mines gold, builds a tower, survives a light wave, stops a heavy enemy with a fireball skill, and finishes on a CTA screen. The project is intentionally compact: one scene, clear state flow, and focused visual feedback.

## Stack

- `Cocos Creator 3.8.8`
- `TypeScript`
- Scene-driven workflow with serialized references and lightweight gameplay components

## Open And Run

1. Open the project in `Cocos Creator 3.8.8`.
2. Load [assets/Scenes/Game.scene](assets/Scenes/Game.scene).
3. Run `Preview` in the editor or build for Web Mobile.

## Gameplay Flow

- Tap the mine to collect gold.
- Build the tower when the gold target is reached.
- Defend the fortress from the first enemy wave.
- Use the fireball skill against the heavy enemy.
- Show the victory overlay and CTA.

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
- CTA integration supports host callbacks through `window.openStore()`, `window.install()`, or `window.cta()`. If none are present, the project dispatches a `fortress-demo:cta` browser event.

## Portfolio Goal

This repo is meant to present a small but clean gameplay slice rather than a large framework. The emphasis is on readability, responsive UI feedback, simple scene setup, and a presentation-ready gameplay loop.

## GitHub Pages CI

The repository includes a GitHub Actions workflow for Pages deployment in [.github/workflows/pages.yml](.github/workflows/pages.yml).

This workflow is designed for a `self-hosted` Windows runner because the build depends on a local installation of `Cocos Creator 3.8.8`.

Required setup:

1. Register a Windows self-hosted runner for the repository.
2. Make sure `Cocos Creator 3.8.8` is installed on that runner machine.
3. In `Settings -> Pages`, set the source to `GitHub Actions`.
4. Optionally create a repository variable named `COCOS_CREATOR_EXE` if Creator is installed somewhere other than `C:\ProgramData\cocos\editors\Creator\3.8.8\CocosCreator.exe`.

The build step is handled by [scripts/build-pages.ps1](scripts/build-pages.ps1). It tries both official Cocos CLI argument styles, `--project` and `--path`, and publishes the generated web build as the Pages artifact.
