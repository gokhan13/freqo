/** PCM16 WAV for exporting the short, rendered teaching preview. */
export function encodeWav(channels: Float32Array[], rate: number): ArrayBuffer {
  const count = channels.length, frames = channels[0].length, bytes = frames * count * 2;
  const buffer = new ArrayBuffer(44 + bytes), view = new DataView(buffer);
  const write = (at: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, 36 + bytes, true); write(8, 'WAVE'); write(12, 'fmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, count, true); view.setUint32(24, rate, true); view.setUint32(28, rate * count * 2, true);
  view.setUint16(32, count * 2, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, bytes, true);
  for (let i = 0; i < frames; i++) for (let channel = 0; channel < count; channel++) view.setInt16(44 + (i * count + channel) * 2, Math.round(Math.max(-1, Math.min(1, channels[channel][i])) * 32767), true);
  return buffer;
}
