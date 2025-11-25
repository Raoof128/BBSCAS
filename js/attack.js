import { BranchPredictor, CacheModel, Pipeline, buildSpeculativeSequence, clampTiming } from './cpuModel.js';

export const ATTACK_PATTERNS = {
  branchTrain: {
    name: 'Branch training & mistrain',
    description: 'Trains the predictor to take a branch, then flips outcome to model speculative load.',
    training: [true, true, true, true],
    trigger: false,
  },
};

const MOCK_MEMORY = Array.from({ length: 32 }, (_, i) => i * 4);

/**
 * Generates an artificial timing value for visuals. Jitter is optional and bounded
 * to keep the simulation deterministic enough for testing.
 * @param {number} base - base timing before jitter
 * @param {number} jitter - maximum jitter range
 * @returns {number} clamped timing
 */
function artificialDelay(base, jitter = 0) {
  const variance = jitter ? Math.floor(Math.random() * jitter) - jitter / 2 : 0;
  return clampTiming(base + variance);
}

/**
 * Runs speculative execution scenarios in a safe, mock environment. It delegates
 * visualization to the provided Visualiser and applies mitigations from DefenceToolkit.
 */
export class AttackSimulator {
  constructor({ visualiser, defence, logger = console }) {
    if (!visualiser || !defence) {
      throw new Error('AttackSimulator requires a visualiser and defence toolkit');
    }

    this.visualiser = visualiser;
    this.defence = defence;
    this.logger = logger;
    this.cache = new CacheModel();
    this.predictor = new BranchPredictor();
    this.pipeline = new Pipeline();
  }

  /**
   * Execute a scenario and update UI outputs.
   * @param {{name: string, training: boolean[], trigger: boolean}} pattern - attack recipe
   * @param {boolean} defended - whether to apply mitigation state
   * @returns {Promise<object>} summary of simulation steps
   */
  async run(pattern, defended = false) {
    this._validatePattern(pattern);
    if (typeof defended !== 'boolean') {
      throw new Error('AttackSimulator.run requires defended flag to be boolean');
    }

    const defenceState = this.defence.getState(defended);
    const addresses = this._selectAddresses(pattern.training.length + 2, defenceState);
    const primeResults = this.cache.prime(addresses);
    const trainingResults = pattern.training.map((outcome) => this.predictor.predict(outcome));
    const mispredict = this.predictor.predict(pattern.trigger) !== pattern.trigger;

    const speculativeSeq = buildSpeculativeSequence(pattern.trigger);
    const pipelineView = this.pipeline.simulate(speculativeSeq, mispredict && !defenceState.fence);

    const speculativeAccess = this.cache.access(addresses[0]);
    const probeResults = this.cache.probe(addresses.slice(0, 4));

    const baseTiming = {
      prime: artificialDelay(60, defenceState.jitter ? 8 : 0),
      speculate: artificialDelay(speculativeAccess.latency * 2, defenceState.jitter ? 8 : 0),
      probe: artificialDelay(probeResults.reduce((sum, p) => sum + p.latency, 0) / probeResults.length, defenceState.jitter ? 8 : 0),
    };

    const timings = defenceState.constantTime
      ? this.defence.applyConstantTime(baseTiming)
      : this.defence.applyDefences(baseTiming, mispredict, defenceState);

    const measurements = defenceState.clampTimers ? this.defence.clampTiming(timings) : timings;
    const detection = defenceState.detection ? this.defence.detectAnomaly(measurements) : null;

    this.visualiser.renderPipeline(pipelineView);
    this.visualiser.renderCache(this.cache.snapshot());
    this.visualiser.renderTimings(measurements, detection);
    this.logger.info?.(`Scenario '${pattern.name}' executed with mispredict=${mispredict}`);

    return {
      summary: mispredict ? 'Speculative path observed' : 'No speculation observed',
      primeResults,
      trainingResults,
      mispredict,
      speculativeAccess,
      probeResults,
      measurements,
      detection,
    };
  }

  /**
   * Picks mock addresses for priming and probing.
   * @param {number} count
   * @returns {number[]}
   */
  _selectAddresses(count, defenceState) {
    const slice = MOCK_MEMORY.slice(0, count);
    return this.defence.applyFence(slice, defenceState);
  }

  /**
   * Validate the scenario metadata before execution to keep simulations predictable.
   * @param {{name: string, training: boolean[], trigger: boolean}} pattern
   */
  _validatePattern(pattern) {
    if (!pattern || typeof pattern.name !== 'string') {
      throw new Error('Pattern must include a name');
    }
    if (!Array.isArray(pattern.training) || pattern.training.some((v) => typeof v !== 'boolean')) {
      throw new Error('Pattern.training must be an array of booleans');
    }
    if (typeof pattern.trigger !== 'boolean') {
      throw new Error('Pattern.trigger must be a boolean');
    }
  }
}
