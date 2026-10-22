'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/api';
import { useApiResource } from '@/api/use-api-resource';
import { ApiErrorState, ApiLoading } from '@/components/api-state';
import { EmptyState, PageHeading, useAppUi } from '@/components/app-shell';

export default function ProjectsPage() {
  const { isRtl } = useAppUi();
  const loadProjects = useCallback(() => api.getProjects(), []);
  const projects = useApiResource(loadProjects);

  return (
    <>
      <PageHeading
        eyebrow="Portfolio"
        eyebrowHe="תיק פרויקטים"
        title="Projects"
        titleHe="פרויקטים"
        description="Browse the portfolio. Project records will be supplied by the application API when configured."
        descriptionHe="עיון בתיק הפרויקטים. הרשומות יוצגו לאחר הגדרת ממשק ה-API של היישום."
      />
      <div className="toolbar">
        <div className="filter-list" aria-label={isRtl ? 'מסנני פרויקטים' : 'Project filters'}>
          <span className="filter-chip filter-chip--active">{isRtl ? 'כל הפרויקטים' : 'All projects'}</span>
        </div>
        <label className="search-field">
          <Search size={15} />
          <input
            type="search"
            disabled
            placeholder={isRtl ? 'החיפוש יהיה זמין לאחר חיבור נתונים' : 'Search available when data is connected'}
            aria-label={isRtl ? 'חיפוש פרויקטים' : 'Search projects'}
          />
        </label>
      </div>
      <section className="table-card">
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
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{isRtl ? 'פרויקט' : 'Project'}</th>
                    <th>{isRtl ? 'קוד' : 'Code'}</th>
                    <th>{isRtl ? 'מצב כולל' : 'Overall status'}</th>
                    <th>{isRtl ? 'מצב RAG' : 'RAG status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.state.data.map((project, index) => (
                    <tr key={String(project.id ?? `project-${index}`)}>
                      <td>
                        {project.id == null ? (
                          project.name || '—'
                        ) : (
                          <Link href={`/projects/${encodeURIComponent(String(project.id))}`}>
                            {project.name || String(project.id)}
                          </Link>
                        )}
                      </td>
                      <td>{project.code || '—'}</td>
                      <td>{project.overall_status || '—'}</td>
                      <td>{project.rag_status || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>
    </>
  );
}
