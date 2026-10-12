import { ExternalLink } from 'lucide-react';
import { text, tx, type Locale, type SkillId, type Text } from '../content';
import { studyGuides, type LearningResource } from '../report-resources';
import {
  resourceCost,
  resourceKind,
  resourceLanguage,
  resourcesForSkill,
} from '../report-presentation';

export function Resource({ resource: r, locale }: { resource: LearningResource; locale: Locale }) {
  const t = (v: Text) => tx(v, locale);
  return (
    <li className="report-resource">
      <div>
        <span className="tag">{t(resourceKind(r))}</span>
        <span>
          {t(resourceCost(r))} · {t(resourceLanguage(r))}
        </span>
      </div>
      <a href={r.url} target="_blank" rel="noreferrer">
        {t(r.title)}
        <ExternalLink size={14} aria-hidden="true" />
      </a>
      <p>{t(r.description)}</p>
      <small>
        {r.author} · {t(text('Kaynak kontrolü', 'Source checked'))}: {r.sourceChecked}
      </small>
      {r.note && (
        <details>
          <summary>{t(text('Erişim ve kapsam bilgisi', 'Access and scope information'))}</summary>
          <p>{t(r.note)}</p>
        </details>
      )}
    </li>
  );
}

export function SkillGuideContent({ skill, locale }: { skill: SkillId; locale: Locale }) {
  const t = (v: Text) => tx(v, locale),
    guide = studyGuides[skill];
  return (
    <>
      <p>
        <strong>{t(text('Dinleme ipucu', 'Listening cue'))}:</strong> {t(guide.cue)}
      </p>
      <ol>
        {guide.steps.map((step, i) => (
          <li key={i}>{t(step)}</li>
        ))}
      </ol>
      <p>{t(guide.session)}</p>
      <p>
        <strong>{t(text('Gerçek bağlamda dene', 'Try a real context'))}:</strong>{' '}
        {t(guide.transfer)}
      </p>
      <p>
        <strong>{t(text('Yeni örnekle kontrol', 'Fresh-example check'))}:</strong>{' '}
        {t(guide.freshCheck)}
      </p>
      <p className="small-copy">
        {t(
          text(
            'Türkçe öncelikli; uygun kaynak yoksa İngilizce. Ücretli kitap isteğe bağlıdır.',
            'Turkish first, with English alternatives where needed. Paid books are optional.',
          ),
        )}
      </p>
      <ul className="report-resources">
        {resourcesForSkill(skill).map(r => (
          <Resource key={r.id} resource={r} locale={locale} />
        ))}
      </ul>
    </>
  );
}
