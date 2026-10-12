import { text, type Text } from './i18n';
import type { EqSource, Lesson } from './content';
import type { Option, Question } from './model';
import { audibleBands } from './source-spectrum';

export const OCTAVE_BANDS = [63, 125, 250, 500, 1000, 2000, 4000, 8000];
// The bundled recordings stop near 11 kHz, so narrow bands above 8 kHz would be unfair.
export const THIRD_OCTAVE_BANDS = [
  100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000,
  6300, 8000,
];
export const EQ_REGIONS = {
  low: { centre: 100, bands: [63, 80, 100, 125, 160] },
  mid: { centre: 1000, bands: [500, 630, 800, 1000, 1250, 1600, 2000] },
  high: { centre: 8000, bands: [5000, 6300, 8000, 10000] },
} as const;
export type EqRegion = keyof typeof EQ_REGIONS;
const regionIds = Object.keys(EQ_REGIONS) as EqRegion[];
const LANDMARKS = [100, 300, 1000, 3000, 7000];

export type EqShape = 'peaking' | 'lowshelf' | 'highshelf' | 'highpass' | 'lowpass';
/** One EQ move: everything the audio engine and the response curve need. */
export type EqMove = { frequency: number; gain: number; q: number; shape: EqShape };
const SHAPES = {
  highpass: { corners: [120, 200, 320], gain: 0, low: true },
  lowshelf: { corners: [120, 200, 320], gain: 9, low: true },
  lowpass: { corners: [2500, 4000, 6000], gain: 0, low: false },
  highshelf: { corners: [2500, 4000, 6000], gain: 9, low: false },
} as const;
type ShapeId = keyof typeof SHAPES;
const shapeIds = Object.keys(SHAPES) as ShapeId[];
// Butterworth for the cut filters; Web Audio shelves ignore Q.
const SHAPE_Q = Math.SQRT1_2;
const WIDTHS = { wide: 0.5, medium: 1.4, narrow: 4 } as const;
type WidthId = keyof typeof WIDTHS;
const widthIds = Object.keys(WIDTHS) as WidthId[];

/**
 * region: name the broad area · shape: tell shelves from cut filters ·
 * bands: name the centre, direction is given · direction: centre and boost/cut together ·
 * width: hear the bandwidth · neighbours: tell adjacent third-octave bands apart ·
 * match: rebuild the move, checking your own setting by ear.
 */
export type EqStageKind =
  'region' | 'shape' | 'bands' | 'direction' | 'width' | 'neighbours' | 'match';
type EqStage = { id: string; kind: EqStageKind; bands: number[]; gains: number[]; q: number };
// Lesson ids are stable identifiers; the order of this list is the order of the ladder.
const stages: EqStage[] = [
  { id: 'eq-1', kind: 'region', bands: [], gains: [9], q: 0.7 },
  { id: 'eq-shape', kind: 'shape', bands: [], gains: [9], q: SHAPE_Q },
  { id: 'eq-2', kind: 'bands', bands: LANDMARKS, gains: [9], q: 1 },
  { id: 'eq-3', kind: 'bands', bands: OCTAVE_BANDS, gains: [9], q: 1.4 },
  { id: 'eq-4', kind: 'bands', bands: OCTAVE_BANDS, gains: [-12], q: 1.4 },
  { id: 'eq-5', kind: 'direction', bands: OCTAVE_BANDS, gains: [9, -9], q: 1.4 },
  { id: 'eq-6', kind: 'direction', bands: OCTAVE_BANDS, gains: [6, -6], q: 1.4 },
  { id: 'eq-width', kind: 'width', bands: OCTAVE_BANDS, gains: [9], q: 1.4 },
  { id: 'eq-7', kind: 'direction', bands: OCTAVE_BANDS, gains: [9, -9], q: 3 },
  { id: 'eq-8', kind: 'neighbours', bands: THIRD_OCTAVE_BANDS, gains: [12], q: 4.3 },
  { id: 'eq-match', kind: 'match', bands: OCTAVE_BANDS, gains: [12, 8, 4, -4, -8, -12], q: 1.4 },
];
export const EQ_STAGE_IDS = stages.map(stage => stage.id);
export const EQ_LEVELS = stages.length;
const stageOf = (lesson: Pick<Lesson, 'id'>) => stages.find(s => s.id === lesson.id) ?? stages[0];

export const formatHz = (hz: number) => (hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`);
const signed = (db: number) => `${db > 0 ? '+' : '−'}${Math.abs(db)} dB`;
const directionId = (hz: number, gain: number) => `${gain > 0 ? 'boost' : 'cut'}:${hz}`;
const matchId = (hz: number, gain: number) => `match:${hz}:${gain}`;

const regionLabels: Record<EqRegion, Text> = {
  low: text('Bas', 'Lows'),
  mid: text('Orta', 'Mids'),
  high: text('Tiz', 'Highs'),
};
const regionDetails: Record<EqRegion, Text> = {
  low: text('Ağırlık ve derinlik', 'Weight & depth'),
  mid: text('Gövde ve belirginlik', 'Body & presence'),
  high: text('Parlaklık ve hava', 'Brightness & air'),
};
const shapeLabels: Record<ShapeId, Text> = {
  highpass: text('Alçak kesen filtre', 'Low-cut filter'),
  lowshelf: text('Bas rafı yükseltme', 'Low shelf boost'),
  lowpass: text('Yüksek kesen filtre', 'High-cut filter'),
  highshelf: text('Tiz rafı yükseltme', 'High shelf boost'),
};
const shapeDetails: Record<ShapeId, Text> = {
  highpass: text('Köşenin altı giderek yok olur', 'Everything below the corner fades away'),
  lowshelf: text('Köşenin altı eşit miktarda yükselir', 'Everything below the corner rises evenly'),
  lowpass: text('Köşenin üstü giderek yok olur', 'Everything above the corner fades away'),
  highshelf: text(
    'Köşenin üstü eşit miktarda yükselir',
    'Everything above the corner rises evenly',
  ),
};
const widthLabels: Record<WidthId, Text> = {
  wide: text('Geniş', 'Wide'),
  medium: text('Orta', 'Medium'),
  narrow: text('Dar', 'Narrow'),
};
const widthDetails: Record<WidthId, Text> = {
  wide: text('Yaklaşık iki buçuk oktav · Q 0.5', 'About two and a half octaves · Q 0.5'),
  medium: text('Yaklaşık bir oktav · Q 1.4', 'About one octave · Q 1.4'),
  narrow: text('Yaklaşık üçte bir oktav · Q 4', 'About a third of an octave · Q 4'),
};
const bandOption = (hz: number): Option => ({
  id: String(hz),
  label: text(formatHz(hz), formatHz(hz)),
});
const directionOption = (hz: number, gain: number): Option => ({
  id: directionId(hz, gain),
  label: text(
    `${formatHz(hz)} ${gain > 0 ? 'yükseltme' : 'kesme'}`,
    `${formatHz(hz)} ${gain > 0 ? 'boost' : 'cut'}`,
  ),
});
function stageOptions(stage: EqStage, bands = stage.bands): Option[] {
  if (stage.kind === 'region')
    return regionIds.map(id => ({ id, label: regionLabels[id], detail: regionDetails[id] }));
  if (stage.kind === 'shape')
    return shapeIds.map(id => ({ id, label: shapeLabels[id], detail: shapeDetails[id] }));
  if (stage.kind === 'width')
    return widthIds.map(id => ({ id, label: widthLabels[id], detail: widthDetails[id] }));
  if (stage.kind === 'direction')
    return [...stage.gains]
      .sort((a, b) => b - a)
      .flatMap(gain => bands.map(hz => directionOption(hz, gain)));
  if (stage.kind === 'match')
    return stage.gains.flatMap(gain =>
      bands.map(hz => ({
        id: matchId(hz, gain),
        label: text(`${formatHz(hz)} ${signed(gain)}`, `${formatHz(hz)} ${signed(gain)}`),
      })),
    );
  return bands.map(bandOption);
}
function prompt(stage: EqStage): Text {
  if (stage.kind === 'region')
    return text('B’de hangi bölge yükseltildi?', 'Which region is boosted in B?');
  if (stage.kind === 'shape')
    return text('B’ye hangi EQ biçimi uygulandı?', 'Which EQ shape was applied to B?');
  if (stage.kind === 'width')
    return text('B’deki yükseltme ne kadar geniş?', 'How wide is the boost in B?');
  if (stage.kind === 'direction')
    return text(
      'B’de hangi frekans, hangi yönde değişti?',
      'Which frequency changed in B, and in which direction?',
    );
  if (stage.kind === 'neighbours')
    return text('B’de yükseltilen dar bant hangisi?', 'Which narrow band is boosted in B?');
  if (stage.kind === 'match')
    return text(
      'Kendi EQ’nu B ile aynı duyulana kadar ayarla.',
      'Set your own EQ until it sounds the same as B.',
    );
  return stage.gains[0] > 0
    ? text('B’de hangi frekans yükseltildi?', 'Which frequency is boosted in B?')
    : text('B’de hangi frekans kesildi?', 'Which frequency is cut in B?');
}
/** A short name for a move, as shown beside the curve and on the A/B/C buttons. */
export function eqMoveLabel(move: EqMove, kind: EqStageKind | undefined): Text {
  const hz = formatHz(move.frequency);
  if (move.shape === 'highpass') return text(`Alçak kesen · ${hz}`, `Low cut · ${hz}`);
  if (move.shape === 'lowpass') return text(`Yüksek kesen · ${hz}`, `High cut · ${hz}`);
  if (move.shape === 'lowshelf')
    return text(`Bas rafı ${signed(move.gain)} · ${hz}`, `Low shelf ${signed(move.gain)} · ${hz}`);
  if (move.shape === 'highshelf')
    return text(`Tiz rafı ${signed(move.gain)} · ${hz}`, `High shelf ${signed(move.gain)} · ${hz}`);
  if (kind === 'width') return text(`${hz} · Q ${move.q}`, `${hz} · Q ${move.q}`);
  if (kind === 'match') return text(`${hz} ${signed(move.gain)}`, `${hz} ${signed(move.gain)}`);
  return text(
    `${hz} ${move.gain > 0 ? 'yükseltme' : 'kesme'}`,
    `${hz} ${move.gain > 0 ? 'boost' : 'cut'}`,
  );
}
function explanation(move: EqMove): Text {
  const hz = formatHz(move.frequency);
  if (move.shape === 'highpass')
    return text(
      `${hz} altı alçak kesen filtreyle temizlendi. Bas gövdesi incelir; A’ya dönünce neyin geri geldiğini dinle.`,
      `A low-cut filter removed the content below ${hz}. The low body thins out; return to A and hear what comes back.`,
    );
  if (move.shape === 'lowpass')
    return text(
      `${hz} üstü yüksek kesen filtreyle kapatıldı. Parlaklık ve hava gider; ses örtülür.`,
      `A high-cut filter closed off the content above ${hz}. Brightness and air go; the sound dulls.`,
    );
  if (move.shape === 'lowshelf')
    return text(
      `${hz} altının tamamı ${signed(move.gain)} yükseltildi. Tek bir bant değil, bütün alt bölge birlikte ağırlaşır.`,
      `Everything below ${hz} was raised by ${signed(move.gain)}. Not one band: the whole low end gains weight together.`,
    );
  if (move.shape === 'highshelf')
    return text(
      `${hz} üstünün tamamı ${signed(move.gain)} yükseltildi. Tek bir bant değil, bütün üst bölge birlikte parlar.`,
      `Everything above ${hz} was raised by ${signed(move.gain)}. Not one band: the whole top end brightens together.`,
    );
  return text(
    `${hz} çevresine ${move.gain > 0 ? 'yükseltme' : 'kesme'} uygulandı (${signed(move.gain)}, Q ${move.q}). A/B ile rengin nasıl değiştiğini tekrar dinle.`,
    `A ${move.gain > 0 ? 'boost' : 'cut'} was applied around ${hz} (${signed(move.gain)}, Q ${move.q}). Compare A/B again to hear the change in tone.`,
  );
}
function build(
  stage: EqStage,
  seed: number,
  source: EqSource,
  move: EqMove,
  options: Option[],
  correct: string,
): Question {
  return {
    kind: 'eq',
    eqKind: stage.kind,
    notesA: [],
    notesB: [],
    seed,
    source,
    frequency: move.frequency,
    gain: move.gain,
    q: move.q,
    shape: move.shape,
    options,
    correct,
    prompt: prompt(stage),
    explanation: explanation(move),
  };
}

export function makeEqQuestion(
  lesson: Lesson,
  seed: number,
  source: EqSource,
  rng: () => number,
): Question {
  const stage = stageOf(lesson);
  const pick = <T>(values: readonly T[]): T => values[Math.floor(rng() * values.length)];
  const peak = (frequency: number, gain: number, q = stage.q): EqMove => ({
    frequency,
    gain,
    q,
    shape: 'peaking',
  });
  if (stage.kind === 'shape') {
    const shape = pick(shapeIds);
    const move = {
      frequency: pick(SHAPES[shape].corners),
      gain: SHAPES[shape].gain,
      q: stage.q,
      shape,
    };
    return build(stage, seed, source, move, stageOptions(stage), shape);
  }
  const gain = pick(stage.gains);
  if (stage.kind === 'region') {
    const region = pick(regionIds);
    const frequency = pick(audibleBands(source, EQ_REGIONS[region].bands, stage.q));
    return build(stage, seed, source, peak(frequency, gain), stageOptions(stage), region);
  }
  if (stage.kind === 'width') {
    const width = pick(widthIds);
    // The narrowest setting decides which bands are fair to ask about.
    const frequency = pick(audibleBands(source, stage.bands, WIDTHS.narrow));
    const move = peak(frequency, gain, WIDTHS[width]);
    return build(stage, seed, source, move, stageOptions(stage), width);
  }
  const frequency = pick(audibleBands(source, stage.bands, stage.q));
  if (stage.kind === 'neighbours') {
    // Five adjacent bands; the target is not always in the middle.
    const at = stage.bands.indexOf(frequency);
    const start = Math.max(0, Math.min(stage.bands.length - 5, at - Math.floor(rng() * 5)));
    const options = stageOptions(stage, stage.bands.slice(start, start + 5));
    return build(stage, seed, source, peak(frequency, gain), options, String(frequency));
  }
  const correct =
    stage.kind === 'direction'
      ? directionId(frequency, gain)
      : stage.kind === 'match'
        ? matchId(frequency, gain)
        : String(frequency);
  return build(stage, seed, source, peak(frequency, gain), stageOptions(stage), correct);
}

// Matching has too many settings to label one by one; its bands are auditioned as ±8 dB moves.
const exampleStage = (lesson: Lesson): EqStage => {
  const stage = stageOf(lesson);
  return stage.kind === 'match' ? { ...stage, kind: 'direction', gains: [8, -8] } : stage;
};
/** Every labelled setting of a stage, for auditioning before the independent questions. */
export function eqExampleOptions(lesson: Lesson): Option[] {
  return stageOptions(exampleStage(lesson));
}
export function makeEqExample(
  lesson: Lesson,
  optionId: string,
  source: EqSource,
  seed = 2026,
): Question | null {
  const stage = exampleStage(lesson);
  const options = stageOptions(stage);
  const reference: EqMove = { frequency: 1000, gain: stage.gains[0], q: stage.q, shape: 'peaking' };
  const move = moveOf(stage.kind, reference, options, optionId);
  return move && build(stage, seed, source, move, options, optionId);
}

function moveOf(
  kind: EqStageKind,
  target: EqMove,
  options: Option[],
  choice: string,
): EqMove | null {
  if (!options.some(o => o.id === choice)) return null;
  if (kind === 'region') return { ...target, frequency: EQ_REGIONS[choice as EqRegion].centre };
  if (kind === 'shape') {
    const shape = choice as ShapeId,
      known = target.shape !== 'peaking' && SHAPES[target.shape].low === SHAPES[shape].low;
    // On the target's side of the spectrum the corner is kept, so only the shape differs.
    return {
      shape,
      frequency: known ? target.frequency : SHAPES[shape].corners[1],
      gain: SHAPES[shape].gain,
      q: SHAPE_Q,
    };
  }
  if (kind === 'width') return { ...target, q: WIDTHS[choice as WidthId] };
  if (kind === 'direction') {
    const [direction, hz] = choice.split(':');
    return {
      ...target,
      frequency: Number(hz),
      gain: Math.abs(target.gain) * (direction === 'boost' ? 1 : -1),
    };
  }
  if (kind === 'match') {
    const [, hz, gain] = choice.split(':');
    return { ...target, frequency: Number(hz), gain: Number(gain) };
  }
  return { ...target, frequency: Number(choice) };
}
export const eqTargetMove = (question: Question): EqMove | null =>
  question.kind === 'eq' &&
  question.frequency !== undefined &&
  question.gain !== undefined &&
  question.q !== undefined
    ? {
        frequency: question.frequency,
        gain: question.gain,
        q: question.q,
        shape: question.shape ?? 'peaking',
      }
    : null;
export const eqComparisonMove = (question: Question): EqMove | null => {
  const target = eqTargetMove(question);
  return target && question.comparisonFrequency !== undefined
    ? {
        frequency: question.comparisonFrequency,
        gain: question.comparisonGain ?? target.gain,
        q: question.comparisonQ ?? target.q,
        shape: question.comparisonShape ?? target.shape,
      }
    : null;
};
/** The EQ move a learner's answer stands for. */
export function eqChoiceSetting(question: Question, choice: string): EqMove | null {
  const target = eqTargetMove(question);
  return target && moveOf(question.eqKind ?? 'bands', target, question.options, choice);
}
export const eqUsesDirection = (question: Question) =>
  question.kind === 'eq' && question.eqKind === 'direction';
export const eqUsesMatching = (question: Question) =>
  question.kind === 'eq' && question.eqKind === 'match';
/** The bands and gain steps of a matching question, in display order. */
export function eqMatchControls(question: Question) {
  const parts = question.options.map(o => o.id.split(':'));
  return {
    bands: [...new Set(parts.map(p => Number(p[1])))],
    gains: [...new Set(parts.map(p => Number(p[2])))].sort((a, b) => b - a),
    id: matchId,
  };
}

/** What was right about a wrong answer. Null when there is nothing specific to say. */
export function eqNearMiss(question: Question, choice: string): Text | null {
  const target = eqTargetMove(question),
    kind = question.eqKind;
  if (!target || choice === question.correct) return null;
  const chosen = eqChoiceSetting(question, choice);
  if (!chosen || !kind || kind === 'region' || kind === 'width') return null;
  if (kind === 'shape') {
    const low = (shape: EqShape) => shape !== 'peaking' && SHAPES[shape].low;
    return low(chosen.shape) === low(target.shape)
      ? text(
          'Doğru bölgedeydin; biçim farklıydı. Raf bölgeyi eşit miktarda kaldırır, kesen filtre köşeden uzaklaştıkça daha çok siler.',
          'You had the right end of the spectrum; the shape differed. A shelf lifts the region evenly, a cut filter removes more the further past the corner you go.',
        )
      : null;
  }
  const sameDirection = Math.sign(chosen.gain) === Math.sign(target.gain);
  if (chosen.frequency === target.frequency) {
    if (!sameDirection)
      return target.gain > 0
        ? text(
            'Frekansı doğru buldun; yön tersti. Burada bant yükseltildi, kesilmedi.',
            'You found the frequency; the direction was reversed. The band was boosted here.',
          )
        : text(
            'Frekansı doğru buldun; yön tersti. Burada bant kesildi, yükseltilmedi.',
            'You found the frequency; the direction was reversed. The band was cut here.',
          );
    const off = Math.abs(chosen.gain) - Math.abs(target.gain);
    return text(
      `Bant ve yön doğru; miktar ${Math.abs(off)} dB ${off > 0 ? 'fazlaydı' : 'eksikti'}. B ile C arasında rengin ne kadar değiştiğini karşılaştır.`,
      `Band and direction were right; the amount was ${Math.abs(off)} dB too ${off > 0 ? 'much' : 'little'}. Compare how far the tone moves in B and in C.`,
    );
  }
  const bands = [
    ...new Set(
      question.options
        .map(o => moveOf(kind, target, question.options, o.id)!.frequency)
        .sort((a, b) => a - b),
    ),
  ];
  const distance = Math.abs(bands.indexOf(chosen.frequency) - bands.indexOf(target.frequency));
  if (distance !== 1) return null;
  const higher = chosen.frequency > target.frequency;
  return sameDirection
    ? text(
        `Çok yaklaştın: seçtiğin bant hedefin hemen ${higher ? 'üstünde' : 'altında'}. B ile C arasında geçiş yapıp merkezin nereye kaydığını dinle.`,
        `Very close: your band is the one just ${higher ? 'above' : 'below'} the target. Switch between B and C and hear where the centre moves.`,
      )
    : text(
        `Komşu bandı seçtin ama yön de tersti. Önce yükseltme mi kesme mi olduğuna karar ver, sonra merkezi ara.`,
        `You chose the neighbouring band, and the direction was reversed too. Decide boost or cut first, then look for the centre.`,
      );
}

/**
 * Magnitude response of a move in dB at one frequency: the biquads Web Audio applies
 * (Audio EQ Cookbook; shelves use slope 1, cut filters take their Q as a plain ratio here).
 */
export function eqMagnitudeDb(move: EqMove, hz: number, rate = 48000): number {
  const A = 10 ** (move.gain / 40),
    w0 = (2 * Math.PI * move.frequency) / rate,
    cos = Math.cos(w0),
    sin = Math.sin(w0);
  let b: number[], a: number[];
  if (move.shape === 'peaking') {
    const alpha = sin / (2 * move.q);
    b = [1 + alpha * A, -2 * cos, 1 - alpha * A];
    a = [1 + alpha / A, -2 * cos, 1 - alpha / A];
  } else if (move.shape === 'lowshelf' || move.shape === 'highshelf') {
    const k = 2 * (sin / 2) * Math.SQRT2 * Math.sqrt(A),
      s = move.shape === 'lowshelf' ? 1 : -1;
    b = [
      A * (A + 1 - s * (A - 1) * cos + k),
      s * 2 * A * (A - 1 - s * (A + 1) * cos),
      A * (A + 1 - s * (A - 1) * cos - k),
    ];
    a = [
      A + 1 + s * (A - 1) * cos + k,
      -s * 2 * (A - 1 + s * (A + 1) * cos),
      A + 1 + s * (A - 1) * cos - k,
    ];
  } else {
    const alpha = sin / (2 * move.q),
      s = move.shape === 'lowpass' ? 1 : -1;
    b = [(1 - s * cos) / 2, s * (1 - s * cos), (1 - s * cos) / 2];
    a = [1 + alpha, -2 * cos, 1 - alpha];
  }
  const w = (2 * Math.PI * hz) / rate;
  const magnitude = (c: number[]) =>
    Math.hypot(
      c[0] + c[1] * Math.cos(w) + c[2] * Math.cos(2 * w),
      -c[1] * Math.sin(w) - c[2] * Math.sin(2 * w),
    );
  return 20 * Math.log10(Math.max(magnitude(b) / magnitude(a), 1e-9));
}
