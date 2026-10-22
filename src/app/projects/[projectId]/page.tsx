'use client';

import { Suspense } from 'react';
import { useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Layers3 } from 'lucide-react';
import { api } from '@/api';
import { useApiResource } from '@/api/use-api-resource';
import { ApiErrorState, ApiLoading } from '@/components/api-state';
import { EmptyState, PageHeading, useAppUi } from '@/components/app-shell';
import { ProjectAttachments } from '@/components/project-attachments';
import { TaskBoard } from '@/components/task-board';

function ProjectWorkspaceContent() {
  const { isRtl } = useAppUi();
  const { projectId } = useParams<{ projectId: string }>();
  const loadProject = useCallback(() => api.getProject(projectId), [projectId]);
  const projectResource = useApiResource(loadProject);

  return (
    <>
      <PageHeading
        eyebrow={isRtl ? 'פרויקט' : 'Project workspace'}
        title="Project workspace"
        titleHe="סביבת פרויקט"
        description="Project details, related work, and infrastructure will appear here when available from the application API."
        descriptionHe="פרטי הפרויקט, העבודה הקשורה ודרישות התשתית יוצגו כאן לאחר שיהיו זמינים דרך ממשק ה-API."
      />
      {projectResource.state.status === 'loading' && <ApiLoading label="project details" />}
      {projectResource.state.status === 'error' && (
        <ApiErrorState
          error={projectResource.state.error}
          onRetry={projectResource.retry}
        />
      )}
      {projectResource.state.status === 'success' &&
        (projectResource.state.data === null ? (
          <section className="surface-card" role="status">
            <h2>{isRtl ? 'הפרויקט לא נמצא' : 'Project not found'}</h2>
            <p>{isRtl ? 'ממשק ה-API לא החזיר פרויקט עבור המזהה ' : 'The API returned no project for identifier '}<code>{projectId}</code>.</p>
          </section>
        ) : (
          <section className="surface-card" aria-label={isRtl ? 'סיכום פרויקט' : 'Project summary'}>
            <div className="card-heading">
              <h2>{projectResource.state.data.name || (isRtl ? 'סיכום' : 'Summary')}</h2>
              <span className="card-heading__hint">{isRtl ? 'מזהה' : 'ID'}: <code>{String(projectResource.state.data.id ?? projectId)}</code></span>
            </div>
            <dl className="project-details">
              {[
                [isRtl ? 'קוד' : 'Code', projectResource.state.data.code],
                [isRtl ? 'סקירה' : 'Overview', projectResource.state.data.overview],
                [isRtl ? 'אחראי יישום' : 'Implementation owner', projectResource.state.data.business_pm],
                [isRtl ? 'אחראי פרויקט תשתיות' : 'Infrastructure project owner', projectResource.state.data.infra_lead],
                [isRtl ? 'מצב כולל' : 'Overall status', projectResource.state.data.overall_status],
                [isRtl ? 'מצב RAG' : 'RAG status', projectResource.state.data.rag_status],
                [isRtl ? 'יעד עלייה לאוויר' : 'Target go-live', projectResource.state.data.target_go_live],
              ].map(([label, value]) => (
                <div className="project-details__item" key={label}>
                  <dt>{label}</dt>
                  <dd>{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      <div className="workspace-grid" style={{ marginTop: 15 }}>
        <TaskBoard projectId={projectId} />
        <section className="surface-card">
          <div className="card-heading">
            <h2>{isRtl ? 'תשתיות' : 'Infrastructure'}</h2>
            <span className="card-heading__hint">{isRtl ? 'נתוני פרויקט' : 'Project API data'}</span>
          </div>
          {projectResource.state.status === 'loading' && <ApiLoading label="project infrastructure" />}
          {projectResource.state.status === 'error' && (
            <ApiErrorState error={projectResource.state.error} onRetry={projectResource.retry} />
          )}
          {projectResource.state.status === 'success' && (
            projectResource.state.data?.infra_requirements?.length ? (
              <ul className="data-list">
                {projectResource.state.data.infra_requirements.map((requirement, index) => (
                  <li key={String(requirement.id ?? `requirement-${index}`)}>
                    <span>{requirement.title || requirement.category || String(requirement.id ?? 'Requirement')}</span>
                    {requirement.status && <span>{requirement.status}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Layers3}
                title="No infrastructure records"
                titleHe="אין רשומות תשתית"
                description="The project API response contains no related infrastructure requirements."
                descriptionHe="תגובת ממשק ה-API של הפרויקט אינה כוללת דרישות תשתית קשורות."
              />
            )
          )}
        </section>
      </div>
      <ProjectAttachments projectId={projectId} />
    </>
  );
}

export default function ProjectWorkspacePage() {
  return (
    <Suspense fallback={<div className="surface-card" role="status">Loading project workspace…</div>}>
      <ProjectWorkspaceContent />
    </Suspense>
  );
}
