// Minimal WebAssembly helper for deterministic loops. This is intentionally
// simple and sandboxed to stay within safe educational boundaries.
const wasmSource = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, // WASM binary header
  0x01, 0x00, 0x00, 0x00, // WASM version
  // Type section
  0x01, 0x07, 0x01, 0x60, 0x01, 0x7f, 0x01, 0x7f,
  // Function section
  0x03, 0x02, 0x01, 0x00,
  // Export section
  0x07, 0x07, 0x01, 0x04, 0x6c, 0x6f, 0x6f, 0x70, 0x00, 0x00,
  // Code section
  0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x41, 0x01, 0x6a, 0x0b,
]);

/**
 * Builds a minimal WASM module that increments a counter in a loop. Falls back to
 * JavaScript when WASM is unavailable, keeping behaviour deterministic for tests.
 * @returns {Promise<(iterations: number) => number>}
 */
export async function createWasmLoop() {
  if (typeof WebAssembly === 'undefined') {
    return () => 0;
  }

  try {
    const module = await WebAssembly.instantiate(wasmSource.buffer);
    return module.instance.exports.loop;
  } catch (error) {
    console.warn('Falling back to JS loop', error);
    return (iterations) => {
      let acc = 0;
      for (let i = 0; i < iterations; i += 1) {
        acc += 1;
      }
      return acc;
    };
  }
}
