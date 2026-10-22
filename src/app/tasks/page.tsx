'use client';

import { useCallback } from 'react';
import { CheckSquare, Search } from 'lucide-react';
import { api } from '@/api';
import { useApiResource } from '@/api/use-api-resource';
import { ApiErrorState, ApiLoading } from '@/components/api-state';
import { EmptyState, PageHeading, useAppUi } from '@/components/app-shell';

export default function TasksPage() {
  const { isRtl } = useAppUi();
  const loadTasks = useCallback(() => api.getTasks(), []);
  const tasks = useApiResource(loadTasks);

  return (
    <>
      <PageHeading
        eyebrow="Portfolio work"
        eyebrowHe="עבודת תיק הפרויקטים"
        title="Tasks"
        titleHe="משימות"
        description="Review work across the portfolio. No task states, owners, or records are assumed."
        descriptionHe="סקירת העבודה בתיק הפרויקטים. לא הונחו מצבי משימה, בעלים או רשומות."
      />
      <div className="toolbar">
        <div className="filter-list" aria-label={isRtl ? 'מסנני משימות' : 'Task filters'}>
          <span className="filter-chip filter-chip--active">{isRtl ? 'כל המשימות' : 'All tasks'}</span>
        </div>
        <label className="search-field">
          <Search size={15} />
          <input
            type="search"
            disabled
            placeholder={isRtl ? 'החיפוש יהיה זמין לאחר חיבור נתונים' : 'Search available when data is connected'}
            aria-label={isRtl ? 'חיפוש משימות' : 'Search tasks'}
          />
        </label>
      </div>
      <section className="table-card">
        {tasks.state.status === 'loading' && <ApiLoading label="tasks" />}
        {tasks.state.status === 'error' && (
          <ApiErrorState error={tasks.state.error} onRetry={tasks.retry} />
        )}
        {tasks.state.status === 'success' && (
          <EmptyState
            icon={CheckSquare}
            title="Task data is not available"
            titleHe="נתוני משימות אינם זמינים"
            description="The API returned an unexpected task response. The task schema must be confirmed before this view can render records."
            descriptionHe="ממשק ה-API החזיר תגובה לא צפויה. יש לאשר את סכמת המשימות לפני הצגת רשומות."
          />
        )}
      </section>
    </>
  );
}
