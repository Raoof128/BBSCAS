import { clampTiming } from './cpuModel.js';

/**
 * Encapsulates browser-style mitigations to keep the simulator non-exploitable. Each
 * toggle can be controlled via UI and methods return new objects to avoid mutation bugs.
 */
export class DefenceToolkit {
  constructor() {
    this.state = {
      constantTime: true,
      jitter: true,
      fence: true,
      clampTimers: true,
      detection: true,
    };
  }

  /** @param {boolean} value */
  setConstantTime(value) {
    this._assertBoolean('constantTime', value);
    this.state.constantTime = value;
  }

  /** @param {boolean} value */
  setJitter(value) {
    this._assertBoolean('jitter', value);
    this.state.jitter = value;
  }

  /** @param {boolean} value */
  setFence(value) {
    this._assertBoolean('fence', value);
    this.state.fence = value;
  }

  /** @param {boolean} value */
  setClampTimers(value) {
    this._assertBoolean('clampTimers', value);
    this.state.clampTimers = value;
  }

  /** @param {boolean} value */
  setDetection(value) {
    this._assertBoolean('detection', value);
    this.state.detection = value;
  }

  /**
   * Returns the defence state, optionally disabling mitigations for baseline runs.
   * @param {boolean} defended
   * @returns {{constantTime: boolean, jitter: boolean, fence: boolean, clampTimers: boolean, detection: boolean}}
   */
  getState(defended) {
    const enabled = { ...this.state };
    if (defended) return enabled;

    return Object.fromEntries(Object.keys(enabled).map((key) => [key, false]));
  }

  /**
   * Simulates a memory fence by returning a copy of the addresses to prevent
   * accidental reuse or mutation.
   * @param {number[]} addresses
   * @returns {number[]}
   */
  applyFence(addresses, state = this.state) {
    this._assertAddresses(addresses);
    if (!state.fence) return addresses;
    return [...addresses];
  }

  /**
   * Forces all timings to the maximum observed value, emulating constant-time behaviour.
   * @param {Record<string, number>} timings
   * @returns {Record<string, number>}
   */
  applyConstantTime(timings) {
    this._validateTimings(timings);
    const max = Math.max(...Object.values(timings));
    return Object.fromEntries(Object.entries(timings).map(([k]) => [k, clampTiming(max)]));
  }

  /**
   * Applies jitter and optional speculative fence dampening when enabled.
   * @param {Record<string, number>} timings
   * @param {boolean} mispredict
   * @returns {Record<string, number>}
   */
  applyDefences(timings, mispredict, state = this.state) {
    this._validateTimings(timings);
    const jittered = state.jitter
      ? Object.fromEntries(
          Object.entries(timings).map(([key, value]) => [key, clampTiming(value + this._jitter())])
        )
      : { ...timings };

    if (state.fence && mispredict) {
      jittered.speculate = clampTiming(jittered.speculate / 2);
    }

    return jittered;
  }

  /**
   * Coarsens timing values to the nearest 5 units to mimic timer clamping.
   * @param {Record<string, number>} timings
   * @returns {Record<string, number>}
   */
  clampTiming(timings) {
    this._validateTimings(timings);
    return Object.fromEntries(Object.entries(timings).map(([k, v]) => [k, Math.round(v / 5) * 5]));
  }

  /**
   * Lightweight anomaly heuristic to show how browsers can spot high-variance timings.
   * @param {Record<string, number>} timings
   * @returns {{avg: number, std: number, suspicious: boolean}}
   */
  detectAnomaly(timings) {
    this._validateTimings(timings);
    const values = Object.values(timings);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const suspicious = std > 12;
    return { avg, std, suspicious };
  }

  /**
   * Adds a bounded random offset to blur timing resolution.
   * @returns {number}
   */
  _jitter() {
    return Math.floor(Math.random() * 10) - 5;
  }

  _assertBoolean(name, value) {
    if (typeof value !== 'boolean') {
      throw new Error(`DefenceToolkit expected boolean for ${name}`);
    }
  }

  _assertAddresses(addresses) {
    if (!Array.isArray(addresses) || addresses.some((addr) => typeof addr !== 'number' || Number.isNaN(addr))) {
      throw new Error('DefenceToolkit.applyFence expected an array of numeric addresses');
    }
  }

  _validateTimings(timings) {
    if (!timings || typeof timings !== 'object') {
      throw new Error('Timing data must be an object');
    }

    const entries = Object.entries(timings);
    if (entries.length === 0) {
      throw new Error('Timing data must include at least one measurement');
    }

    entries.forEach(([key, value]) => {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new Error(`Timing for ${key} must be numeric`);
      }
    });
  }
}
