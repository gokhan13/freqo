import { lazy, Suspense, useState } from 'react';
import { text, tx, type Locale, type SkillId } from '../content';

const SkillGuideContent = lazy(() => import('./StudyResources').then(module => ({ default: module.SkillGuideContent })));

export function SkillStudyGuide({ skill, locale }: { skill: SkillId; locale: Locale }) {
  const [open, setOpen] = useState(false);
  return <details className="skill-study-guide" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{tx(text('Nasıl çalışmalıyım?', 'How should I practise?'), locale)}</summary>
    {open && <Suspense fallback={<p role="status">{tx(text('Çalışma yöntemi yükleniyor…', 'Loading the study method…'), locale)}</p>}><SkillGuideContent skill={skill} locale={locale} /></Suspense>}
  </details>;
}
