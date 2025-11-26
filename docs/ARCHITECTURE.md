# Architecture Overview

## Goals
Provide an educational, non-exploitable demonstration of speculative execution and cache-based side channels with clear visuals and toggleable mitigations.

## High-level diagram
```
UI (index.html + styles.css)
  |-- Visualiser (js/visualiser.js)
  |-- Controls (defence toggles + buttons)
       |-- Defence toolkit (js/defence.js)
Simulation engine (js/attack.js)
  |-- CPU model (js/cpuModel.js)
  |-- Optional WASM helper (wasm/mockModule.js)
Testing (tests/simulator.test.js)
```

## Modules
- **cpuModel.js**: Branch predictor, cache hierarchy, pipeline stepper. All timings are deterministic and bounded. Exposes helpers for the attack simulator and tests.
- **attack.js**: Builds speculative scenarios, triggers cache priming/probing with fake latencies, and aggregates timing stats. Accepts defence settings to adjust behavior.
- **defence.js**: Encapsulates mitigation strategies—constant-time execution, jitter, fences, timer clamping, and detection heuristics.
- **visualiser.js**: Renders pipeline stages, cache lines, and timing bars. Runs entirely in the DOM with accessible ARIA labels.
- **wasm/mockModule.js**: Creates a tiny WebAssembly module at runtime for deterministic numeric loops. Includes JS fallback.

Baseline runs intentionally bypass every mitigation regardless of toggle state to provide a clear contrast with defended runs. Defence helpers accept an explicit state argument so simulations remain predictable and testable even as the UI toggles change.

## Data flow
1. User clicks **"Run baseline"** or **"Run defended"**.
2. `attack.js` primes the cache model, generates speculative and non-speculative paths, and asks `defence.js` to adjust timings.
3. Results (latencies, predictor decisions, cache hits/misses) are sent to `visualiser.js` to update the UI.
4. Visual elements (pipeline, cache, charts) animate with CSS to highlight speculative vs retired instructions.

## Safety boundaries
- Mock data only: arrays of integers and small strings, never real addresses.
- Timing: base values between 20–120ns-equivalent numbers; jitter limited to +/- 10 units.
- WebAssembly: Minimal module with a fixed-loop counter; disabled automatically if unavailable.
- No network calls, storage, or cross-origin interactions.

## Extensibility
- Add new defences by extending `DefenceToolkit` and wiring a toggle in `index.html`.
- Add new visual elements by adding sections in `index.html` and rendering functions in `visualiser.js`.
- Additional tests can import the pure functions exported from `cpuModel.js` and `defence.js`.
