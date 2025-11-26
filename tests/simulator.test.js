import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AttackSimulator, ATTACK_PATTERNS } from '../js/attack.js';
import { BranchPredictor, CacheModel, Pipeline, clampTiming } from '../js/cpuModel.js';
import { DefenceToolkit } from '../js/defence.js';

describe('BranchPredictor', () => {
  it('increases confidence on taken branches', () => {
    const bp = new BranchPredictor();
    const predictions = [bp.predict(true), bp.predict(true), bp.predict(true)];
    assert.ok(predictions.every((p) => p));
    assert.ok(bp.getConfidence() >= 0.66);
  });
});

describe('Pipeline', () => {
  it('throws when instructions are not an array', () => {
    const pipeline = new Pipeline();
    assert.throws(() => pipeline.simulate('bad input'), /expects an array/);
  });

  it('rejects instructions missing shape', () => {
    const pipeline = new Pipeline();
    assert.throws(() => pipeline.simulate([{}]), /must include a label/);
  });
});

describe('CacheModel', () => {
  it('records hits after first access', () => {
    const cache = new CacheModel();
    const miss = cache.access(1);
    const hit = cache.access(1);
    assert.equal(miss.hit, false);
    assert.equal(hit.hit, true);
  });

  it('rejects invalid addresses', () => {
    const cache = new CacheModel();
    assert.throws(() => cache.access('invalid'), /invalid address/);
  });
});

describe('DefenceToolkit', () => {
  it('disables all protections in baseline mode', () => {
    const defence = new DefenceToolkit();
    defence.setDetection(true);
    const baselineState = defence.getState(false);

    assert.deepStrictEqual(baselineState, {
      constantTime: false,
      jitter: false,
      fence: false,
      clampTimers: false,
      detection: false,
    });
  });

  it('validates addresses for fences', () => {
    const defence = new DefenceToolkit();
    assert.throws(() => defence.applyFence(['bad'], defence.getState(true)), /numeric addresses/);
  });

  it('respects state when applying defences', () => {
    const defence = new DefenceToolkit();
    const timings = { prime: 50, speculate: 70, probe: 55 };
    const noJitterState = { ...defence.state, jitter: false, fence: false };
    const adjusted = defence.applyDefences(timings, true, noJitterState);
    assert.deepStrictEqual(adjusted, timings);
  });

  it('applies constant-time timing', () => {
    const defence = new DefenceToolkit();
    const timings = defence.applyConstantTime({ a: 10, b: 40, c: 30 });
    const values = Object.values(timings);
    assert.ok(values.every((v) => v === values[0]));
  });

  it('clamps timing to safe bounds', () => {
    assert.equal(clampTiming(10), 20);
    assert.equal(clampTiming(400), 180);
  });

  it('rejects non-boolean toggle input', () => {
    const defence = new DefenceToolkit();
    assert.throws(() => defence.setFence('nope'), /boolean/);
  });
});

describe('AttackSimulator', () => {
  const visualiserStub = {
    renderPipeline() {},
    renderCache() {},
    renderTimings() {},
    log() {},
  };

  it('rejects malformed patterns', async () => {
    const simulator = new AttackSimulator({ visualiser: visualiserStub, defence: new DefenceToolkit() });
    await assert.rejects(() => simulator.run({ name: 'oops', training: 'bad', trigger: true }));
  });

  it('disables detection for baseline runs', async () => {
    const simulator = new AttackSimulator({ visualiser: visualiserStub, defence: new DefenceToolkit() });
    const originalRandom = Math.random;
    Math.random = () => 0.4;

    const result = await simulator.run(ATTACK_PATTERNS.branchTrain, false);
    assert.equal(result.detection, null);

    Math.random = originalRandom;
  });
});
