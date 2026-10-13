import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  lessonGroups,
  lessons,
  skillNames,
  text,
  tx,
  ui,
  type Locale,
  type PathId,
} from '../content';
import type { Progress } from '../model';
import { skillEstimate, skillLessons, studyEvidence } from '../personal-model';

// Ladders longer than this get a shortcut to the suggested stage above the list.
const LONG_LADDER = 5;

export function LessonList({
  path,
  progress,
  locale,
  onStart,
}: {
  path: PathId;
  progress: Progress;
  locale: Locale;
  onStart: (id: string) => void;
}) {
  const t = (value: Parameters<typeof tx>[0]) => tx(value, locale);
  // Where the learner stands on each ladder, so a long list has a "you are here".
  const suggested = useMemo(() => {
    const evidence = studyEvidence(progress);
    return new Set(
      lessonGroups[path]
        .flatMap(group => group.skills)
        .filter(skill => skillLessons(skill).length > 1)
        .map(skill => {
          const level = skillEstimate(progress, skill, evidence).level;
          return skillLessons(skill).find(l => l.level === level)?.id;
        }),
    );
  }, [path, progress]);
  return (
    <div className="lesson-sections">
      {lessonGroups[path].map(group => (
        <details
          key={group.id}
          className="lesson-section"
          open={
            path === 'exam' ||
            ['eq', 'loudness', 'pitch', 'rhythm'].includes(group.id) ||
            group.skills.includes(
              lessons.find(l => l.id === progress.session?.lessonId)
                ?.skill as (typeof group.skills)[number],
            )
          }
        >
          <summary className="lesson-section-heading">
            <h2>{t(group.title)}</h2>
            <span>
              {lessons.filter(l => l.path === path && group.skills.includes(l.skill)).length}{' '}
              {t(text('pratik', 'practices'))}
              <span className="section-chevron" aria-hidden="true">
                ⌄
              </span>
            </span>
          </summary>
          <div className="lesson-list">
            {/* A long ladder opens on where the learner stands, not on its first rung. */}
            {group.skills.map(skill => {
              const ladder = skillLessons(skill),
                here = ladder.find(l => suggested.has(l.id));
              return here && ladder.length > LONG_LADDER ? (
                <div className="lesson-here" data-testid={`here-${skill}`} key={skill}>
                  <div>
                    <span className="eyebrow">
                      {t(text('Önerilen aşama', 'Suggested stage'))} {here.level} / {ladder.length}
                    </span>
                    <strong>{t(here.title)}</strong>
                  </div>
                  <button className="button" onClick={() => onStart(here.id)}>
                    {t(progress.session?.lessonId === here.id ? ui.resume : ui.start)}
                    <ArrowRight size={18} />
                  </button>
                </div>
              ) : null;
            })}
            {lessons
              .filter(l => l.path === path && group.skills.includes(l.skill))
              .map(lesson => {
                const attempts = progress.attempts.filter(a => a.lessonId === lesson.id);
                return (
                  <div className="lesson-row" data-testid={`lesson-${lesson.id}`} key={lesson.id}>
                    <span className="level-number" aria-hidden="true">
                      {String(lesson.level).padStart(2, '0')}
                    </span>
                    <div className="lesson-row-copy">
                      <span className="eyebrow">
                        {group.skills.length > 1 && <>{t(skillNames[lesson.skill])} · </>}
                        {t(ui.levels)} {lesson.level}
                        {suggested.has(lesson.id) && (
                          <span className="lesson-suggested">
                            {t(text('Önerilen aşama', 'Suggested stage'))}
                          </span>
                        )}
                      </span>
                      <h3>{t(lesson.title)}</h3>
                      <p>{t(lesson.description)}</p>
                      {attempts.length > 0 && (
                        <span className="attempt-count">
                          {attempts.length} {t(text('yanıt', 'answers'))}
                          {attempts.length >= 5 &&
                            ` · ${Math.round(
                              (attempts.filter(a => a.correct).length / attempts.length) * 100,
                            )}%`}
                        </span>
                      )}
                    </div>
                    <button className="button secondary" onClick={() => onStart(lesson.id)}>
                      {t(progress.session?.lessonId === lesson.id ? ui.resume : ui.start)}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                );
              })}
          </div>
        </details>
      ))}
    </div>
  );
}
