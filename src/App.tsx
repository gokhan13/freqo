import { SkillStudyGuide } from './components/SkillStudyGuide';
import { useProgressStorage } from './useProgressStorage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setShortcuts, shortcutsOn } from './shortcuts';
import { applyUpdate, useOffline } from './offline';
import { PersonalCard, PersonalStudio } from './components/PersonalStudio';
import { personalPlan, studyEvidence, skillEstimate, skillLessons } from './personal-model';
import { MusicHistory } from './components/MusicHistory';
import { answerLabel } from './music-model';
import { MusicGuide } from './components/MusicGuide';
import { MusicAnswerEditor } from './components/MusicAnswerEditor';
import { MusicFeedback } from './components/MusicFeedback';
import { TapRecorder } from './components/TapRecorder';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { ExamStudio } from './components/ExamStudio';
import { expireMock, initialExamProgress } from './exam-model';
import type { ExamProgress } from './exam-types';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  Headphones,
  House,
  Layers3,
  Music2,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  UserRound,
} from 'lucide-react';
import {
  eqSources,
  getLesson,
  lessonGroups,
  lessons,
  pathCount,
  paths,
  skillNames,
  text,
  tx,
  ui,
  usesLoop,
  usesPair,
  type Locale,
  type PathId,
  type SkillId,
  type Text,
  sourcesFor,
} from './content';
import {
  advanceQuestion,
  answerQuestion,
  formatHz,
  makeQuestion,
  newSession,
  ROUND_COUNT,
  withAnswerComparison,
  withEqPreview,
  type Progress,
  type Question,
} from './model';
import { AudioEngine, type Variant } from './audio';
import { AudioPlayer } from './components/AudioPlayer';
import {
  BackupError,
  createBackup,
  MAX_BACKUP_BYTES,
  mergeProgress,
  readBackupDetailed,
} from './backup';
import { SourcePicker } from './components/SourcePicker';
import { ListeningFeedback } from './components/ListeningFeedback';
import { LessonList } from './components/LessonList';
import { needsStereo } from './advanced-content';
import { MixFeedback } from './components/MixFeedback';
import { StereoCheck } from './components/StereoCheck';
import { MixLab, labEffectFor } from './components/MixLab';
import { KnownExamples } from './components/KnownExamples';
import { EqCurve } from './components/EqCurve';
import { EqInsights } from './components/EqInsights';
import { EqExamples } from './components/EqExamples';
import { AnswerOptions, hasNumberShortcuts } from './components/AnswerOptions';
import { eqNearMiss, eqUsesMatching } from './eq-model';

// Below this many answers a percentage says more than the answers can.
const SCORE_MINIMUM = 5;
const ProgressReport = lazy(() =>
  import('./components/ProgressReport').then(module => ({ default: module.ProgressReport })),
);
// A module that failed to download stays failed for as long as the page lives, so trying the
// report again means reloading. This note brings the learner straight back to it.
const REOPEN_KEY = 'freq.reopen-report';
function reopensReport() {
  try {
    const asked = sessionStorage.getItem(REOPEN_KEY) !== null;
    sessionStorage.removeItem(REOPEN_KEY);
    return asked;
  } catch {
    return false;
  }
}
function retryReport() {
  try {
    sessionStorage.setItem(REOPEN_KEY, '1');
  } catch {
    /* The reload still happens; the report is then two taps away. */
  }
  window.location.reload();
}

type Page =
  | 'today'
  | 'paths'
  | 'path'
  | 'skills'
  | 'profile'
  | 'practice'
  | 'summary'
  | 'lab'
  | 'personal'
  | 'report';
const pathIds: PathId[] = ['mix', 'music', 'exam'];
const skillIds = Object.keys(skillNames) as SkillId[];
const pathIcon = { mix: SlidersHorizontal, music: Music2, exam: Target };
// A skill is listed under the path that teaches it.
const skillPath = (skill: SkillId) => lessons.find(l => l.skill === skill)!.path;

function Brand() {
  return (
    <span className="brand">
      <span className="brand-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      freq<span className="brand-dot">.</span>
    </span>
  );
}
function Tag({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`tag ${className}`}>{children}</span>;
}
function PathIcon({ path, size = 23 }: { path: PathId; size?: number }) {
  const Icon = pathIcon[path];
  return <Icon size={size} aria-hidden="true" />;
}

function FrequencyArt({ small = false, label }: { small?: boolean; label: string }) {
  return (
    <div className={`frequency-art ${small ? 'small' : ''}`} aria-hidden="true">
      <div className="art-grid" />
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <svg viewBox="0 0 400 210">
        <defs>
          <linearGradient id="wave-fill" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#c8ed86" stopOpacity=".23" />
            <stop offset="1" stopColor="#c8ed86" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 151 C32 151 40 130 58 130 S85 163 105 156 S134 136 151 124 S176 37 209 37 S240 116 262 129 S297 148 321 143 S361 130 400 130 L400 210 L0 210 Z"
          fill="url(#wave-fill)"
        />
        <path
          d="M0 151 C32 151 40 130 58 130 S85 163 105 156 S134 136 151 124 S176 37 209 37 S240 116 262 129 S297 148 321 143 S361 130 400 130"
          stroke="#c8ed86"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="209" cy="37" r="6" fill="#c8ed86" />
        <circle cx="209" cy="37" r="13" stroke="#c8ed86" strokeOpacity=".3" fill="none" />
      </svg>
      <div className="art-frequencies">
        <span>20 Hz</span>
        <span>1 kHz</span>
        <span>20 kHz</span>
      </div>
      <div className="art-label">
        <AudioLines size={16} /> {label}
      </div>
    </div>
  );
}

function Modal({
  title,
  copy,
  cancel,
  action,
  onCancel,
  onAction,
  children,
}: {
  title: string;
  copy: string;
  cancel: string;
  action: string;
  onCancel: () => void;
  onAction: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelRef.current();
      if (e.key === 'Tab') {
        const buttons = ref.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-overlay">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={ref}
      >
        <h2 id="modal-title">{title}</h2>
        <p>{copy}</p>
        {children}
        <div className="modal-actions">
          <button className="button secondary" onClick={onCancel}>
            {cancel}
          </button>
          <button className="button" onClick={onAction}>
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const {
    progress,
    setProgress,
    storageError,
    storageProblem,
    acceptRecovery,
    clearHistory,
    updateNotice,
    dismissNotice,
    archives,
    deleteArchives,
  } = useProgressStorage();
  const [archiveDelete, setArchiveDelete] = useState(false);
  // The lab opens on the tool a report suggestion points at; otherwise on its default.
  const [labTool, setLabTool] = useState<ReturnType<typeof labEffectFor>>();
  const [storageDecision, setStorageDecision] = useState<'reload' | 'recover' | null>(null);
  const [page, setPage] = useState<Page>(() =>
    reopensReport()
      ? 'report'
      : progress.exam?.active
        ? 'path'
        : progress.personal?.active
          ? 'personal'
          : progress.session
            ? 'practice'
            : 'today',
  );
  const [selectedPath, setSelectedPath] = useState<PathId>(
    progress.exam?.active ? 'exam' : progress.path,
  );
  const [resetOpen, setResetOpen] = useState(false);
  const [pendingLesson, setPendingLesson] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<{
    progress: Progress;
    retired: number;
    filename: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [backupNotice, setBackupNotice] = useState<Text | null>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const [heard, setHeard] = useState<Variant[]>([]);
  const [stereoReady, setStereoReady] = useState(false);
  const engine = useMemo(() => new AudioEngine(), []);
  const updateExam = useCallback(
    (update: (p: ExamProgress) => ExamProgress) =>
      setProgress(p => {
        const current = p.exam ?? initialExamProgress(),
          next = update(current);
        return next === current ? p : { ...p, exam: next };
      }),
    [],
  );
  useEffect(() => {
    if (!progress.exam?.active) return;
    const expire = () => updateExam(p => expireMock(p));
    expire();
    const timer = window.setInterval(expire, 1000);
    return () => clearInterval(timer);
  }, [progress.exam?.active?.id, updateExam]);
  const mainRef = useRef<HTMLElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const locale = progress.locale;
  const t = (value: Text) => tx(value, locale);
  const offline = useOffline();
  const shortcuts = progress.shortcuts !== false;
  setShortcuts(shortcuts);
  const session = progress.session;
  const lesson = session ? getLesson(session.lessonId) : null;
  const question = useMemo(
    () =>
      session ? makeQuestion(session.lessonId, session.seed, session.index, session.source) : null,
    [session?.lessonId, session?.seed, session?.index, session?.source],
  );
  const guided = useMemo(
    () => (lesson ? makeQuestion(lesson.id, 2026, 0, session?.source) : null),
    [lesson?.id, session?.source],
  );
  const answered = session?.answers[session.index];
  // While matching, the learner's unsubmitted EQ setting plays as C.
  const [preview, setPreview] = useState<string | null>(null);
  const playbackQuestion = useMemo(
    () =>
      question && answered
        ? withAnswerComparison(question, answered.choice)
        : question && preview
          ? withEqPreview(question, preview)
          : question,
    [question, answered, preview],
  );
  const modalOpen = resetOpen || !!pendingLesson || !!pendingBackup || !!storageDecision;
  const requiredHeard: Variant[] = question && usesPair(question.kind) ? ['a', 'b'] : ['a'];
  const canAnswer = requiredHeard.every(v => heard.includes(v));
  // History only: a volume or language change must not recompute the plan.
  const recommended = useMemo(
    () => personalPlan(progress).lesson,
    [progress.attempts, progress.personal, progress.path],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === 'tr' ? 'Freq · Kulağını geliştir' : 'Freq · Train your ears';
  }, [locale]);
  useEffect(() => engine.setVolume(progress.volume), [engine, progress.volume]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) engine.stop();
    };
    const hide = () => engine.stop();
    document.addEventListener('visibilitychange', pause);
    window.addEventListener('pagehide', hide);
    return () => {
      document.removeEventListener('visibilitychange', pause);
      window.removeEventListener('pagehide', hide);
      engine.stop();
    };
  }, [engine]);
  useEffect(() => {
    engine.stop();
    mainRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [engine, page]);
  useEffect(() => {
    setStereoReady(false);
  }, [session?.id]);
  useEffect(() => {
    setHeard([]);
    setPreview(null);
  }, [session?.id, session?.index, session?.started]);
  useEffect(() => {
    if (answered) feedbackRef.current?.focus();
  }, [answered]);

  // Every screen change is a browser history entry, so the back button, the Android back
  // gesture and a trackpad swipe return to the previous screen instead of leaving the app.
  // The address stays the same: a reload still opens wherever saved progress says.
  const remember = (next: Page, path: PathId, replace = false) =>
    history[replace ? 'replaceState' : 'pushState']({ freq: { page: next, path } }, '');
  useEffect(() => {
    remember(page, selectedPath, true);
    const back = (event: PopStateEvent) => {
      const place = (event.state as { freq?: { page: Page; path: PathId } } | null)?.freq;
      if (!place) return;
      engine.stop();
      setSelectedPath(place.path);
      setPage(place.page);
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [engine]);
  useEffect(() => {
    // A screen that history returns to may no longer have anything to show.
    const fallback =
      page === 'practice' && !session
        ? progress.results.length
          ? 'summary'
          : 'today'
        : page === 'summary' && !progress.results.length
          ? 'today'
          : null;
    if (!fallback) return;
    remember(fallback, selectedPath, true);
    setPage(fallback);
  }, [page, session, progress.results.length]);

  const navigate = (next: Page, path: PathId = selectedPath) => {
    engine.stop();
    if (next !== page || path !== selectedPath) remember(next, path);
    setSelectedPath(path);
    setPage(next);
  };
  const setVolume = (volume: number) => {
    engine.setVolume(volume);
    setProgress(p => ({ ...p, volume }));
  };
  const start = (id: string) => {
    engine.stop();
    if (session && session.lessonId !== id) {
      setPendingLesson(id);
      return;
    }
    if (!session) setProgress(p => ({ ...p, session: newSession(id, p.eqSource) }));
    navigate('practice');
  };
  const goPath = (path: PathId) => navigate('path', path);
  const chooseAnswer = (choice: string) => {
    if (!canAnswer || answered) return;
    setProgress(p => answerQuestion(p, choice));
    engine.stop();
  };
  useEffect(() => {
    if (
      page !== 'practice' ||
      !session?.started ||
      answered ||
      !canAnswer ||
      modalOpen ||
      (question?.music && question.music.response !== 'choice')
    )
      return;
    const onKey = (e: KeyboardEvent) => {
      if (
        !shortcutsOn() ||
        (e.target as HTMLElement).closest('input,button,select,textarea') ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      const index = Number(e.key) - 1;
      if (question && hasNumberShortcuts(question) && index >= 0 && index < question.options.length)
        chooseAnswer(question.options[index].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const nextQuestion = () => {
    if (!session || !answered) return;
    engine.stop();
    setProgress(p => advanceQuestion(p));
    if (session.index === ROUND_COUNT - 1) navigate('summary');
    else requestAnimationFrame(() => mainRef.current?.focus());
  };
  // Enter moves on once the feedback is showing, so a round can be worked from the keyboard.
  useEffect(() => {
    if (page !== 'practice' || !answered || modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key !== 'Enter' ||
        e.repeat ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        (e.target as HTMLElement).closest('input,button,select,textarea,a,summary')
      )
        return;
      e.preventDefault();
      nextQuestion();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const download = () =>
    downloadRaw(
      JSON.stringify(createBackup(progress)),
      `freq-progress-${new Date().toISOString().slice(0, 10)}.json`,
    );
  const downloadRaw = (raw: string, filename: string) => {
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  // Each archived record downloads as it was stored, so it can be restored like any backup.
  const downloadArchives = () =>
    archives.forEach(({ key, raw }, index) =>
      setTimeout(
        () => downloadRaw(raw, `freq-arsiv-${key.replace(/^freq\./, '')}.json`),
        index * 300,
      ),
    );
  const backupErrorText = (error: unknown) =>
    error instanceof BackupError
      ? {
          invalid: ui.importInvalid,
          future: ui.importFuture,
          large: ui.importLarge,
          conflict: ui.importConflict,
        }[error.code]
      : ui.importInvalid;
  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    engine.stop();
    setImporting(true);
    setBackupNotice(null);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new BackupError('large');
      const incoming = readBackupDetailed(await file.text());
      mergeProgress(progress, incoming.progress, { keepCurrentSessions: true });
      setPendingBackup({ ...incoming, filename: file.name });
    } catch (error) {
      setBackupNotice(backupErrorText(error));
    } finally {
      setImporting(false);
    }
  };
  const restoreBackup = () => {
    if (!pendingBackup) return;
    try {
      const merged = mergeProgress(progress, pendingBackup.progress, {
        keepCurrentSessions: true,
      });
      engine.stop();
      setProgress(merged);
      setPendingBackup(null);
      setHeard([]);
      setBackupNotice(storageError ? ui.importUnsaved : ui.importSuccess);
    } catch (error) {
      setPendingBackup(null);
      setBackupNotice(backupErrorText(error));
    }
  };
  const evidence = useMemo(() => studyEvidence(progress), [progress.attempts, progress.personal]);
  const completedQuestions = evidence.length;
  const independent = evidence.filter(e => !e.review);
  const reviews = evidence.filter(e => e.review);
  const totalAccuracy = independent.length
    ? Math.round((independent.filter(a => a.correct).length / independent.length) * 100)
    : null;
  const completedSessions =
    progress.results.length +
    (progress.personal?.results.filter(r => r.mode !== 'placement' && r.status === 'completed')
      .length ?? 0);
  // Nothing recorded and nothing under way: the first screen offers one step, not six.
  const newcomer =
    !completedQuestions &&
    !session &&
    !progress.personal?.active &&
    !progress.personal?.results.length &&
    !progress.exam?.results.length;
  const nav = [
    { page: 'today' as const, icon: House, label: ui.today },
    { page: 'paths' as const, icon: Layers3, label: ui.paths },
    { page: 'skills' as const, icon: TrendingUp, label: ui.skills },
    { page: 'profile' as const, icon: UserRound, label: ui.profile },
  ];
  const activeNav =
    page === 'report'
      ? 'skills'
      : page === 'path' || page === 'lab'
        ? 'paths'
        : page === 'practice' || page === 'summary' || page === 'personal'
          ? 'today'
          : page;
  const playerProps = { engine, locale, volume: progress.volume, onVolume: setVolume };
  const path =
    page === 'personal' && progress.personal?.active
      ? progress.personal.active.path
      : page === 'lab'
        ? 'mix'
        : page === 'practice' && lesson
          ? lesson.path
          : page === 'path'
            ? selectedPath
            : progress.path;

  return (
    <div className={`app theme-${paths[path].color}`}>
      <a href="#main" className="skip-link" tabIndex={modalOpen ? -1 : undefined}>
        {t(ui.skipLink)}
      </a>
      <aside
        aria-label={t(text('Uygulama menüsü', 'Application menu'))}
        className="sidebar"
        inert={modalOpen}
      >
        <button className="brand-button" onClick={() => navigate('today')} aria-label="Freq">
          <Brand />
        </button>
        <span className="sidebar-label">{t(text('SENİN ALANIN', 'YOUR SPACE'))}</span>
        <nav aria-label={t(text('Ana gezinme', 'Main navigation'))}>
          {nav.map(({ page: p, icon: Icon, label }) => (
            <button
              key={p}
              onClick={() => navigate(p)}
              aria-current={activeNav === p ? 'page' : undefined}
              // The text label is hidden on narrow sidebars; the name must not go with it.
              aria-label={t(label)}
              title={t(label)}
              className={`nav-item ${activeNav === p ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{t(label)}</span>
              {activeNav === p && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-note">
            <Headphones size={23} />
            <p>
              {t(text('Her gün biraz\ndaha dikkatli dinle.', 'Listen a little\ncloser every day.'))}
            </p>
          </div>
          <span className="edition">{t(ui.early)}</span>
        </div>
      </aside>
      <div className="workspace" inert={modalOpen}>
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="breadcrumb">
            {t(nav.find(n => n.page === activeNav)!.label)}
            {page === 'path' && (
              <>
                <ChevronRight size={14} />
                {t(paths[selectedPath].short)}
              </>
            )}
          </span>
          <div className="topbar-right">
            {offline.state === 'update' ? (
              <button
                className="local-badge is-update"
                data-testid="update-ready"
                onClick={() => navigate('profile')}
              >
                <span />
                {t(text('Yeni sürüm hazır', 'New version ready'))}
              </button>
            ) : (
              <span className={`local-badge ${offline.online ? '' : 'is-offline'}`}>
                <span />
                {t(
                  offline.online
                    ? text('Kişisel dinleme alanı', 'Personal listening space')
                    : text('Çevrimdışı çalışıyorsun', 'Working offline'),
                )}
              </span>
            )}
            <div className="language-switch" role="group" aria-label={t(ui.language)}>
              {(['tr', 'en'] as Locale[]).map(l => (
                <button
                  key={l}
                  aria-pressed={locale === l}
                  onClick={() => setProgress(p => ({ ...p, locale: l }))}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>
        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className={`main-content ${page === 'practice' ? 'practice-main' : ''}`}
        >
          {storageError && (
            <div className="notice storage-notice" role="alert">
              <p>{t(ui.storageError)}</p>
              <button className="button secondary" onClick={download}>
                {t(text('Bu sekmedeki veriyi indir', 'Download this tab’s records'))}
                <Download size={16} />
              </button>
            </div>
          )}
          {storageProblem && (
            <div className="notice storage-notice" role="alert">
              <p>
                {t(
                  storageProblem.kind === 'update'
                    ? text(
                        'Bu güncelleme bazı dersleri yeniden kurdu; o derslere verilmiş eski yanıtların geçmişten ayrılması gerekiyor. Kaydın eski hali tarayıcıda arşivlenemedi (alan dolu). Önce orijinal kaydı indir; sonra devam et. O zamana kadar yeni yanıtlar yalnızca bu sekmede kalır.',
                        'This update rebuilt some lessons; old answers to them have to leave your history. The record as it was could not be archived in the browser (storage is full). Download the original record first, then continue. Until then new answers stay in this tab only.',
                      )
                    : storageProblem.kind === 'invalid'
                      ? text(
                          'Kaydedilmiş verinin bir bölümü okunamadı. Orijinal kayıt korunuyor; kurtarılabilen verilerle devam edebilirsin. Yeni yanıtlar bu sekmede kalır, henüz diske yazılmaz.',
                          'Part of the saved data could not be read. The original is preserved; you can work with the recoverable records. New answers remain in this tab and are not saved to disk yet.',
                        )
                      : text(
                          'Başka bir sekmedeki kayıtla çakışma var. Otomatik kayıt durduruldu; bu sekmedeki yanıtlar ve diskteki kayıt korunuyor. Kapatmadan önce bu sekmenin verisini indir.',
                          'Records conflict with another tab. Automatic saving has stopped; this tab’s answers and the saved copy are preserved. Download this tab’s data before closing.',
                        ),
                )}
              </p>
              <div className="storage-actions">
                <button className="button secondary" onClick={download}>
                  {t(text('Bu sekmedeki veriyi indir', 'Download this tab’s records'))}
                </button>
                {storageProblem.raw !== null && (
                  <button
                    className="button secondary"
                    onClick={() => downloadRaw(storageProblem.raw!, 'freq-original-record.json')}
                  >
                    {t(text('Orijinal kaydı indir', 'Download original record'))}
                  </button>
                )}
                <button
                  className="text-button"
                  onClick={() =>
                    setStorageDecision(storageProblem.kind === 'conflict' ? 'reload' : 'recover')
                  }
                >
                  {t(
                    storageProblem.kind === 'update'
                      ? text('Güncel geçmişle devam et', 'Continue with the current history')
                      : storageProblem.kind === 'invalid'
                        ? text('Kurtarılan veriyi kullan', 'Use recovered records')
                        : text('Kaydedilmiş sürümü aç', 'Open saved copy'),
                  )}
                </button>
              </div>
            </div>
          )}
          {updateNotice && !storageProblem && (
            <div className="notice update-notice" role="status" data-testid="update-notice">
              <p>
                {t(
                  updateNotice.retired
                    ? text(
                        `Güncelleme bazı miks derslerini yeniden kurdu. Bu derslere verilmiş ${updateNotice.retired} eski yanıt artık aynı sesi anlatmadığı için geçmişine alınmadı. Diğer bütün çalışmaların ve tercihlerin yerinde.`,
                        `An update rebuilt some mixing lessons. ${updateNotice.retired} old answers to those lessons no longer describe the same sound, so they were not carried into your history. All your other work and your preferences are in place.`,
                      )
                    : text(
                        'Önceki sürümdeki çalışmaların ve tercihlerin bu sürüme taşındı.',
                        'Your work and preferences from the previous version were carried over.',
                      ),
                )}{' '}
                {archives.length > 0 &&
                  t(
                    text(
                      'Eski kaydın tamamı bu tarayıcıda arşivde duruyor; Profil’den indirebilirsin.',
                      'The complete earlier record is kept in this browser as an archive; you can download it from Profile.',
                    ),
                  )}
              </p>
              <div className="storage-actions">
                {archives.length > 0 && (
                  <button className="button secondary" onClick={downloadArchives}>
                    <Download size={16} />
                    {t(text('Eski kaydı indir', 'Download the earlier record'))}
                  </button>
                )}
                <button className="text-button" onClick={dismissNotice}>
                  {t(text('Anladım', 'Got it'))}
                </button>
              </div>
            </div>
          )}
          {page === 'today' && (
            <>
              {progress.exam?.active && (
                <div className="exam-resume">
                  <span>
                    {t(text('Süreli denemen devam ediyor.', 'Your timed mock is running.'))}
                  </span>
                  <button className="button secondary" onClick={() => goPath('exam')}>
                    {t(text('Denemeye dön', 'Return to mock'))}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
              <section className="home-hero">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span className="tiny-star">✳</span>
                    {t(ui.studio)}
                  </div>
                  <h1>{t(ui.welcome)}</h1>
                  <p className="lead">{t(ui.welcomeSub)}</p>
                  <div className="active-path">
                    <span className="active-path-icon">
                      <PathIcon path={progress.path} size={18} />
                    </span>
                    <div>
                      <span>{t(ui.active)}</span>
                      <strong>{t(paths[progress.path].title)}</strong>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => navigate('paths')}
                      aria-label={t(ui.allPaths)}
                    >
                      <ArrowRight size={19} />
                    </button>
                  </div>
                </div>
                <FrequencyArt label={t(text('DİKKATLE DİNLE', 'LISTEN CLOSELY'))} />
              </section>
              {newcomer ? (
                // First visit: one thing to do. The rest of the app is a tap away, not in the way.
                <section className="first-step" data-testid="first-step">
                  <div>
                    <span className="eyebrow">{t(text('İLK ADIM', 'FIRST STEP'))}</span>
                    <h2>{t(recommended.title)}</h2>
                    <p>
                      {t(
                        text(
                          'Kulaklığını tak. Ders önce açıklamalı bir örnek dinletir, sonra beş soru sorar; yaklaşık üç dakika sürer.',
                          'Put your headphones on. The lesson plays a guided example first, then asks five questions; it takes about three minutes.',
                        ),
                      )}
                    </p>
                  </div>
                  <div className="first-step-actions">
                    <button className="button" onClick={() => start(recommended.id)}>
                      {t(ui.start)}
                      <ArrowRight size={18} />
                    </button>
                    <p className="small-copy">
                      {t(
                        text(
                          'Deneyimliysen kısa bir değerlendirme başlangıç aşamanı bulur:',
                          'If you have experience, a short placement finds your starting stage:',
                        ),
                      )}{' '}
                      <button className="text-button" onClick={() => navigate('personal')}>
                        {t(text('Kişisel planı aç', 'Open personal plan'))}
                      </button>
                    </p>
                  </div>
                </section>
              ) : (
                <PersonalCard
                  progress={progress}
                  locale={locale}
                  onOpen={() => navigate('personal')}
                />
              )}
              {!newcomer && (
                <section className="dashboard-grid">
                  <div className="next-card">
                    <div className="card-heading">
                      <span className="eyebrow">
                        {session
                          ? t(text('YARIM KALAN PRATİĞİN', 'YOUR UNFINISHED PRACTICE'))
                          : t(text('DERS VE AÇIKLAMALI ÖRNEKLER', 'LESSON AND GUIDED EXAMPLES'))}
                      </span>
                      <Tag>
                        {t(ui.levels)}{' '}
                        {session ? getLesson(session.lessonId).level : recommended.level}
                      </Tag>
                    </div>
                    <div className="next-body">
                      <span className="next-icon">
                        <AudioLines size={36} strokeWidth={1.5} />
                      </span>
                      <div>
                        <h2>
                          {t(session ? getLesson(session.lessonId).title : recommended.title)}
                        </h2>
                        <p>
                          {t(
                            session
                              ? getLesson(session.lessonId).description
                              : recommended.description,
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="next-footer">
                      <div className="lesson-meta">
                        <span>
                          <Headphones size={15} />
                          {t(ui.minutes)}
                        </span>
                        <span>•</span>
                        <span>{t(ui.questions)}</span>
                      </div>
                      <button
                        className="button"
                        onClick={() => start(session?.lessonId ?? recommended.id)}
                      >
                        {t(session ? ui.resume : ui.start)}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="stats-card">
                    <span className="eyebrow">
                      {t(text('KÜÇÜK ADIMLAR, GERÇEK PRATİK', 'SMALL STEPS, REAL PRACTICE'))}
                    </span>
                    <div className="stat-row">
                      <span>{t(ui.sessions)}</span>
                      <strong>{completedSessions.toString().padStart(2, '0')}</strong>
                    </div>
                    <div className="stat-row">
                      <span>{t(ui.total)}</span>
                      <strong>{completedQuestions.toString().padStart(2, '0')}</strong>
                    </div>
                    <div className="stat-row">
                      <span>
                        {t(text('Tekrar hariç doğru yanıt', 'Accuracy excluding reviews'))}
                      </span>
                      <strong>{totalAccuracy === null ? '—' : `${totalAccuracy}%`}</strong>
                    </div>
                    <p className="small-copy">
                      {independent.length} {t(text('normal pratik yanıtı', 'practice answers'))} ·{' '}
                      {reviews.length} {t(text('hata tekrarı', 'error reviews'))}
                    </p>
                    <button className="text-button" onClick={() => navigate('skills')}>
                      {t(text('Becerilerine göz at', 'See your skills'))}
                      <ArrowUpRightIcon />
                    </button>
                    <button
                      className="text-button home-report-link"
                      onClick={() => navigate('report')}
                    >
                      {t(text('Gelişimini incele', 'Review your progress'))}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
              )}
              <section className="paths-section">
                <div className="section-heading">
                  <h2>
                    {t(
                      text('Üç yol. Bir dinleme alışkanlığı.', 'Three paths. One listening habit.'),
                    )}
                  </h2>
                  <button className="text-button" onClick={() => navigate('paths')}>
                    {t(ui.allPaths)}
                    <ArrowRight size={16} />
                  </button>
                </div>
                <div className="path-cards">
                  {pathIds.map(p => (
                    <button
                      key={p}
                      className={`path-card color-${paths[p].color}`}
                      onClick={() => goPath(p)}
                    >
                      <span className="path-card-top">
                        <span className="path-card-icon">
                          <PathIcon path={p} />
                        </span>
                        {progress.path === p ? (
                          <Tag>{t(ui.selected)}</Tag>
                        ) : (
                          <ArrowRight size={19} />
                        )}
                      </span>
                      <span className="path-card-title">{t(paths[p].title)}</span>
                      <span className="path-card-desc">{t(paths[p].description)}</span>
                      <span className="path-card-bottom">
                        {t(pathCount(p))}
                        <ChevronRight size={17} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <aside aria-label={t(ui.learnTip)} className="listening-note">
                <span className="note-icon">
                  <Sparkles size={23} />
                </span>
                <div>
                  <span className="eyebrow">{t(ui.learnTip)}</span>
                  <h3>{t(ui.tipHome)}</h3>
                  <p>{t(ui.tipHomeCopy)}</p>
                </div>
              </aside>
            </>
          )}
          {page === 'paths' && (
            <>
              <PageHeading
                label={t(text('ÖĞRENME YOLLARI', 'LEARNING PATHS'))}
                title={t(ui.choose)}
                copy={t(ui.chooseSub)}
              />
              <div className="full-path-list">
                {pathIds.map((p, i) => (
                  <section className={`full-path color-${paths[p].color}`} key={p}>
                    <div className="full-path-number">0{i + 1}</div>
                    <div className="full-path-content">
                      <div className="eyebrow">{t(paths[p].label)}</div>
                      <h2>
                        <PathIcon path={p} />
                        {t(paths[p].title)}
                      </h2>
                      <p>{t(paths[p].description)}</p>
                      <div className="lesson-chips">
                        {lessonGroups[p].map(group => (
                          <span key={group.id}>
                            {t(group.title)} ·{' '}
                            {
                              lessons.filter(l => l.path === p && group.skills.includes(l.skill))
                                .length
                            }{' '}
                            {t(text('pratik', 'practices'))}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="button secondary" onClick={() => goPath(p)}>
                      {t(ui.viewPath)}
                      <ArrowRight size={18} />
                    </button>
                  </section>
                ))}
              </div>
            </>
          )}
          {page === 'path' && (
            <>
              <button className="text-button back-link" onClick={() => navigate('paths')}>
                <ArrowLeft size={17} />
                {t(ui.allPaths)}
              </button>
              <PageHeading
                label={t(paths[selectedPath].label)}
                title={t(paths[selectedPath].title)}
                copy={t(paths[selectedPath].description)}
              />
              <div className="path-detail-meta">
                <Tag>
                  <PathIcon path={selectedPath} size={14} />
                  {t(pathCount(selectedPath))}
                </Tag>
                <button
                  className="text-button"
                  onClick={() => setProgress(p => ({ ...p, path: selectedPath }))}
                >
                  {progress.path === selectedPath ? <Check size={16} /> : <ArrowDown size={16} />}
                  {t(progress.path === selectedPath ? ui.selected : ui.makeActive)}
                </button>
              </div>
              {selectedPath === 'mix' && (
                <section className="lab-entry">
                  <div>
                    <span className="eyebrow">{t(text('MİKS LABORATUVARI', 'MIX LAB'))}</span>
                    <h2>
                      {t(
                        text(
                          'Duyduğunu kendi kaydında dene.',
                          'Try what you hear on your recording.',
                        ),
                      )}
                    </h2>
                    <p>
                      {t(
                        text(
                          'Hazır akustik kayıt veya kendi dosyanla A/B, mono kontrolü ve ayar denemeleri.',
                          'A/B, mono checks and settings to explore with an acoustic example or your own file.',
                        ),
                      )}
                    </p>
                  </div>
                  <button
                    className="button"
                    onClick={() => {
                      setLabTool(undefined);
                      navigate('lab');
                    }}
                  >
                    {t(text('Laboratuvarı aç', 'Open the lab'))}
                    <ArrowRight size={18} />
                  </button>
                </section>
              )}
              {selectedPath === 'exam' && (
                <ExamStudio
                  {...playerProps}
                  progress={progress.exam}
                  onChange={updateExam}
                  onPractice={start}
                />
              )}
              <LessonList path={selectedPath} progress={progress} locale={locale} onStart={start} />
              <aside aria-label={t(ui.future)} className="roadmap-note">
                <CircleHelp size={22} />
                <div>
                  <h3>{t(ui.future)}</h3>
                  <p>
                    {t(
                      selectedPath === 'mix'
                        ? ui.roadmapMix
                        : selectedPath === 'music'
                          ? ui.roadmapMusic
                          : ui.roadmapExam,
                    )}
                  </p>
                </div>
              </aside>
            </>
          )}
          {page === 'personal' && (
            <PersonalStudio
              progress={progress}
              onChange={update => setProgress(update)}
              {...playerProps}
              onPractice={start}
              onBack={() => navigate('today')}
              onPath={path => setProgress(p => ({ ...p, path }))}
            />
          )}
          {page === 'lab' && (
            <MixLab {...playerProps} initial={labTool} onBack={() => goPath('mix')} />
          )}
          {page === 'report' && (
            <ErrorBoundary
              fallback={() => (
                <div className="notice report-failed" role="alert" data-testid="report-failed">
                  <p>
                    <strong>
                      {t(text('Rapor açılamadı.', 'The report could not be opened.'))}
                    </strong>{' '}
                    {t(
                      text(
                        'Büyük olasılıkla bağlantı kesildi ya da uygulama güncellendi. İlerlemen yerinde duruyor; uygulamanın geri kalanı çalışıyor. Yeniden denemek sayfayı yeniler ve seni rapora geri getirir.',
                        'The connection probably dropped, or the app was updated. Your progress is untouched and the rest of the app works. Trying again reloads the page and brings you back to the report.',
                      ),
                    )}
                  </p>
                  <div className="notice-actions">
                    <button className="button secondary" onClick={retryReport}>
                      {t(text('Yeniden dene', 'Try again'))}
                    </button>
                    <button className="text-button" onClick={() => navigate('skills')}>
                      {t(text('Becerilerime dön', 'Back to my skills'))}
                    </button>
                  </div>
                </div>
              )}
            >
              <Suspense
                fallback={
                  <p className="notice" role="status">
                    {t(text('Gelişim raporun yükleniyor…', 'Loading your progress report…'))}
                  </p>
                }
              >
                <ProgressReport
                  progress={progress}
                  locale={locale}
                  recordNotice={
                    storageProblem
                      ? text(
                          'Bu rapor bu sekmedeki okunabilir verilere dayanır. Kayıt sorunu çözülene kadar yeni yanıtlar diske yazılmıyor; ilerleme yedeğini de indir.',
                          'This report uses readable records in this tab. New answers are not saved to disk until the record problem is resolved; download your progress backup too.',
                        )
                      : storageError
                        ? text(
                            'Bu rapor bu sekmedeki verilere dayanır. Tarayıcı yeni kayıtları saklayamıyor; sayfayı kapatmadan ilerleme yedeğini de indir.',
                            'This report uses this tab’s records. The browser cannot save new data; download your progress backup before closing the page.',
                          )
                        : undefined
                  }
                  onBack={() => navigate('skills')}
                  onPractice={start}
                  onPersonal={path => {
                    if (path !== 'all') setProgress(p => ({ ...p, path }));
                    navigate('personal');
                  }}
                  onLab={skill => {
                    setLabTool(labEffectFor(skill));
                    navigate('lab');
                  }}
                  onExam={() => goPath('exam')}
                />
              </Suspense>
            </ErrorBoundary>
          )}
          {page === 'skills' && (
            <>
              <PageHeading
                label={t(text('BECERİ HARİTAN', 'YOUR SKILL MAP'))}
                title={t(ui.skillsTitle)}
                copy={t(ui.skillsSub)}
              />
              <section className="report-entry">
                <div>
                  <span className="eyebrow">
                    {t(text('GELİŞİM VE ÇALIŞMA PLANI', 'PROGRESS AND STUDY PLAN'))}
                  </span>
                  <h2>
                    {t(text('Çalışman nasıl ilerliyor?', 'How is your practice progressing?'))}
                  </h2>
                  <p>
                    {t(
                      text(
                        'Döneme göre gelişimini, çalışma önceliklerini, teknikleri ve kaynakları gör. İstediğinde PDF raporunu indir.',
                        'See your records by period, study priorities, techniques and resources. Download your PDF report whenever you need it.',
                      ),
                    )}
                  </p>
                </div>
                <button className="button" onClick={() => navigate('report')}>
                  {t(text('Gelişim raporunu aç', 'Open progress report'))}
                  <ArrowRight size={17} />
                </button>
              </section>
              {[progress.path, ...pathIds.filter(p => p !== progress.path)].map(group => (
                <details
                  className="skill-group"
                  key={group}
                  open={group === progress.path}
                  data-testid={`skills-${group}`}
                >
                  <summary>
                    <h2 className="skill-group-title">
                      <PathIcon path={group} size={18} />
                      {t(paths[group].title)}
                    </h2>
                    <span className="skill-group-count">
                      {skillIds.filter(skill => skillPath(skill) === group).length}{' '}
                      {t(text('beceri', 'skills'))}
                      <span className="section-chevron" aria-hidden="true">
                        ⌄
                      </span>
                    </span>
                  </summary>
                  <div className="skill-grid">
                    {skillIds
                      .filter(skill => skillPath(skill) === group)
                      .map(skill => {
                        const all = independent.filter(e => getLesson(e.lessonId).skill === skill);
                        const estimate = skillEstimate(progress, skill, evidence),
                          ladder = skillLessons(skill),
                          suggested = ladder.find(l => l.level === estimate.level)!;
                        const reviewCount = reviews.filter(
                          e => getLesson(e.lessonId).skill === skill,
                        ).length;
                        // One stage, like the report: answers to other stages are different
                        // tasks and would make the figure mean nothing in particular.
                        const records = all.filter(e => e.lessonId === suggested.id).slice(-20),
                          right = records.filter(e => e.correct).length;
                        const stats = {
                          count: records.length,
                          accuracy:
                            records.length >= SCORE_MINIMUM
                              ? Math.round((right / records.length) * 100)
                              : null,
                        };
                        return (
                          <section className="skill-card" key={skill}>
                            <div className="skill-card-top">
                              <AudioLines size={21} />
                              <span>
                                {all.length > 0
                                  ? `${all.length} ${t(text('yanıt', 'answers'))}`
                                  : t(ui.notYet)}
                              </span>
                            </div>
                            <h2>{t(skillNames[skill])}</h2>
                            <p className="skill-stage">
                              {ladder.length === 1
                                ? t(text('Tek pratik aşaması', 'One practice stage'))
                                : `${t(text('Önerilen aşama', 'Suggested stage'))} ${estimate.level} / ${ladder.length} · ${t(suggested.title)}`}
                            </p>
                            <strong className="skill-score">
                              {stats.accuracy === null ? '—' : `${stats.accuracy}%`}
                              {stats.accuracy !== null && (
                                <small>
                                  {right}/{stats.count}
                                </small>
                              )}
                            </strong>
                            <div
                              className="skill-bar"
                              role="meter"
                              aria-label={t(skillNames[skill])}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={stats.accuracy ?? 0}
                              aria-valuetext={
                                stats.accuracy === null ? t(ui.notYet) : `${stats.accuracy}%`
                              }
                            >
                              <span style={{ width: `${stats.accuracy ?? 0}%` }} />
                            </div>
                            <p className="small-copy" data-testid={`skill-basis-${skill}`}>
                              {t(
                                stats.count === 0
                                  ? text(
                                      'Önerilen aşamada henüz yanıt yok.',
                                      'No answers at the suggested stage yet.',
                                    )
                                  : stats.accuracy === null
                                    ? text(
                                        `Önerilen aşamada ${stats.count} yanıt var; yüzde için en az ${SCORE_MINIMUM} gerekir.`,
                                        `${stats.count} answers at the suggested stage; a percentage needs at least ${SCORE_MINIMUM}.`,
                                      )
                                    : text(
                                        `Yalnızca önerilen aşama, tekrar hariç son ${stats.count} yanıt.`,
                                        `Suggested stage only, the last ${stats.count} answers excluding reviews.`,
                                      ),
                              )}{' '}
                              {reviewCount} {t(text('hata tekrarı', 'error reviews'))}.
                              {skill === 'eq' &&
                                ' ' +
                                  t(
                                    text(
                                      'Aşama, ders sırasındaki yerindir; EQ kulağının tek bir ölçüsü değildir. Parçaları için EQ profiline bak.',
                                      'The stage is your place in the lesson order, not a single measure of your EQ hearing. See the EQ profile for its parts.',
                                    ),
                                  )}
                            </p>
                            <button className="text-button" onClick={() => start(suggested.id)}>
                              {t(text('Bu beceriyi çalış', 'Practise this skill'))}
                              <ArrowRight size={16} />
                            </button>
                            <SkillStudyGuide skill={skill} locale={locale} />
                            {skill === 'eq' && <EqInsights evidence={evidence} locale={locale} />}
                          </section>
                        );
                      })}
                  </div>
                </details>
              ))}
              {!completedQuestions && <p className="empty-state">{t(ui.noData)}</p>}
              {progress.results.length > 0 && (
                <section className="recent-section">
                  <h2>{t(ui.recent)}</h2>
                  {progress.results
                    .slice(-5)
                    .reverse()
                    .map(result => (
                      <div className="recent-row" key={result.id}>
                        <span className="recent-icon">
                          <PathIcon path={getLesson(result.lessonId).path} size={18} />
                        </span>
                        <div>
                          <strong>{t(getLesson(result.lessonId).title)}</strong>
                          <span>
                            {new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', {
                              day: 'numeric',
                              month: 'short',
                            }).format(new Date(result.at))}
                          </span>
                        </div>
                        <span className="recent-score">
                          {result.correct}/{result.total}
                        </span>
                      </div>
                    ))}
                </section>
              )}
              <MusicHistory progress={progress} {...playerProps} />
            </>
          )}
          {page === 'profile' && (
            <>
              <PageHeading
                label={t(ui.profile)}
                title={t(ui.profileTitle)}
                copy={t(ui.profileSub)}
              />
              <div className="settings-grid">
                <section className="setting-card">
                  <h2>{t(ui.language)}</h2>
                  <div className="setting-options">
                    {(['tr', 'en'] as Locale[]).map(l => (
                      <button
                        key={l}
                        className={locale === l ? 'selected' : ''}
                        aria-pressed={locale === l}
                        onClick={() => setProgress(p => ({ ...p, locale: l }))}
                      >
                        {l === 'tr' ? 'Türkçe' : 'English'}
                        {locale === l && <Check size={17} />}
                      </button>
                    ))}
                  </div>
                  <h2>{t(ui.defaultPath)}</h2>
                  <div className="setting-options vertical">
                    {pathIds.map(p => (
                      <button
                        key={p}
                        className={progress.path === p ? 'selected' : ''}
                        aria-pressed={progress.path === p}
                        onClick={() => setProgress(v => ({ ...v, path: p }))}
                      >
                        <PathIcon path={p} size={18} />
                        {t(paths[p].title)}
                        {progress.path === p && <Check size={17} />}
                      </button>
                    ))}
                  </div>
                </section>
                <section className="setting-card">
                  <h2>
                    <Headphones size={21} />
                    {t(ui.setupTitle)}
                  </h2>
                  <p>{t(ui.setupCopy)}</p>
                  <AudioPlayer {...playerProps} question={makeQuestion('eq-1', 101, 0)} />
                  <p className="small-copy">{t(ui.headphoneSub)}</p>
                </section>
                <section className="setting-card">
                  <h2>{t(text('Klavye kısayolları', 'Keyboard shortcuts'))}</h2>
                  <p>
                    {t(
                      text(
                        'Pratikte tek tuşla çalışır: A, B, C sesi seçer; boşluk dinletir ve durdurur; rakamlar yanıt verir. Sesle yazdırma kullanıyorsan ya da tuşlara yanlışlıkla basıyorsan kapat.',
                        'Single keys work during practice: A, B, C choose the sound; space plays and stops; digits answer. Turn them off if you use speech input or press keys by accident.',
                      ),
                    )}
                  </p>
                  <div className="setting-options">
                    {[true, false].map(on => (
                      <button
                        key={String(on)}
                        data-testid={`shortcuts-${on ? 'on' : 'off'}`}
                        className={shortcuts === on ? 'selected' : ''}
                        aria-pressed={shortcuts === on}
                        onClick={() =>
                          setProgress(p => {
                            const { shortcuts: _, ...rest } = p;
                            return on ? rest : { ...rest, shortcuts: false };
                          })
                        }
                      >
                        {t(on ? text('Açık', 'On') : text('Kapalı', 'Off'))}
                        {shortcuts === on && <Check size={17} />}
                      </button>
                    ))}
                  </div>
                  <p className="small-copy">
                    {t(
                      text(
                        'Kapalıyken de her şey Tab, Enter ve ok tuşlarıyla kullanılabilir.',
                        'With them off, everything still works with Tab, Enter and the arrow keys.',
                      ),
                    )}
                  </p>
                </section>
                <section className="setting-card recording-credits">
                  <h2>{t(text('Akustik kayıtların kaynağı', 'Acoustic recording credits'))}</h2>
                  <p>
                    {t(
                      text(
                        'Piyano: Simon Dalzell / Ivy Audio. Perküsyon: Versilian Studios ve VSCO 2 Community Edition katkıcıları. Freq, bu gerçek tek nota ve vuruş kayıtlarından kısa eğitim düzenlemeleri oluşturur.',
                        'Piano: Simon Dalzell / Ivy Audio. Percussion: Versilian Studios and VSCO 2 Community Edition contributors. Freq arranges these real single-note and hit recordings into short learning examples.',
                      ),
                    )}
                  </p>
                  <div className="credit-links">
                    <a
                      href="https://github.com/sgossner/VSCO-2-CE"
                      target="_blank"
                      rel="noreferrer"
                    >
                      VSCO 2 Community Edition
                    </a>
                    <a href={`${import.meta.env.BASE_URL}audio/CC0-1.0.txt`}>CC0 1.0</a>
                    <a href={`${import.meta.env.BASE_URL}audio/recordings.json`}>
                      {t(text('Kayıt ve uyarlama bilgileri', 'Source and adaptation details'))}
                    </a>
                  </div>
                </section>
                <section className="setting-card">
                  <h2>{t(ui.install)}</h2>
                  <p>{t(ui.installCopy)}</p>
                  <Tag>{t(text('Web · iPhone · Android', 'Web · iPhone · Android'))}</Tag>
                  <p className="offline-state" role="status" data-testid="offline-state">
                    <strong>
                      {t(
                        offline.online
                          ? text('Bağlantı var.', 'You are online.')
                          : text('Şu an çevrimdışısın.', 'You are offline right now.'),
                      )}
                    </strong>{' '}
                    {t(
                      offline.state === 'ready'
                        ? text(
                            'Uygulama bu cihaza indirildi; bağlantı olmadan da açılır.',
                            'The app is stored on this device and opens without a connection.',
                          )
                        : offline.state === 'installing'
                          ? text(
                              'Çevrimdışı kullanım için dosyalar indiriliyor…',
                              'Downloading the files for offline use…',
                            )
                          : offline.state === 'update'
                            ? text(
                                'Yeni bir sürüm indirildi. Açık bütün Freq sekmeleri kapanınca kendiliğinden geçer; istersen şimdi geç.',
                                'A new version has been downloaded. It takes over once every open Freq tab is closed, or you can switch now.',
                              )
                            : offline.state === 'failed'
                              ? text(
                                  'Çevrimdışı kopya kurulamadı. Uygulama bağlantı varken çalışır; sayfayı yenileyerek yeniden deneyebilirsin.',
                                  'The offline copy could not be installed. The app works while you are online; reload the page to try again.',
                                )
                              : text(
                                  'Bu tarayıcıda çevrimdışı kopya yok; uygulama bağlantı varken çalışır.',
                                  'This browser has no offline copy; the app works while you are online.',
                                ),
                    )}
                  </p>
                  {offline.state === 'update' && (
                    <button className="button secondary" onClick={applyUpdate}>
                      {t(text('Yeni sürüme şimdi geç', 'Switch to the new version now'))}
                    </button>
                  )}
                  <p className="small-copy">
                    {t(
                      text(
                        'Mağaza uygulamaları bu sürümün kapsamına henüz dahil değil.',
                        'Store apps are not yet included in this edition.',
                      ),
                    )}
                  </p>
                </section>
                <section className="setting-card">
                  <h2>{t(ui.local)}</h2>
                  <p>{t(ui.deviceOnly)}</p>
                  <div className="data-actions">
                    <button className="button secondary" onClick={download}>
                      <Download size={17} />
                      {t(ui.export)}
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => backupInput.current?.click()}
                      disabled={importing}
                    >
                      <Upload size={17} />
                      {t(importing ? ui.importing : ui.import)}
                    </button>
                    <input
                      ref={backupInput}
                      className="sr-only"
                      type="file"
                      accept=".json,application/json"
                      aria-label={t(ui.import)}
                      tabIndex={-1}
                      onChange={importBackup}
                    />
                    <button className="text-button danger" onClick={() => setResetOpen(true)}>
                      <Trash2 size={16} />
                      {t(ui.reset)}
                    </button>
                  </div>
                  {archives.length > 0 && (
                    <div className="archive-box" data-testid="archives">
                      <p>
                        {t(
                          text(
                            `Bu tarayıcıda önceki sürümlerden ${archives.length} arşiv kaydı duruyor. Güncel ilerlemenin parçası değildir; "İlerlemeyi sıfırla" bunlara dokunmaz.`,
                            `This browser holds ${archives.length} archived record(s) from earlier versions. They are not part of current progress; “Reset progress” does not touch them.`,
                          ),
                        )}
                      </p>
                      <div className="data-actions">
                        <button className="button secondary" onClick={downloadArchives}>
                          <Download size={17} />
                          {t(text('Arşivi indir', 'Download archive'))}
                        </button>
                        <button
                          className="text-button danger"
                          onClick={() => setArchiveDelete(true)}
                        >
                          <Trash2 size={16} />
                          {t(text('Arşivi sil', 'Delete archive'))}
                        </button>
                      </div>
                    </div>
                  )}
                  {backupNotice && (
                    <p className="backup-notice" role="status">
                      {t(
                        backupNotice === ui.importSuccess && storageError
                          ? ui.importUnsaved
                          : backupNotice,
                      )}
                    </p>
                  )}
                </section>
              </div>
            </>
          )}
          {page === 'practice' && session && lesson && question && (
            <>
              <div className="practice-heading">
                <button className="text-button" onClick={() => navigate('today')}>
                  <ArrowLeft size={17} />
                  {t(ui.exit)}
                </button>
                <span>
                  {t(paths[lesson.path].short)} · {t(ui.levels)} {lesson.level}
                </span>
              </div>
              {!session.started ? (
                <div className="lesson-intro">
                  <div className="eyebrow">{t(ui.before)}</div>
                  <h1>{t(lesson.title)}</h1>
                  <p className="lead">{t(lesson.description)}</p>
                  <div className="intro-columns">
                    <div>
                      <div className="intro-section">
                        <span className="intro-step">01</span>
                        <div>
                          <h2>{t(ui.listenFor)}</h2>
                          <p>{t(lesson.learn)}</p>
                        </div>
                      </div>
                      <div className="intro-section">
                        <span className="intro-step">02</span>
                        <div>
                          <h2>{t(ui.how)}</h2>
                          <p>{t(lesson.listen)}</p>
                        </div>
                      </div>
                      <div className="intro-tip">
                        <Headphones size={21} />
                        <p>{t(lesson.tip)}</p>
                      </div>
                    </div>
                    <div className="guided-example">
                      <span className="eyebrow">{t(ui.guided)}</span>
                      <p>{t(ui.guidedCaption)}</p>
                      {guided!.music ? (
                        <MusicGuide {...playerProps} question={guided!} />
                      ) : lesson.skill === 'eq' ? (
                        <EqExamples
                          {...playerProps}
                          lesson={lesson}
                          source={session.source ?? 'studio'}
                        />
                      ) : guided!.mix ? (
                        <KnownExamples {...playerProps} question={guided!} />
                      ) : (
                        <>
                          <div className="example-answer">
                            <Check size={17} />
                            {t(ui.correctAnswer)}:{' '}
                            <strong>
                              {t(guided!.options.find(o => o.id === guided!.correct)!.label)}
                            </strong>
                          </div>
                          <AudioPlayer {...playerProps} question={guided!} />
                          <ListeningFeedback question={guided!} locale={locale} />
                        </>
                      )}
                    </div>
                  </div>
                  {usesLoop(lesson.skill) && (
                    <SourcePicker
                      value={session.source ?? 'studio'}
                      sources={sourcesFor(lesson.skill)}
                      locale={locale}
                      onChange={source => {
                        engine.stop();
                        setProgress(p => ({
                          ...p,
                          eqSource: source,
                          session:
                            p.session && !p.session.started ? { ...p.session, source } : p.session,
                        }));
                      }}
                    />
                  )}
                  <>
                    {needsStereo(lesson) && (
                      <StereoCheck
                        engine={engine}
                        locale={locale}
                        ready={stereoReady}
                        onReady={setStereoReady}
                      />
                    )}
                  </>
                  <div className="intro-start-bar">
                    <button
                      className="button large intro-start"
                      disabled={needsStereo(lesson) && !stereoReady}
                      onClick={() => {
                        engine.stop();
                        setProgress(p => ({
                          ...p,
                          session: p.session ? { ...p.session, started: true } : null,
                        }));
                      }}
                    >
                      {t(ui.begin)}
                      <ArrowRight size={18} />
                    </button>
                    <p className="small-copy">
                      {t(ui.questions)} · {t(ui.minutes)} · {t(ui.saved)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="exercise">
                  <div className="question-progress">
                    <span>
                      {t(ui.question)} <strong>{session.index + 1}</strong> / {ROUND_COUNT}
                    </span>
                    <span>{t(lesson.title)}</span>
                  </div>
                  <div className="round-bars" aria-hidden="true">
                    {Array.from({ length: ROUND_COUNT }, (_, i) => (
                      <i
                        key={i}
                        className={
                          i < session.index ? 'done' : i === session.index ? 'current' : ''
                        }
                      />
                    ))}
                  </div>
                  <h1>
                    {t(
                      question.music?.prompt ??
                        question.mix?.prompt ??
                        question.prompt ??
                        (question.kind === 'loudness'
                          ? ui.loudnessQuestion
                          : question.kind === 'rhythm'
                            ? ui.rhythmQuestion
                            : question.kind === 'eq'
                              ? ui.mixQuestion
                              : question.kind === 'direction'
                                ? ui.directionQuestion
                                : question.kind === 'interval'
                                  ? ui.intervalQuestion
                                  : question.kind === 'chord'
                                    ? ui.chordQuestion
                                    : ui.memoryQuestion),
                    )}
                  </h1>
                  <p className="exercise-sub">
                    {t(question.music?.focus ?? question.mix?.focus ?? lesson.listen)}
                  </p>
                  {usesLoop(question.kind) && (
                    <p className="exercise-source">
                      <AudioLines size={14} />
                      {t(eqSources[session.source ?? 'studio'].title)}
                    </p>
                  )}
                  <AudioPlayer
                    key={`audio-${session.id}-${session.index}`}
                    {...playerProps}
                    question={playbackQuestion!}
                    reviewed={!!answered}
                    live={!answered && eqUsesMatching(question)}
                    heard={heard}
                    onHeard={v => setHeard(h => (h.includes(v) ? h : [...h, v]))}
                  />
                  <div className="answer-heading">
                    <span className="eyebrow">
                      {t(
                        question.music?.response === 'tap'
                          ? text('RİTMİ TEKRAR ET', 'REPRODUCE THE RHYTHM')
                          : question.music && question.music.response !== 'choice'
                            ? text('YANITINI YAZ', 'WRITE YOUR ANSWER')
                            : text('YANITINI SEÇ', 'CHOOSE YOUR ANSWER'),
                      )}
                    </span>
                    {!canAnswer && !answered && (
                      <span className="listen-first">
                        {t(
                          question.kind === 'rhythm' || question.kind === 'memory'
                            ? ui.listenBoth
                            : ui.answerFirst,
                        )}
                      </span>
                    )}
                  </div>
                  {question.music && question.music.response !== 'choice' ? (
                    !answered &&
                    (question.music.response === 'tap' ? (
                      <TapRecorder
                        key={`tap-${session.id}-${session.index}`}
                        question={question}
                        engine={engine}
                        locale={locale}
                        enabled={canAnswer}
                        onSubmit={chooseAnswer}
                      />
                    ) : (
                      <MusicAnswerEditor
                        key={`entry-${session.id}-${session.index}`}
                        question={question}
                        engine={engine}
                        locale={locale}
                        enabled={canAnswer}
                        onSubmit={chooseAnswer}
                      />
                    ))
                  ) : (
                    <AnswerOptions
                      // A new question starts from a clean control: nothing chosen, no C.
                      key={`${session?.id}:${session?.index}`}
                      question={question}
                      locale={locale}
                      choice={answered?.choice}
                      reveal={!!answered}
                      disabled={!!answered || !canAnswer}
                      onChoose={chooseAnswer}
                      onPreview={setPreview}
                    />
                  )}
                  {answered && (
                    <div
                      ref={feedbackRef}
                      tabIndex={-1}
                      className={`feedback ${answered.correct ? 'correct' : 'review'}`}
                      role="status"
                    >
                      <div className="feedback-heading">
                        {answered.correct ? <Check size={22} /> : <Headphones size={22} />}
                        <h2>{t(answered.correct ? ui.correct : ui.incorrect)}</h2>
                      </div>
                      <p>
                        <strong>
                          {t(ui.correctAnswer)}: {answerLabel(question, question.correct, locale)}.
                        </strong>{' '}
                        {t(question.explanation)}
                      </p>
                      {eqNearMiss(question, answered.choice) && (
                        <p className="near-miss">{t(eqNearMiss(question, answered.choice)!)}</p>
                      )}
                      {question.kind === 'eq' && (
                        <EqCurve question={playbackQuestion!} locale={locale} />
                      )}
                      <MixFeedback question={playbackQuestion!} engine={engine} locale={locale} />
                      <ListeningFeedback question={question} locale={locale} />
                      <MusicFeedback question={question} choice={answered.choice} locale={locale} />
                      <p className="feedback-replay">
                        {t(
                          question.music
                            ? text(
                                'Soruyu ve yanıtını yukarıdaki düğmelerle tekrar dinleyebilirsin. Dikte ve tekrar ayrıntıları aşağıdaki karşılaştırmada.',
                                'Replay the question and your answer with the buttons above. See the comparison for dictation and reproduction details.',
                              )
                            : playbackQuestion?.mix?.comparison
                              ? text(
                                  'A referansı, B doğru ayarı, C seçtiğin ayarı çalar. Üçünü aynı noktada değiştirerek farkı tekrar dinle.',
                                  'A plays the reference, B the correct setting, and C your choice. Switch between them at the same timeline position to hear the difference again.',
                                )
                              : playbackQuestion?.comparisonFrequency
                                ? ui.compareCopy
                                : text(
                                    'Yukarıdaki Dinle ve A/B düğmeleriyle örneği tekrar duyabilirsin.',
                                    'Use the Listen and A/B buttons above to hear the example again.',
                                  ),
                        )}
                      </p>
                      <button className="button" onClick={nextQuestion}>
                        {t(session.index === ROUND_COUNT - 1 ? ui.finish : ui.nextQuestion)}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  )}
                  <p className="keyboard-note" hidden={!shortcuts}>
                    {t(
                      question.music?.response === 'choice'
                        ? text(
                            'Klavye: boşluk dinle/durdur · seçeneklerdeki rakamlar yanıtlar',
                            'Keyboard: space listen/stop · answer using the option numbers',
                          )
                        : question.music
                          ? text(
                              'Ritim tekrarı: boşluk tuşu veya dokunma. Dikte: yukarıdaki giriş araçlarını kullan.',
                              'Rhythm reproduction: space or tap. Dictation: use the entry controls above.',
                            )
                          : playbackQuestion?.comparisonFrequency ||
                              playbackQuestion?.mix?.comparison
                            ? ui.shortcutCompare
                            : hasNumberShortcuts(question)
                              ? ui.shortcut
                              : ui.shortcutGrid,
                    )}
                  </p>
                </div>
              )}
            </>
          )}
          {page === 'summary' && progress.results.length > 0 && (
            <div className="summary">
              <div className="summary-icon">
                <Check size={36} />
              </div>
              <div className="eyebrow">{t(text('PRATİK TAMAMLANDI', 'PRACTICE COMPLETE'))}</div>
              <h1>{t(ui.complete)}</h1>
              <p className="lead">{t(ui.completeSub)}</p>
              <div className="summary-score">
                <strong>
                  {progress.results.at(-1)!.correct}
                  <span> / {ROUND_COUNT}</span>
                </strong>
                <span>{t(ui.accuracy)}</span>
              </div>
              <h2>{t(getLesson(progress.results.at(-1)!.lessonId).title)}</h2>
              <p className="summary-tip">{t(getLesson(progress.results.at(-1)!.lessonId).tip)}</p>
              <div className="summary-actions">
                <button className="button" onClick={() => start(progress.results.at(-1)!.lessonId)}>
                  {t(ui.again)}
                  <ArrowRight size={18} />
                </button>
                <button className="button secondary" onClick={() => navigate('today')}>
                  {t(ui.home)}
                </button>
                <button className="text-button" onClick={() => navigate('report')}>
                  {t(text('Gelişimini incele', 'Review your progress'))}
                  <ArrowRight size={16} />
                </button>
              </div>
              <p className="small-copy">{t(ui.saved)}</p>
            </div>
          )}
          <footer className="page-footer">
            <span>
              freq. <span className="footer-divider">/</span>{' '}
              {t(text('Biraz daha dikkatli dinle.', 'Listen a little closer.'))}
            </span>
            <span>{t(ui.early)}</span>
          </footer>
        </main>
      </div>
      <nav
        className="mobile-nav"
        inert={modalOpen}
        aria-label={t(text('Mobil gezinme', 'Mobile navigation'))}
      >
        {nav.map(({ page: p, icon: Icon, label }) => (
          <button
            key={p}
            className={activeNav === p ? 'active' : ''}
            onClick={() => navigate(p)}
            aria-current={activeNav === p ? 'page' : undefined}
            aria-label={t(label)}
          >
            <Icon size={21} />
            <span>{t(label)}</span>
          </button>
        ))}
      </nav>
      {storageDecision && (
        <Modal
          title={t(text('Kaydı koruyarak devam et', 'Continue while protecting your records'))}
          copy={t(
            storageProblem?.kind === 'update'
              ? text(
                  'Devam edersen yeniden kurulan derslerin eski yanıtları kayıttan ayrılır ve güncel geçmiş diske yazılır. Eski kaydın bu tarayıcıda kopyası kalmaz; önce orijinal kaydı indir.',
                  'Continuing removes the old answers to rebuilt lessons from the record and writes the current history to disk. No copy of the earlier record stays in this browser; download the original first.',
                )
              : storageDecision === 'recover'
                ? text(
                    'Okunamayan bölümler kurtarılan kopyada bulunmaz. Önce orijinal kaydı ve bu sekmenin verisini indir. Devam edersen kurtarılan kopya diske yazılır.',
                    'Unreadable sections are absent from the recovered copy. Download the original and this tab’s records first. Continuing writes the recovered copy to disk.',
                  )
                : text(
                    'Sayfa yeniden açılır; bu sekmede henüz kaydedilmemiş yanıtlar kapatılır. Önce bu sekmenin verisini indir.',
                    'The page will reload and close this tab’s unsaved answers. Download this tab’s records first.',
                  ),
          )}
          cancel={t(ui.cancel)}
          action={t(text('Devam et', 'Continue'))}
          onCancel={() => setStorageDecision(null)}
          onAction={() => {
            if (storageDecision === 'recover') {
              acceptRecovery();
              setStorageDecision(null);
            } else window.location.reload();
          }}
        />
      )}
      {resetOpen && (
        <Modal
          title={t(ui.resetTitle)}
          copy={t(ui.resetCopy)}
          cancel={t(ui.cancel)}
          action={t(ui.delete)}
          onCancel={() => setResetOpen(false)}
          onAction={() => {
            engine.stop();
            clearHistory();
            setResetOpen(false);
            navigate('today');
          }}
        >
          <button className="text-button" onClick={download}>
            <Download size={16} />
            {t(ui.export)}
          </button>
          {archives.length > 0 && (
            <p className="small-copy">
              {t(
                text(
                  'Bu yedek güncel ilerlemeni içerir. Önceki sürümlerin arşivi ayrıdır; sıfırlama ona dokunmaz.',
                  'This backup holds your current progress. The archive of earlier versions is separate; a reset does not touch it.',
                ),
              )}
            </p>
          )}
        </Modal>
      )}
      {archiveDelete && (
        <Modal
          title={t(
            text('Eski sürüm arşivi silinsin mi?', 'Delete the archive of earlier versions?'),
          )}
          copy={t(
            text(
              'Arşiv, güncellemelerden önceki kayıtlarının bu tarayıcıdaki tek kopyasıdır. Silmeden önce indir; silinen arşiv geri getirilemez.',
              'The archive is the only copy in this browser of your records from before the updates. Download it first; a deleted archive cannot be brought back.',
            ),
          )}
          cancel={t(ui.cancel)}
          action={t(ui.delete)}
          onCancel={() => setArchiveDelete(false)}
          onAction={() => {
            deleteArchives();
            setArchiveDelete(false);
          }}
        >
          <button className="text-button" onClick={downloadArchives}>
            <Download size={16} />
            {t(text('Arşivi indir', 'Download archive'))}
          </button>
        </Modal>
      )}
      {pendingLesson && (
        <Modal
          title={t(text('Yarım kalan bir pratiğin var.', 'You have an unfinished practice.'))}
          copy={t(
            text(
              'Yeni pratiğe geçersen bu oturum kapanır. Şimdiye kadar yanıtladığın sorular beceri kayıtlarında kalır.',
              'Starting a new practice closes this session. Answers already given remain in your skill records.',
            ),
          )}
          cancel={t(ui.resume)}
          action={t(text('Yeni pratiğe geç', 'Start the new practice'))}
          onCancel={() => {
            setPendingLesson(null);
            navigate('practice');
          }}
          onAction={() => {
            setProgress(p => ({ ...p, session: newSession(pendingLesson, p.eqSource) }));
            setPendingLesson(null);
            navigate('practice');
          }}
        />
      )}
      {pendingBackup && (
        <Modal
          title={t(ui.importTitle)}
          copy={t(ui.importCopy)}
          cancel={t(ui.cancel)}
          action={t(ui.importAction)}
          onCancel={() => setPendingBackup(null)}
          onAction={restoreBackup}
        >
          <div className="backup-summary">
            <strong>{pendingBackup.filename}</strong>
            <span>
              {pendingBackup.progress.attempts.length} {t(ui.total).toLocaleLowerCase(locale)} ·{' '}
              {pendingBackup.progress.results.length} {t(ui.sessions).toLocaleLowerCase(locale)}
            </span>
            {pendingBackup.progress.exam && (
              <span>
                {pendingBackup.progress.exam.results.length} {t(text('deneme', 'mocks'))} ·{' '}
                {pendingBackup.progress.exam.rehearsals.length}{' '}
                {t(text('prova notu', 'rehearsal notes'))}
                {pendingBackup.progress.exam.active && (
                  <>
                    {' '}
                    ·{' '}
                    {t(
                      text(
                        'Süreli deneme de geri alınacak; son teslim zamanı korunur.',
                        'The timed mock will also restore with its original deadline.',
                      ),
                    )}
                  </>
                )}
              </span>
            )}
            {pendingBackup.progress.personal && (
              <span>
                {pendingBackup.progress.personal.results.length}{' '}
                {t(text('kişisel oturum', 'personal sessions'))}
                {pendingBackup.progress.personal.active && (
                  <>
                    {' '}
                    ·{' '}
                    {t(
                      text(
                        'Yarım kişisel çalışma geri alınacak.',
                        'The unfinished personal session will also restore.',
                      ),
                    )}
                  </>
                )}
              </span>
            )}
            {pendingBackup.retired > 0 && (
              <span data-testid="import-retired">
                {t(
                  text(
                    `Bu yedekteki ${pendingBackup.retired} yanıt, sonradan yeniden kurulan derslere verilmiş. Artık aynı sesi anlatmadıkları için içe alınmayacak; geri kalanı alınır.`,
                    `${pendingBackup.retired} answers in this backup were given to lessons that have since been rebuilt. They no longer describe the same sound and will not be imported; the rest will.`,
                  ),
                )}
              </span>
            )}
            {((pendingBackup.progress.session &&
              progress.session &&
              pendingBackup.progress.session.id !== progress.session.id) ||
              (pendingBackup.progress.personal?.active &&
                progress.personal?.active &&
                pendingBackup.progress.personal.active.id !== progress.personal.active.id) ||
              (pendingBackup.progress.exam?.active &&
                progress.exam?.active &&
                pendingBackup.progress.exam.active.id !== progress.exam.active.id)) && (
              <span data-testid="import-session-note">
                {t(
                  text(
                    'Bu cihazda yarım bir çalışman var; o korunur. Yedekteki yarım çalışma kapatılır, verilmiş yanıtları geçmişe eklenir.',
                    'You have unfinished work on this device; it is kept. The backup’s unfinished work is closed and its answers are added to your history.',
                  ),
                )}
              </span>
            )}
            <span>
              {t(
                text(
                  'Geçmiş kayıtlar oturum sayısına göre silinmeden birleştirilir.',
                  'History is merged without deleting records by session count.',
                ),
              )}
            </span>
          </div>
        </Modal>
      )}
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={16} className="diagonal-arrow" />;
}
function PageHeading({ label, title, copy }: { label: string; title: string; copy: string }) {
  return (
    <div className="page-heading">
      <div className="eyebrow">{label}</div>
      <h1>{title}</h1>
      <p className="lead">{copy}</p>
    </div>
  );
}
