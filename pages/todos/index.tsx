import { useState } from "react";
import Layout from "@/components/Layout";
import { SkeletonList } from "@/components/Skeleton";
import { useTodos } from "@/hooks/useTodos";
import type { StatusFilter } from "@/hooks/useTodos";
import type { Todo, CreateTodo, UpdateTodo } from "@/lib/database";
import {
  CheckSquare,
  Square,
  Clock,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

interface TodoFormState {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  due_date: string;
}

const defaultFormState: TodoFormState = {
  title: "",
  description: "",
  priority: "medium",
  due_date: "",
};

export default function TodosPage() {
  const {
    filteredTodos,
    projects,
    selectedProjectId,
    statusFilter,
    loading,
    error,
    selectProject,
    setStatusFilter,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleStatus,
    createProject,
  } = useTodos();

  // Todo form state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Todo | null>(null);
  const [form, setForm] = useState<TodoFormState>(defaultFormState);

  // Project add state
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultFormState);
    setFormOpen(true);
  };

  const openEdit = (todo: Todo) => {
    setEditTarget(todo);
    setForm({
      title: todo.title,
      description: todo.description ?? "",
      priority: todo.priority,
      due_date: todo.due_date ?? "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditTarget(null);
    setForm(defaultFormState);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editTarget) {
      const data: UpdateTodo = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        due_date: form.due_date || null,
      };
      await updateTodo(editTarget.id, data);
    } else {
      if (!selectedProjectId) return;
      const data: CreateTodo = {
        project_id: selectedProjectId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: "pending",
        priority: form.priority,
        due_date: form.due_date || null,
      };
      await createTodo(data);
    }
    closeForm();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus todo ini?")) return;
    await deleteTodo(id);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await createProject(newProjectName.trim());
    setNewProjectName("");
    setAddingProject(false);
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-0">
        {/* Page header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Todo List
            </h1>
            <p className="text-sm text-[color:var(--color-muted)]">
              Kelola task dan todo per project.
            </p>
          </div>
          <button
            onClick={openAdd}
            disabled={!selectedProjectId}
            className="flex items-center gap-1.5 rounded-[4px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-3 py-1.5 font-mono text-xs text-[#C41E3A] transition-colors hover:bg-[rgba(139,0,0,0.2)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={12} />
            Add Todo
          </button>
        </div>

        {/* Error bar */}
        {error && (
          <div className="mb-3 rounded-[6px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.1)] px-4 py-2">
            <p className="font-mono text-xs text-[#C41E3A]">{error}</p>
          </div>
        )}

        {/* Add/Edit form */}
        {formOpen && (
          <div className="mb-4 rounded-[6px] border border-[rgba(139,0,0,0.35)] bg-[#111111] p-4">
            <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#F0F0F0]">
              {editTarget ? "Edit Todo" : "New Todo"}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#1A1A1A] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] outline-none transition-colors focus:border-[#C41E3A]"
                  placeholder="Todo title..."
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#1A1A1A] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] outline-none transition-colors focus:border-[#C41E3A]"
                  placeholder="Optional description..."
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        priority: e.target.value as "low" | "medium" | "high",
                      }))
                    }
                    className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#1A1A1A] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] outline-none transition-colors focus:border-[#C41E3A]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="w-full rounded-[4px] border border-[rgba(139,0,0,0.25)] bg-[#1A1A1A] px-3 py-1.5 font-mono text-xs text-[#F0F0F0] outline-none transition-colors focus:border-[#C41E3A]"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="rounded-[4px] border border-[rgba(139,0,0,0.4)] bg-[rgba(139,0,0,0.15)] px-4 py-1.5 font-mono text-xs text-[#C41E3A] transition-colors hover:bg-[rgba(139,0,0,0.25)]"
                >
                  {editTarget ? "Save Changes" : "Create Todo"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-[4px] border border-[rgba(255,255,255,0.08)] px-4 py-1.5 font-mono text-xs text-[#666666] transition-colors hover:text-[#F0F0F0]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Split panel */}
        <div
          className="flex overflow-hidden rounded-[6px] border border-[rgba(139,0,0,0.25)]"
          style={{ minHeight: "560px" }}
        >
          {/* Left: project list */}
          <div className="w-[200px] flex-shrink-0 border-r border-[rgba(139,0,0,0.25)] bg-[#111111]">
            {/* Projects header */}
            <div className="flex items-center justify-between border-b border-[rgba(139,0,0,0.25)] px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666666]">
                Projects
              </span>
              <button
                onClick={() => setAddingProject(true)}
                className="flex items-center justify-center rounded-[2px] p-0.5 text-[#666666] transition-colors hover:text-[#C41E3A]"
                title="Add project"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Inline add project form */}
            {addingProject && (
              <form onSubmit={handleAddProject} className="border-b border-[rgba(139,0,0,0.25)] p-2">
                <input
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="w-full rounded-[2px] border border-[rgba(139,0,0,0.25)] bg-[#1A1A1A] px-2 py-1.5 font-mono text-xs text-[#F0F0F0] outline-none transition-colors focus:border-[#C41E3A]"
                />
                <div className="mt-1.5 flex gap-1">
                  <button
                    type="submit"
                    className="flex-1 rounded-[2px] bg-[rgba(139,0,0,0.2)] py-1 font-mono text-[10px] text-[#C41E3A] transition-colors hover:bg-[rgba(139,0,0,0.3)]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingProject(false);
                      setNewProjectName("");
                    }}
                    className="flex-1 rounded-[2px] py-1 font-mono text-[10px] text-[#666666] transition-colors hover:text-[#F0F0F0]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Project items */}
            <div className="overflow-y-auto">
              {loading ? (
                <div className="p-3">
                  <SkeletonList rows={3} />
                </div>
              ) : projects.length === 0 ? (
                <p className="px-3 py-4 font-mono text-[11px] text-[#666666]">
                  Belum ada project
                </p>
              ) : (
                projects.map((project) => {
                  const isActive = project.id === selectedProjectId;
                  return (
                    <button
                      key={project.id}
                      onClick={() => { closeForm(); selectProject(project.id); }}
                      className={[
                        "relative w-full px-3 py-2 text-left transition-colors",
                        isActive
                          ? "bg-[rgba(139,0,0,0.12)] text-[#F0F0F0]"
                          : "text-[#666666] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#F0F0F0]",
                      ].join(" ")}
                    >
                      {isActive && (
                        <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-[#C41E3A]" />
                      )}
                      <span className="block truncate font-mono text-xs">
                        {project.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: todos panel */}
          <div className="flex flex-1 flex-col overflow-hidden bg-[#0A0A0A]">
            {/* Filter tabs */}
            <div className="flex gap-0 border-b border-[rgba(139,0,0,0.25)]">
              {STATUS_FILTERS.map((tab) => {
                const isActive = statusFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={[
                      "px-4 py-2 font-mono text-xs transition-colors",
                      isActive
                        ? "border-b-2 border-[#C41E3A] text-[#C41E3A]"
                        : "text-[#666666] hover:text-[#F0F0F0]",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Todos list */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <SkeletonList rows={3} />
              ) : !selectedProjectId ? (
                <div className="flex h-full items-center justify-center">
                  <p className="font-mono text-sm text-[#666666]">
                    Pilih project untuk melihat todos
                  </p>
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="font-mono text-sm text-[#666666]">
                    Belum ada todo untuk project ini
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTodos.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onToggle={() => toggleStatus(todo.id)}
                      onEdit={() => openEdit(todo)}
                      onDelete={() => handleDelete(todo.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

interface TodoCardProps {
  todo: Todo;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TodoCard({ todo, onToggle, onEdit, onDelete }: TodoCardProps) {
  const isOverdue =
    todo.due_date &&
    new Date(todo.due_date) < new Date() &&
    todo.status !== "done";

  return (
    <div className="group relative rounded-[4px] border border-[rgba(139,0,0,0.2)] bg-[color:var(--color-surface)] px-4 py-3 transition-colors hover:border-[rgba(139,0,0,0.4)]">
      <div className="flex items-start gap-3">
        {/* Status toggle button */}
        <button
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0 text-[#666666] transition-colors hover:text-[#C41E3A]"
          title="Toggle status"
        >
          {todo.status === "done" ? (
            <CheckSquare size={16} className="text-[#C41E3A]" />
          ) : todo.status === "in_progress" ? (
            <Clock size={16} className="text-[#F59E0B]" />
          ) : (
            <Square size={16} />
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`font-mono text-sm ${
                todo.status === "done"
                  ? "opacity-50 line-through"
                  : "text-[#F0F0F0]"
              }`}
            >
              {todo.title}
            </span>
            {/* Priority badge */}
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                todo.priority === "high"
                  ? "bg-[rgba(196,30,58,0.2)] text-[#C41E3A]"
                  : todo.priority === "medium"
                  ? "bg-[rgba(245,158,11,0.2)] text-[#F59E0B]"
                  : "bg-[rgba(102,102,102,0.2)] text-[#666666]"
              }`}
            >
              {todo.priority}
            </span>
          </div>

          {/* Description */}
          {todo.description && (
            <p className="mt-0.5 line-clamp-1 font-mono text-[11px] text-[#666666]">
              {todo.description}
            </p>
          )}

          {/* Due date */}
          {todo.due_date && (
            <p
              className={`mt-1 font-mono text-[10px] ${
                isOverdue ? "text-[#C41E3A]" : "text-[#666666]"
              }`}
            >
              Due:{" "}
              {new Date(todo.due_date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Hover actions */}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-[2px] p-1 text-[#666666] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F0F0F0]"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-[2px] p-1 text-[#666666] transition-colors hover:bg-[rgba(196,30,58,0.1)] hover:text-[#C41E3A]"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
