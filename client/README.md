# Ambient Idle Game Client

This is the client-side application for the Ambient Idle Game.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The game will be available at `http://localhost:5173`

## Development

The game is built using:

- Phaser 3 for game engine
- TypeScript for type safety
- Vite for development and building
- HTML5 Canvas for rendering

## Project Structure

- `src/main.ts` - Main game configuration and initialization
- `src/scenes/` - Game scenes
  - `StartScreen.ts` - Initial screen with name entry
  - `BattleScene.ts` - Main game battle scene
- `src/types/` - TypeScript type definitions

## TypeScript

This project uses TypeScript for better developer experience and type safety. The main benefits include:

- Type checking to catch errors during development
- Better code completion and documentation in IDEs
- More maintainable codebase with explicit interfaces and types
