"""Rebuild the bundled teaching excerpts from pinned CC0 acoustic recordings.

Optional maintainer tool: Python 3, NumPy and ffmpeg. The app/build uses the
committed WAVs and needs none of these tools. Originals stay outside the repo.
"""
import argparse
import hashlib
import json
import subprocess
import tempfile
import urllib.parse
import urllib.request
import wave
from pathlib import Path

import numpy as np

COMMIT = '440300901dfe9275fd84e0b7763af1f8443ae62e'
SAMPLES = {
    'piano': ('Keys/Upright Piano/Player_dyn2_rr1_020.wav', 'dc314226819e7af0768cd7fc08933f5e5b550083145e05af630fd7556f4d3913'),
    'kick': ('Percussion/BDrumNewhit_v4_rr1_Sum.wav', '7d8603e6802b51bc5acd3f73275f8e6408c7f2ccdd36d1a55b27e74034101589'),
    'snare': ('Percussion/Snare2-HitSN_v5_rr1_Sum.wav', '8deb654b739f6dfb01f192b7043a9aad92b7973995246252571240fe712d0876'),
    'claves': ('Percussion/Claves1_Hit_v2_rr1_Sum.wav', 'ae0493fa57d0d1dd57693e8639dfe5fd9675b520a1c0c0eb45cf992f2a23ca9c'),
}
RATE = 22050


def build(raw_dir: Path, destination: Path):
    destination.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)
    decoded, sources = {}, []
    for name, (sample_path, expected) in SAMPLES.items():
        url = f'https://raw.githubusercontent.com/sgossner/VSCO-2-CE/{COMMIT}/' + urllib.parse.quote(sample_path)
        raw = raw_dir / f'{name}.wav'
        if not raw.exists():
            with urllib.request.urlopen(url, timeout=30) as response:
                raw.write_bytes(response.read())
        data = raw.read_bytes()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f'Checksum mismatch: {name}')
        result = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(raw), '-ac', '1', '-ar', str(RATE), '-t', '3', '-f', 'f32le', '-'], check=True, capture_output=True)
        values = np.frombuffer(result.stdout, dtype='<f4').copy()
        start = np.flatnonzero(np.abs(values) > np.max(np.abs(values)) * 0.003)[0]
        values = values[start:]
        values *= 0.6 / np.max(np.abs(values))
        fade = min(int(RATE * 0.01), len(values))
        values[-fade:] *= np.linspace(1, 0, fade)
        decoded[name] = values
        sources.append({'name': name, 'url': url, 'sha256': expected, 'license': 'CC0-1.0'})
    lead, bed, hits = [np.zeros(RATE * 4) for _ in range(3)]

    def add(target, sample, at, gain, semitones=0):
        rate = 2 ** (semitones / 12)
        positions = np.arange(0, len(sample), rate)
        shifted = np.interp(positions, np.arange(len(sample)), sample)
        start = round(at * RATE)
        count = min(len(shifted), len(target) - start)
        target[start:start + count] += shifted[:count] * gain

    # An original eight-note arrangement, not an excerpt from a commercial song.
    for index, note in enumerate([60, 64, 67, 72, 67, 64, 62, 60]):
        add(lead, decoded['piano'], index * 0.5, [0.7, 1, 0.5, 0.9][index % 4], note - 61)
    for at in [0, 2]:
        for note in [48, 55, 59]:
            add(bed, decoded['piano'], at, 0.35, note - 61)
    for index in range(8):
        add(hits, decoded['kick' if index % 2 == 0 else 'snare'], index * 0.5, [1, 0.65, 0.8, 0.45][index % 4])
        add(hits, decoded['claves'], index * 0.5 + 0.25, 0.2)
    outputs = {'recorded-lead': lead, 'recorded-bed': bed, 'recorded-hits': hits,
               'acoustic': lead * 0.8 + bed * 0.3 + hits * 0.15,
               'recorded-drums': hits * 0.9 + lead * 0.08 + bed * 0.12}
    derived = []
    for name, values in outputs.items():
        values *= min(1, 0.65 / np.max(np.abs(values)))
        fade = round(RATE * 0.006)
        values[:fade] *= np.linspace(0, 1, fade)
        values[-fade:] *= np.linspace(1, 0, fade)
        output = destination / f'{name}.wav'
        with wave.open(str(output), 'wb') as writer:
            writer.setnchannels(1); writer.setsampwidth(2); writer.setframerate(RATE)
            writer.writeframes(np.round(values * 32767).astype('<i2').tobytes())
        derived.append({'file': output.name, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'duration': 4, 'sampleRate': RATE})
    (destination / 'recordings.json').write_text(json.dumps({'collection': 'VSCO 2: Community Edition', 'commit': COMMIT,
        'credit': 'Versilian Studios / Sam Gossner; Ivy Audio / Simon Dalzell; sample cutting Elan Hickler / Soundemote',
        'license': 'CC0-1.0', 'source': 'https://github.com/sgossner/VSCO-2-CE',
        'adaptation': 'Mono downmix, onset trim, 22.05 kHz resampling, pitch transposition, original arrangement, peak limiting and fades.',
        'sources': sources, 'derived': derived}, indent=2) + '\n')
    print(f'Prepared {len(derived)} four-second acoustic excerpts in {destination}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--raw-dir', type=Path, default=Path(tempfile.gettempdir()) / 'freq-vsco-originals')
    args = parser.parse_args()
    build(args.raw_dir, Path(__file__).resolve().parents[1] / 'public/audio')
