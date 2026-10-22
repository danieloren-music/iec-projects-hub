'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckSquare,
  FolderKanban,
  Layers3,
} from 'lucide-react';
import { api } from '@/api';
import { useApiResource } from '@/api/use-api-resource';
import { ApiErrorState, ApiLoading } from '@/components/api-state';
import { EmptyState, useAppUi } from '@/components/app-shell';
import { CreateProjectDialog } from '@/components/create-project-dialog';

export default function Home() {
  const { isRtl } = useAppUi();
  const loadSummary = useCallback(() => api.getSummary(), []);
  const loadProjects = useCallback(() => api.getProjects(), []);
  const loadRequirements = useCallback(
    () => api.getInfrastructureRequirements(),
    [],
  );
  const summary = useApiResource(loadSummary);
  const projects = useApiResource(loadProjects);
  const requirements = useApiResource(loadRequirements);

  const metrics = [
    {
      icon: FolderKanban,
      en: 'Projects',
      he: 'פרויקטים',
      value:
        summary.state.status === 'success'
          ? String(summary.state.data.projectCount)
          : '—',
      hint: isRtl ? 'מספר הרשומות מממשק ה-API' : 'Count returned by the API',
    },
    {
      icon: AlertCircle,
      en: 'Needs attention',
      he: 'דורש תשומת לב',
      value: '—',
      hint: isRtl ? 'מוסכמות הסטטוס לא אושרו' : 'Status conventions are unconfirmed',
    },
    {
      icon: CheckSquare,
      en: 'Tasks',
      he: 'משימות',
      value:
        summary.state.status === 'success'
          ? String(summary.state.data.taskCount)
          : '—',
      hint: isRtl ? 'מספר המשימות בתיק' : 'Tasks across the portfolio',
    },
    {
      icon: Layers3,
      en: 'Infrastructure',
      he: 'תשתיות',
      value:
        summary.state.status === 'success'
          ? String(summary.state.data.infrastructureRequirementCount)
          : '—',
      hint: isRtl ? 'מספר הרשומות מממשק ה-API' : 'Count returned by the API',
    },
  ];

  return (
    <>
      <section className="hero">
        <span className="hero__eyebrow">{isRtl ? 'תיק פרויקטים · נתונים חיים בלבד' : 'Portfolio workspace · live data only'}</span>
        <h1>{isRtl ? 'תיק הפרויקטים במבט אחד' : 'Portfolio at a glance'}</h1>
        <p>
          {isRtl
            ? 'תצוגה ממוקדת של הפרויקטים, העבודה והדרישות — ללא נתוני הדגמה או הנחות לגבי סטטוסים.'
            : 'A focused view of projects, work, and requirements—with no demo records or assumed status values.'}
        </p>
        <div className="hero__actions">
          <Link href="/projects" className="button">
            {isRtl ? 'עיון בפרויקטים' : 'Browse projects'} <ArrowUpRight size={15} />
          </Link>
          <Link href="/tasks" className="button--quiet">
            {isRtl ? 'פתיחת משימות' : 'View tasks'}
          </Link>
          <CreateProjectDialog
            onCreated={() => {
              projects.retry();
              summary.retry();
            }}
          />
        </div>
      </section>

      <section className="kpi-grid" aria-label={isRtl ? 'סיכום תיק' : 'Portfolio summary'}>
        {metrics.map(({ icon: Icon, en, he, value, hint }) => (
          <article className="kpi-card" key={en}>
            <div className="kpi-card__label">
              <span className="kpi-card__icon"><Icon size={15} /></span>
              {isRtl ? he : en}
            </div>
            <strong className="kpi-card__value">{value}</strong>
            <span className="kpi-card__hint">{hint}</span>
          </article>
        ))}
      </section>

      {summary.state.status === 'loading' && (
        <ApiLoading label={isRtl ? 'סיכום תיק הפרויקטים' : 'portfolio summary'} />
      )}
      {summary.state.status === 'error' && (
        <ApiErrorState error={summary.state.error} onRetry={summary.retry} />
      )}

      <section className="dashboard-grid">
        <article className="surface-card">
          <div className="card-heading">
            <h2>{isRtl ? 'תמונת מצב פרויקטים' : 'Project pulse'}</h2>
            <Link className="section-title__hint" href="/projects">{isRtl ? 'לכל הפרויקטים' : 'View projects'} →</Link>
          </div>
          {projects.state.status === 'loading' && <ApiLoading label="projects" />}
          {projects.state.status === 'error' && (
            <ApiErrorState error={projects.state.error} onRetry={projects.retry} />
          )}
          {projects.state.status === 'success' &&
            (projects.state.data.length === 0 ? (
              <EmptyState
                title="No project records"
                titleHe="אין רשומות פרויקט"
                description="The API returned an empty project list."
                descriptionHe="ממשק ה-API החזיר רשימת פרויקטים ריקה."
              />
            ) : (
              <ul className="data-list">
                {projects.state.data.slice(0, 5).map((project, index) => (
                  <li key={String(project.id ?? `project-${index}`)}>
                    {project.id == null ? (
                      <span>{project.name || project.code || 'Project'}</span>
                    ) : (
                      <Link href={`/projects/${encodeURIComponent(String(project.id))}`}>
                        {project.name || project.code || String(project.id)}
                      </Link>
                    )}
                    {project.overall_status && <span>{project.overall_status}</span>}
                  </li>
                ))}
              </ul>
            ))}
        </article>
        <article className="surface-card">
          <div className="card-heading">
            <h2>{isRtl ? 'עבודת תשתיות' : 'Infrastructure demand'}</h2>
            <Link className="section-title__hint" href="/infrastructure">{isRtl ? 'לתשתיות' : 'Open view'} →</Link>
          </div>
          {requirements.state.status === 'loading' && <ApiLoading label="infrastructure requirements" />}
          {requirements.state.status === 'error' && (
            <ApiErrorState error={requirements.state.error} onRetry={requirements.retry} />
          )}
          {requirements.state.status === 'success' &&
            (requirements.state.data.length === 0 ? (
              <EmptyState
                icon={Layers3}
                title="No infrastructure records"
                titleHe="אין רשומות תשתית"
                description="The API returned an empty infrastructure-requirements list."
                descriptionHe="ממשק ה-API החזיר רשימת דרישות תשתית ריקה."
              />
            ) : (
              <ul className="data-list">
                {requirements.state.data.slice(0, 5).map((requirement, index) => (
                  <li key={String(requirement.id ?? `requirement-${index}`)}>
                    <span>{requirement.title || requirement.category || String(requirement.id ?? 'Requirement')}</span>
                    {requirement.status && <span>{requirement.status}</span>}
                  </li>
                ))}
              </ul>
            ))}
        </article>
      </section>
    </>
  );
}
