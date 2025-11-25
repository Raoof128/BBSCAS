# API Reference

This simulator exposes small, self-contained modules. All interfaces are intentionally
minimal to keep the project educational and easy to audit.

## `js/cpuModel.js`
- **`BranchPredictor`**: Saturating counter predictor with `predict(outcome)` and `getConfidence()`.
- **`CacheModel`**: Two-level cache with `prime(addresses)`, `access(address)`, `probe(addresses)`, and `snapshot()`.
- **`Pipeline`**: Maps instruction tokens to pipeline stages via `simulate(instructions, mispredict)`.
- **`clampTiming(value)`**: Clamps timing values between 20 and 180 for safe display.
- **`buildSpeculativeSequence(branchTaken)`**: Creates a four-step speculative instruction sequence.

## `js/attack.js`
- **`ATTACK_PATTERNS`**: Predefined scenario metadata for training/mispredict flows.
- **`AttackSimulator`**
  - `constructor({ visualiser, defence, logger })`
  - `run(pattern, defended)` executes a scenario and returns a summary object (baseline requires `defended=false`)
  - `_validatePattern(pattern)` ensures inputs stay well-formed

## `js/defence.js`
- **`DefenceToolkit`**: Holds mitigation toggles.
  - `setConstantTime`, `setJitter`, `setFence`, `setClampTimers`, `setDetection`
  - `getState(defended)` returns either all enabled toggles (defended) or an all-disabled baseline state
  - `applyFence(addresses, state)`, `applyConstantTime(timings)`, `applyDefences(timings, mispredict, state)`
  - `clampTiming(timings)` coarsens timer granularity
  - `detectAnomaly(timings)` returns `{ avg, std, suspicious }`

## `js/visualiser.js`
- **`Visualiser`**: Renders simulation output to DOM nodes provided at construction.
  - `renderPipeline(stages)`, `renderCache(levels)`, `renderTimings(timings, detection)`, `log(message)`

## `wasm/mockModule.js`
- **`createWasmLoop()`**: Returns a minimal WASM loop (or JS fallback) that increments a counter for deterministic, safe timing baselines.
