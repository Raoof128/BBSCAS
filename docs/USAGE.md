# Usage Guide

## Running the simulator
1. Start a local server (`npm start` or `python -m http.server 8000`).
2. Open `http://localhost:8000` in a modern browser.
3. Choose a scenario:
   - **Baseline run**: All defences are disabled regardless of toggle state to maximise contrast for demos.
   - **Defended run**: Applies constant-time logic, jitter, fences, timer clamping, and detection heuristics based on toggle state.
4. Observe:
   - Pipeline animation: speculative vs retired instructions.
   - Cache visualization: L1/L2 hits and misses with color coding.
   - Timing chart: mock latency values for prime, speculative read, and probe.

## Controls
- **Constant-time execution**: Forces identical timing regardless of branch outcome.
- **Add jitter**: Injects small random timing to blur measurements.
- **Memory fence**: Stops speculative path from affecting cache state.
- **Clamp timers**: Coarsens measurements to reduce resolution.
- **Detection heuristic**: Highlights unusual timing variance in the UI.

## Interpreting results
- **Large gap (baseline)**: Demonstrates how speculation leaks timing into subsequent probes.
- **Reduced gap (defended)**: Mitigations shrink differences to within jitter bands.
- **Heuristic alert**: Signals when timing variance exceeds the configured threshold.

## Extending scenarios
- Modify `ATTACK_PATTERNS` in `js/attack.js` to add new training/misprediction sequences.
- Adjust cache sizes and latencies in `js/cpuModel.js` to explore different hierarchies.
- Update `DefenceToolkit` in `js/defence.js` to prototype new mitigations.
