"use client";

import { useCallback, useState, type FormEvent } from "react";
import { api } from "@/api";
import { ApiRequestError } from "@/api/client";
import { ApiErrorState, ApiLoading } from "@/components/api-state";
import { EmptyState, useAppUi } from "@/components/app-shell";
import { useApiResource } from "@/api/use-api-resource";
import {
  TaskStatusSchema,
  type TaskRecord,
} from "@/lib/data/project-model";

const statuses = ["todo", "in_progress", "blocked", "done"] as const;

function statusLabel(status: TaskRecord["status"], isRtl: boolean) {
  const labels = {
    todo: isRtl ? "לביצוע" : "To do",
    in_progress: isRtl ? "בתהליך" : "In progress",
    blocked: isRtl ? "חסום" : "Blocked",
    done: isRtl ? "הושלם" : "Done",
  };
  return labels[status];
}

function TaskRow({
  task,
  isRtl,
  onSaved,
}: {
  task: TaskRecord;
  isRtl: boolean;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(task.status);
  const [assignee, setAssignee] = useState(task.assigned_to ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.updateTask(task.id, {
        status,
        assigned_to: assignee.trim() || null,
      });
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError && cause.code === "UNAUTHORIZED"
          ? isRtl
            ? "יש להתחבר מחדש."
            : "Please sign in again."
          : isRtl
            ? "לא ניתן לעדכן את המשימה כרגע."
            : "The task could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <strong>{task.title}</strong>
        {task.description && <p className="task-description">{task.description}</p>}
        {error && <p className="task-error" role="alert">{error}</p>}
      </td>
      <td>{task.assigned_to || (isRtl ? "לא הוקצה" : "Unassigned")}</td>
      <td>{statusLabel(task.status, isRtl)}</td>
      <td>
        <form className="task-edit-form" onSubmit={save}>
          <label className="visually-hidden" htmlFor={`task-status-${task.id}`}>
            {isRtl ? "סטטוס" : "Status"}
          </label>
          <select
            id={`task-status-${task.id}`}
            value={status}
            onChange={(event) => {
              const nextStatus = TaskStatusSchema.safeParse(
                event.target.value,
              );
              if (nextStatus.success) setStatus(nextStatus.data);
            }}
            disabled={saving}
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value, isRtl)}
              </option>
            ))}
          </select>
          <label className="visually-hidden" htmlFor={`task-assignee-${task.id}`}>
            {isRtl ? "דוא״ל של המשתמש המוקצה" : "Assignee email"}
          </label>
          <input
            id={`task-assignee-${task.id}`}
            type="email"
            maxLength={254}
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            placeholder={isRtl ? "דוא״ל להקצאה" : "Assign by email"}
            disabled={saving}
          />
          <button className="button--primary task-save-button" type="submit" disabled={saving}>
            {saving ? (isRtl ? "שומר..." : "Saving...") : (isRtl ? "שמירה" : "Save")}
          </button>
        </form>
      </td>
    </tr>
  );
}

export function TaskBoard({ projectId }: { projectId?: string }) {
  const { isRtl } = useAppUi();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const loadTasks = useCallback(() => api.getTasks(projectId), [projectId]);
  const loadProjects = useCallback(
    () => (projectId ? Promise.resolve([]) : api.getProjects()),
    [projectId],
  );
  const tasks = useApiResource(loadTasks);
  const projects = useApiResource(loadProjects);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await api.createTask({
        project_id: projectId ?? selectedProjectId,
        title,
        ...(description.trim() ? { description } : {}),
        ...(assignee.trim() ? { assigned_to: assignee.trim() } : {}),
      });
      setTitle("");
      setDescription("");
      setAssignee("");
      tasks.retry();
    } catch (cause) {
      setError(
        cause instanceof ApiRequestError && cause.code === "BAD_REQUEST"
          ? isRtl
            ? "יש להזין כותרת תקינה ולבחור פרויקט."
            : "Enter a valid title and choose a project."
          : isRtl
            ? "לא ניתן ליצור את המשימה. בדקו את חיבור הנתונים."
            : "The task could not be created. Check the data connection.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="task-board">
      <section className="surface-card task-create-card">
        <h2>{isRtl ? "משימה חדשה" : "New task"}</h2>
        <form className="task-create-form" onSubmit={create}>
          {!projectId && (
            <label>
              {isRtl ? "פרויקט" : "Project"}
              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                required
                disabled={projects.state.status !== "success" || saving}
              >
                <option value="">
                  {isRtl ? "בחירת פרויקט" : "Select a project"}
                </option>
                {projects.state.status === "success" &&
                  projects.state.data.map((project, index) => (
                    <option
                      key={String(project.id ?? `project-${index}`)}
                      value={String(project.id ?? "")}
                    >
                      {project.name || project.code || String(project.id)}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <label>
            {isRtl ? "כותרת" : "Title"}
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
              disabled={saving}
            />
          </label>
          <label>
            {isRtl ? "תיאור (אופציונלי)" : "Description (optional)"}
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              disabled={saving}
            />
          </label>
          <label>
            {isRtl ? "הקצאה למשתמש לפי דוא״ל (אופציונלי)" : "Assign by user email (optional)"}
            <input
              type="email"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              maxLength={254}
              disabled={saving}
            />
          </label>
          <button className="button--primary" type="submit" disabled={saving || (!projectId && projects.state.status !== "success")}>
            {saving ? (isRtl ? "יוצר..." : "Creating...") : (isRtl ? "יצירת משימה" : "Create task")}
          </button>
        </form>
        {!projectId && projects.state.status === "error" && (
          <ApiErrorState error={projects.state.error} onRetry={projects.retry} />
        )}
        {error && <p className="task-error" role="alert">{error}</p>}
      </section>

      <section className="table-card" aria-label={isRtl ? "רשימת משימות" : "Task list"}>
        {tasks.state.status === "loading" && <ApiLoading label={isRtl ? "משימות" : "tasks"} />}
        {tasks.state.status === "error" && (
          <ApiErrorState error={tasks.state.error} onRetry={tasks.retry} />
        )}
        {tasks.state.status === "success" &&
          (tasks.state.data.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              titleHe="אין עדיין משימות"
              description="Create a task to start tracking the work."
              descriptionHe="צרו משימה כדי להתחיל לעקוב אחר העבודה."
            />
          ) : (
            <div className="data-table-wrap">
              <table className="data-table task-table">
                <thead>
                  <tr>
                    <th>{isRtl ? "משימה" : "Task"}</th>
                    <th>{isRtl ? "משתמש מוקצה" : "Assigned user"}</th>
                    <th>{isRtl ? "סטטוס" : "Status"}</th>
                    <th>{isRtl ? "עדכון" : "Update"}</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.state.data.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isRtl={isRtl}
                      onSaved={tasks.retry}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>
    </div>
  );
}
