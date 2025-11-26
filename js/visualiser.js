const stageTitles = {
  fetch: 'Fetch',
  decode: 'Decode',
  execute: 'Execute',
  retire: 'Retire',
};

/**
 * Responsible for updating the DOM with pipeline, cache, and timing information.
 * The renderers are intentionally defensive to avoid leaking errors into the UI.
 */
export class Visualiser {
  constructor({ pipelineEl, cacheEl, timingEl, logEl }) {
    this._assertElement(pipelineEl, 'pipelineEl');
    this._assertElement(cacheEl, 'cacheEl');
    this._assertElement(timingEl, 'timingEl');

    this.pipelineEl = pipelineEl;
    this.cacheEl = cacheEl;
    this.timingEl = timingEl;
    this.logEl = logEl;
  }

  /**
   * Render the pipeline view with speculative markers.
   * @param {Array<{stage: string, instructions: Array<{label: string, speculative: boolean}>}>} stages
   */
  renderPipeline(stages) {
    this.pipelineEl.innerHTML = '';
    stages.forEach((stage) => {
      const stageEl = document.createElement('div');
      stageEl.className = 'stage';
      stageEl.innerHTML = `<div class="title">${stageTitles[stage.stage]}</div>`;

      stage.instructions.forEach((instr) => {
        const token = document.createElement('div');
        token.className = `token ${instr.speculative ? 'speculative' : 'retired'}`;
        token.textContent = instr.label;
        stageEl.appendChild(token);
      });

      this.pipelineEl.appendChild(stageEl);
    });
  }

  /**
   * Render cache levels and lines that were recently touched.
   * @param {Array<{name: string, lines: Array<{address: number}>}>} levels
   */
  renderCache(levels) {
    this.cacheEl.innerHTML = '';
    levels.forEach((level) => {
      const levelEl = document.createElement('div');
      levelEl.className = 'cache-level';
      levelEl.innerHTML = `<h4>${level.name}</h4>`;

      const linesEl = document.createElement('div');
      linesEl.className = 'cache-lines';
      level.lines.forEach((line) => {
        const lineEl = document.createElement('div');
        lineEl.className = 'cache-line hit';
        lineEl.textContent = `0x${line.address.toString(16).padStart(2, '0')}`;
        linesEl.appendChild(lineEl);
      });

      levelEl.appendChild(linesEl);
      this.cacheEl.appendChild(levelEl);
    });
  }

  /**
   * Draw timing bars for prime/speculate/probe plus optional heuristic output.
   * @param {Record<string, number>} timings
   * @param {{avg: number, std: number, suspicious: boolean}|null} detection
   */
  renderTimings(timings, detection) {
    this.timingEl.innerHTML = '';
    Object.entries(timings).forEach(([name, value]) => {
      const row = document.createElement('div');
      row.className = 'timing-row';

      const label = document.createElement('div');
      label.textContent = name;

      const bar = document.createElement('div');
      bar.className = 'timing-bar';
      bar.style.width = `${Math.min(100, value)}%`;

      const numeric = document.createElement('div');
      numeric.className = 'timing-value';
      numeric.textContent = `${value.toFixed(0)} units`;

      row.append(label, bar, numeric);
      this.timingEl.appendChild(row);
    });

    if (detection) {
      const note = document.createElement('div');
      note.className = 'hint';
      note.textContent = detection.suspicious
        ? `Detection heuristic fired (stddev=${detection.std.toFixed(1)})`
        : `Within normal variance (stddev=${detection.std.toFixed(1)})`;
      this.timingEl.appendChild(note);
    }
  }

  /**
   * Prepend a log entry to the UI card.
   * @param {string} message
   */
  log(message) {
    if (!this.logEl) return;
    const entry = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    this.logEl.prepend(entry);
    while (this.logEl.childNodes.length > 12) {
      this.logEl.removeChild(this.logEl.lastChild);
    }
  }

  /**
   * Ensure DOM elements exist before attempting to render into them.
   * @param {HTMLElement|null} element
   * @param {string} name
   */
  _assertElement(element, name) {
    if (!element) {
      throw new Error(`Visualiser requires a valid DOM element for ${name}`);
    }
  }
}
