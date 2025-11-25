# Threat Model and Safety Boundaries

This simulator is intentionally constrained to avoid real-world exploitation. The threat model focuses on preventing any
transferable side-channel techniques while still demonstrating concepts.

## Assets
- User understanding and educational value.
- Browser stability during demos.
- Integrity of the simulated timing and cache outputs.

## Trust assumptions
- Runs locally in a modern browser with JavaScript enabled.
- No access to privileged system APIs, native extensions, or remote resources.

## In-scope risks (mitigated)
- **Timing abuse**: All timings are clamped and optionally jittered; no high-resolution timers are used.
- **Speculation leakage**: Only mock addresses are touched; speculative effects are visual only.
- **WebAssembly misuse**: The WASM helper is minimal, deterministic, and sandboxed with a JS fallback.
- **Input misuse**: UI toggles and simulator APIs validate shapes and types before use.

## Out-of-scope
- Real attack payloads, kernel/user boundary crossings, or cache state introspection on real hardware.
- Remote exploitation or cross-origin data access.

## Defensive controls
- Constant-time execution paths, jitter insertion, fences, timer clamping, and anomaly detection heuristics are enabled by default.
- CI enforces linting and tests to catch regressions in safeguards.
- Development environment (devcontainer) pins Node.js and formatting rules to keep builds reproducible.

## Reviewer checklist
- New features must keep timings bounded (20–180 units) and synthetic only.
- No network calls, storage access, or permissions should be introduced.
- WebAssembly additions must remain deterministic and include JS fallbacks.
