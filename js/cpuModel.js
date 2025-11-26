/**
 * Ordered list of pipeline stages used across the simulator. The stages are intentionally
 * simplified to keep the model safe and digestible.
 */
const STAGES = ['fetch', 'decode', 'execute', 'retire'];

/**
 * Tiny saturating-counter branch predictor. Tracks a short history to show how
 * repeated outcomes influence prediction confidence.
 */
export class BranchPredictor {
  constructor() {
    this.history = [];
    this.threshold = 2; // simple saturating counter threshold
    this.counter = 2;
  }

  /**
   * Produces a prediction based on the current saturating counter and updates the
   * internal history using the provided outcome. Inputs are validated to maintain
   * deterministic behaviour for the UI and tests.
   * @param {boolean} outcome - The actual branch outcome (true for taken, false for not-taken)
   * @returns {boolean} predicted branch direction
   */
  predict(outcome) {
    if (typeof outcome !== 'boolean') {
      console.warn('BranchPredictor.predict called with non-boolean outcome, coercing to boolean');
    }
    const normalizedOutcome = Boolean(outcome);
    const prediction = this.counter >= this.threshold;
    this._update(normalizedOutcome);
    return prediction;
  }

  /**
   * Internal saturating counter update.
   * @param {boolean} outcome
   */
  _update(outcome) {
    if (outcome) {
      this.counter = Math.min(3, this.counter + 1);
    } else {
      this.counter = Math.max(0, this.counter - 1);
    }
    this.history.push(outcome);
    if (this.history.length > 16) {
      this.history.shift();
    }
  }

  /**
   * Expresses predictor certainty as a normalized value between 0 and 1.
   * @returns {number}
   */
  getConfidence() {
    return this.counter / 3;
  }
}

/**
 * Represents an individual cache level with a small FIFO eviction policy.
 */
class CacheLevel {
  constructor(name, { size, latency }) {
    this.name = name;
    this.size = size;
    this.latency = latency;
    this.lines = new Map();
  }

  /**
   * Returns hit metadata for a given address and installs it on misses.
   * @param {number} address
   * @returns {{level: string, hit: boolean, latency: number}}
   */
  access(address) {
    if (typeof address !== 'number' || Number.isNaN(address)) {
      throw new Error(`CacheLevel(${this.name}) received invalid address: ${String(address)}`);
    }
    const hit = this.lines.has(address);
    if (!hit) {
      this._insert(address);
    }
    return { level: this.name, hit, latency: this.latency };
  }

  _insert(address) {
    if (this.lines.size >= this.size) {
      const [oldest] = this.lines.keys();
      this.lines.delete(oldest);
    }
    this.lines.set(address, Date.now());
  }

  /**
   * Export current cache lines for the visualiser.
   * @returns {Array<{address: number}>}
   */
  snapshot() {
    return Array.from(this.lines.keys()).map((address) => ({ address }));
  }
}

/**
 * Represents a two-level cache hierarchy with deterministic latency values.
 * The implementation intentionally avoids real memory access and uses small maps
 * to keep the model predictable and safe.
 */
export class CacheModel {
  constructor() {
    this.levels = [
      new CacheLevel('L1', { size: 8, latency: 8 }),
      new CacheLevel('L2', { size: 16, latency: 16 }),
    ];
    this.missLatency = 42;
  }

  /**
   * Simulates cache priming by touching the provided addresses sequentially.
   * @param {number[]} addresses - mock addresses to populate in the cache
   * @returns {Array<{level: string, hit: boolean, latency: number}>}
   */
  prime(addresses) {
    return addresses.map((addr) => this.access(addr));
  }

  /**
   * Attempts to serve an address from cache levels, returning the level hit and latency.
   * @param {number} address - mock address
   * @returns {{level: string, hit: boolean, latency: number}}
   */
  access(address) {
    for (const level of this.levels) {
      const result = level.access(address);
      if (result.hit) {
        return { ...result, hit: true };
      }
    }
    return { level: 'memory', hit: false, latency: this.missLatency };
  }

  /**
   * Re-reads the addresses to measure perceived latency, analogous to Probe in Prime+Probe.
   * @param {number[]} addresses - addresses to check
   * @returns {Array<{level: string, hit: boolean, latency: number}>}
   */
  probe(addresses) {
    return addresses.map((addr) => this.access(addr));
  }

  /**
   * Snapshot the current cache lines for visualization.
   * @returns {Array<{name: string, lines: Array<{address: number}>}>}
   */
  snapshot() {
    return this.levels.map((level) => ({
      name: level.name,
      lines: level.snapshot(),
    }));
  }
}

/**
 * Minimal pipeline visualizer that maps at most one instruction token to each stage.
 */
export class Pipeline {
  constructor() {
    this.stages = STAGES;
  }

  /**
   * Maps a short list of instructions to the simplified pipeline stages. The simulator keeps
   * a single instruction per stage for clarity.
   * @param {Array<{label: string, speculative: boolean}>} instructions - instruction tokens
   * @param {boolean} mispredict - whether the speculative path should be highlighted
   * @returns {Array<{stage: string, instructions: Array<{label: string, speculative: boolean}>}>}
   */
  simulate(instructions, mispredict = false) {
    if (!Array.isArray(instructions)) {
      throw new Error('Pipeline.simulate expects an array of instructions');
    }

    instructions.forEach((instruction, idx) => {
      if (typeof instruction?.label !== 'string' || typeof instruction?.speculative !== 'boolean') {
        throw new Error(`Pipeline instruction at index ${idx} must include a label and speculative flag`);
      }
    });

    return this.stages.map((stage, index) => ({
      stage,
      instructions: instructions
        .filter((_, idx) => idx === index)
        .map((instr) => ({ ...instr, speculative: mispredict && instr.speculative })),
    }));
  }
}

/**
 * Restricts timing values to a safe, predictable range used for the UI bars.
 * @param {number} value - raw timing value
 * @returns {number} clamped timing
 */
export function clampTiming(value) {
  return Math.max(20, Math.min(value, 180));
}

/**
 * Creates a four-instruction sequence representing a branch and its speculative path.
 * @param {boolean} branchTaken - whether the branch resolves as taken
 * @returns {Array<{label: string, speculative: boolean}>}
 */
export function buildSpeculativeSequence(branchTaken) {
  return [
    { label: 'branch', speculative: false },
    { label: branchTaken ? 'target load' : 'fallthrough', speculative: !branchTaken },
    { label: 'dependent read', speculative: !branchTaken },
    { label: 'retire', speculative: false },
  ];
}
