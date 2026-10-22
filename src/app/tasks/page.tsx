'use client';

import { PageHeading } from '@/components/app-shell';
import { TaskBoard } from '@/components/task-board';

export default function TasksPage() {
  return (
    <>
      <PageHeading
        eyebrow="Portfolio work"
        eyebrowHe="עבודת תיק הפרויקטים"
        title="Tasks"
        titleHe="משימות"
        description="Create tasks, track their status, and assign them to project users."
        descriptionHe="יצירת משימות, מעקב אחר הסטטוס והקצאה למשתמשי הפרויקט."
      />
      <TaskBoard />
    </>
  );
}
