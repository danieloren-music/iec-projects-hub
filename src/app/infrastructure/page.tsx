'use client';

import { useCallback } from 'react';
import { Layers3, Search } from 'lucide-react';
import { api } from '@/api';
import { useApiResource } from '@/api/use-api-resource';
import { ApiErrorState, ApiLoading } from '@/components/api-state';
import { EmptyState, PageHeading, useAppUi } from '@/components/app-shell';

export default function InfrastructurePage() {
  const { isRtl } = useAppUi();
  const loadRequirements = useCallback(
    () => api.getInfrastructureRequirements(),
    [],
  );
  const requirements = useApiResource(loadRequirements);

  return (
    <>
      <PageHeading
        eyebrow="Portfolio services"
        eyebrowHe="שירותי תיק הפרויקטים"
        title="Infrastructure"
        titleHe="תשתיות"
        description="Review infrastructure requirements provided by the application API."
        descriptionHe="סקירת דרישות התשתית שמסופקות דרך ממשק ה-API של היישום."
      />
      <div className="toolbar">
        <div className="filter-list" aria-label={isRtl ? 'מסנני תשתיות' : 'Infrastructure filters'}>
          <span className="filter-chip filter-chip--active">{isRtl ? 'כל הדרישות' : 'All requirements'}</span>
        </div>
        <label className="search-field">
          <Search size={15} />
          <input
            type="search"
            disabled
            placeholder={isRtl ? 'החיפוש יהיה זמין לאחר חיבור נתונים' : 'Search available when data is connected'}
            aria-label={isRtl ? 'חיפוש דרישות' : 'Search requirements'}
          />
        </label>
      </div>
      <section className="table-card">
        {requirements.state.status === 'loading' && (
          <ApiLoading label="infrastructure requirements" />
        )}
        {requirements.state.status === 'error' && (
          <ApiErrorState
            error={requirements.state.error}
            onRetry={requirements.retry}
          />
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
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{isRtl ? 'דרישה' : 'Requirement'}</th>
                    <th>{isRtl ? 'קטגוריה' : 'Category'}</th>
                    <th>{isRtl ? 'מצב' : 'Status'}</th>
                    <th>{isRtl ? 'סיבת חסימה' : 'Blocker reason'}</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.state.data.map((requirement, index) => (
                    <tr key={String(requirement.id ?? `requirement-${index}`)}>
                      <td>{requirement.title || '—'}</td>
                      <td>{requirement.category || '—'}</td>
                      <td>{requirement.status || '—'}</td>
                      <td>{requirement.blocker_reason || '—'}</td>
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
