/**
 * Programme loudness after ITU-R BS.1770: the signal is K-weighted (a high shelf of about
 * +4 dB above 1.7 kHz, then a 38 Hz high-pass) and its mean square is summed over channels.
 * Plain RMS under-counts a change in the highs relative to how loud it is heard.
 *
 * The buffers here are loops, so the filters run over them twice and the second pass is
 * measured: the loop is heard in its steady state, not with a start-up transient.
 * No gating is applied; these are short, continuous examples.
 */
/** K-weighted mean square, summed over the channels. Zero for silence. */
export function kWeightedPower(channels: Float32Array[], rate: number): number {
  // Self-contained on purpose: the browser tests inject this function's source into the page.
  const coefficients = (): number[][] => {
    const shelf = Math.tan((Math.PI * 1681.974450955533) / rate),
      gain = 10 ** (3.999843853973347 / 20),
      band = gain ** 0.4996667741545416,
      shelfQ = 0.7071752369554196,
      a0 = 1 + shelf / shelfQ + shelf * shelf;
    const pass = Math.tan((Math.PI * 38.13547087602444) / rate),
      passQ = 0.5003270373238773,
      c0 = 1 + pass / passQ + pass * pass;
    return [
      [
        (gain + (band * shelf) / shelfQ + shelf * shelf) / a0,
        (2 * (shelf * shelf - gain)) / a0,
        (gain - (band * shelf) / shelfQ + shelf * shelf) / a0,
        (2 * (shelf * shelf - 1)) / a0,
        (1 - shelf / shelfQ + shelf * shelf) / a0,
      ],
      [1, -2, 1, (2 * (pass * pass - 1)) / c0, (1 - pass / passQ + pass * pass) / c0],
    ];
  };
  const stages = coefficients();
  let total = 0;
  for (const data of channels) {
    const state = stages.map(() => [0, 0, 0, 0]);
    let energy = 0;
    for (let pass = 0; pass < 2; pass++) {
      energy = 0;
      for (let i = 0; i < data.length; i++) {
        let value: number = data[i];
        for (let s = 0; s < stages.length; s++) {
          const [b0, b1, b2, a1, a2] = stages[s],
            z = state[s];
          const out = b0 * value + b1 * z[0] + b2 * z[1] - a1 * z[2] - a2 * z[3];
          z[1] = z[0];
          z[0] = value;
          z[3] = z[2];
          z[2] = out;
          value = out;
        }
        energy += value * value;
      }
    }
    total += energy / Math.max(1, data.length);
  }
  return total;
}
/** Loudness in LUFS-style units (ungated), for display and tests. */
export const loudnessDb = (channels: Float32Array[], rate: number) =>
  -0.691 + 10 * Math.log10(Math.max(kWeightedPower(channels, rate), 1e-12));
/** The gain that brings `signal` to the loudness of `reference`. One for silence. */
export function loudnessMatch(reference: Float32Array[], signal: Float32Array[], rate: number) {
  const target = kWeightedPower(reference, rate),
    level = kWeightedPower(signal, rate);
  return level > 1e-18 && target > 1e-18 ? Math.sqrt(target / level) : 1;
}
