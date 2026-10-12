import { ArrowRight } from 'lucide-react';
import { lessonGroups, lessons, skillNames, text, tx, ui, type Locale, type PathId } from '../content';
import type { Progress } from '../model';

export function LessonList({ path, progress, locale, onStart }: { path: PathId; progress: Progress; locale: Locale; onStart: (id: string) => void }) {
  const t = (value: Parameters<typeof tx>[0]) => tx(value, locale);
  return <div className="lesson-sections">{lessonGroups[path].map(group => <details key={group.id} className="lesson-section" open={path === 'exam' || ['eq', 'loudness', 'pitch', 'rhythm'].includes(group.id) || group.skills.includes(lessons.find(l => l.id === progress.session?.lessonId)?.skill as typeof group.skills[number])}>
    <summary className="lesson-section-heading"><h2>{t(group.title)}</h2><span>{lessons.filter(l => l.path === path && group.skills.includes(l.skill)).length} {t(text('pratik', 'practices'))}<span className="section-chevron" aria-hidden="true">⌄</span></span></summary>
    <div className="lesson-list">{lessons.filter(l => l.path === path && group.skills.includes(l.skill)).map(lesson => {
      const attempts = progress.attempts.filter(a => a.lessonId === lesson.id);
      return <div className="lesson-row" data-testid={`lesson-${lesson.id}`} key={lesson.id}>
        <span className="level-number" aria-hidden="true">0{lesson.level}</span>
        <div className="lesson-row-copy"><span className="eyebrow">{group.skills.length > 1 && <>{t(skillNames[lesson.skill])} · </>}{t(ui.levels)} {lesson.level}</span><h3>{t(lesson.title)}</h3><p>{t(lesson.description)}</p>
          {attempts.length > 0 && <span className="attempt-count">{attempts.length} {t(text('yanıt', 'answers'))} · {Math.round(attempts.filter(a => a.correct).length / attempts.length * 100)}%</span>}
        </div>
        <button className="button secondary" onClick={() => onStart(lesson.id)}>{t(progress.session?.lessonId === lesson.id ? ui.resume : ui.start)}<ArrowRight size={18} /></button>
      </div>;
    })}</div>
  </details>)}</div>;
}
