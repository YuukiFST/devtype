# Architecture

devtype is gittype's game running behind a GPU-rendered desktop window.
The game logic is gittype's own Rust code; only the drawing changed.

```
app/ (TypeScript, React on @gpuix/react)
  main.tsx ──── window, key events, CLI outcome
  engine-store ─ frame loop: advance() + snapshot() every 16 ms
  screens/ ──── one React screen per gittype screen
        │  Node-API
crates/devtype-native (napi-rs)
  GameEngine ── builds gittype's DI container, runs its ScreenManager
                headless, forwards keys, serializes the current screen
        │  Rust path dependency
crates/gittype (vendored gittype, MIT)
  domain/ infrastructure/  untouched game logic, scoring, SQLite, git
  presentation/tui         screens keep their key handling and state;
                           each adds Screen::view_model() for the GUI
```

## Why the screen manager runs headless

gittype keeps game state and key handling inside its screens (`presentation/tui/screens`), and the transitions with their side effects inside `ScreenManagerImpl` and `ScreenTransitionManager`.
Rewriting that in TypeScript would duplicate every key binding and every session rule, and the two copies would drift.
Instead `ScreenManagerFactory::create_headless` builds the same manager over a ratatui `TestBackend`, and the host drives it:

- `GameEngine.pressKey` turns a GPUI key event into a crossterm `KeyEvent` and calls `ScreenManagerImpl::dispatch_key`, exactly what the terminal loop does after `crossterm::event::read`.
- `GameEngine.advance` runs one loop iteration (`ScreenManagerImpl::advance`): timed screen updates, the Loading → Title and Animation → SessionSummary auto-transitions, then the pending transition.
- `GameEngine.snapshot` returns `{ screen, stack, exitRequested, palette, view }` as JSON text, where `view` is `Screen::view_model()` of the current screen and `palette` is the active theme's color roles.

The React side never decides what a key does.
Clickable controls send the key the screen expects (`store.press('r')`, `store.pressRepeated('down', n)` to move a list selection), so mouse and keyboard reach the same code.

## Local patches to gittype

Every change to `crates/gittype` is a separate commit on top of the vendored copy (`git log -- crates/gittype`):

- headless driving API and `Screen::view_model` hooks;
- data directory `~/.devtype`, overridable with `DEVTYPE_HOME`;
- fixes for upstream bugs the GUI exposed (loading-completed race, repository line on Title).

## Tests

`app/test/harness.tsx` seeds a fixture git repository and an isolated `DEVTYPE_HOME`, renders the app in gpuix's test renderer and drives it with key presses.
`bun test` runs the E2E files; each compares against a golden file in `app/test/golden/` (`UPDATE_GOLDEN=1` regenerates it).
