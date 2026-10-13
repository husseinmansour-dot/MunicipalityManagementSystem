
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  DollarSign,
  FolderKanban,
  LayoutGrid,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  X
} from "lucide-react";
import api from "../api/axios";
import { isAdmin, getCurrentUser } from "../utils/auth";

const PROJECT_STATUSES = [
  "PLANNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"
];
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const emptyProject = {
  name: "",
  description: "",
  status: "PLANNED",
  budget: "",
  startDate: "",
  endDate: "",
  managerId: ""
};

const emptyTask = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  assignedTo: "",
  dueDate: ""
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const pretty = value => String(value || "").replaceAll("_", " ");
const dateInput = value => value ? String(value).slice(0, 10) : "";
const formatDate = value =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
      })
    : "Not set";

const money = value =>
  value == null
    ? "Not set"
    : `$${Number(value).toLocaleString("en-US", {
        maximumFractionDigits: 2
      })}`;

const statusStyles = {
  PLANNED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  ON_HOLD: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  TODO: "bg-slate-100 text-slate-600",
  DONE: "bg-emerald-50 text-emerald-700"
};

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wide ${statusStyles[status] || statusStyles.PLANNED}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === "COMPLETED" || status === "DONE"
          ? "bg-emerald-500"
          : status === "IN_PROGRESS"
          ? "bg-blue-500"
          : status === "ON_HOLD"
          ? "bg-amber-500"
          : "bg-slate-400"
      }`} />
      {pretty(status)}
    </span>
  );
}

function InitialAvatar({ name, size = "md" }) {
  const initials = String(name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-indigo-100 font-bold text-indigo-700 ${
      size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"
    }`}>
      {initials}
    </span>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px]"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#17365D]">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricCard({ label, value, icon: Icon, accent, detail }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={21} />
        </div>
        <span className="text-xs font-medium text-slate-400">Overview</span>
      </div>
      <div className="mt-5">
        <p className="text-3xl font-extrabold tracking-tight text-[#17365D]">
          {value}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
        <p className="mt-1 text-xs text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

export default function Projects() {
  const admin = isAdmin();
  const currentUserId = Number(getCurrentUser()?.id);

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [projectModal, setProjectModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [view, setView] = useState("grid");

  async function loadProjects() {
    try {
      setError("");
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    try {
      const { data } = await api.get("/projects/employees");
      setEmployees(data);
    } catch (err) {
      console.error("Unable to load employees", err);
    }
  }

  async function loadProject(id) {
    try {
      setError("");
      const { data } = await api.get(`/projects/${id}`);
      setSelected(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load project details.");
    }
  }

  useEffect(() => {
    loadProjects();
    loadEmployees();
  }, []);

  const filteredProjects = useMemo(() => {
    const term = search.toLowerCase().trim();
    return projects.filter(project => {
      const matchesSearch =
        !term ||
        project.name.toLowerCase().includes(term) ||
        (project.description || "").toLowerCase().includes(term) ||
        (project.manager?.fullName || "").toLowerCase().includes(term);

      const matchesStatus = filter === "ALL" || project.status === filter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, filter]);

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => p.status === "IN_PROGRESS").length,
    completed: projects.filter(p => p.status === "COMPLETED").length,
    planned: projects.filter(p => p.status === "PLANNED").length
  }), [projects]);

  function startProject(project = null) {
    setError("");
    setEditingProject(project);
    setProjectForm(project ? {
      name: project.name,
      description: project.description || "",
      status: project.status,
      budget: project.budget ?? "",
      startDate: dateInput(project.startDate),
      endDate: dateInput(project.endDate),
      managerId: project.managerId ?? ""
    } : { ...emptyProject });
    setProjectModal(true);
  }

  async function saveProject(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...projectForm,
        managerId: projectForm.managerId === ""
          ? null : Number(projectForm.managerId),
        budget: projectForm.budget === ""
          ? null : Number(projectForm.budget),
        startDate: projectForm.startDate || null,
        endDate: projectForm.endDate || null
      };

      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, payload);
        if (selected?.id === editingProject.id) {
          await loadProject(editingProject.id);
        }
      } else {
        await api.post("/projects", payload);
      }

      setProjectModal(false);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(project) {
    if (!window.confirm(`Delete "${project.name}" and all its tasks?`)) return;
    try {
      setError("");
      await api.delete(`/projects/${project.id}`);
      if (selected?.id === project.id) setSelected(null);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project.");
    }
  }

  function startTask(task = null) {
    setError("");
    setEditingTask(task);
    setTaskForm(task ? {
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo ?? "",
      dueDate: dateInput(task.dueDate)
    } : { ...emptyTask });
    setTaskModal(true);
  }

  async function saveTask(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...taskForm,
        assignedTo: taskForm.assignedTo === ""
          ? null : Number(taskForm.assignedTo),
        dueDate: taskForm.dueDate || null
      };

      if (editingTask) {
        await api.put(`/projects/tasks/${editingTask.id}`, payload);
      } else {
        await api.post(`/projects/${selected.id}/tasks`, payload);
      }

      setTaskModal(false);
      await loadProject(selected.id);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTaskStatus(task, status) {
    try {
      setError("");
      await api.put(`/projects/tasks/${task.id}`, { status });
      await loadProject(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task.");
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      setError("");
      await api.delete(`/projects/tasks/${task.id}`);
      await loadProject(selected.id);
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task.");
    }
  }

  function progressFor(project) {
    if (project.status === "COMPLETED") return 100;
    if (project.status === "IN_PROGRESS") return 50;
    return 0;
  }

  const selectedTasks = selected?.tasks || [];
  const completedTasks = selectedTasks.filter(t => t.status === "DONE").length;
  const taskProgress = selectedTasks.length
    ? Math.round((completedTasks / selectedTasks.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 pb-10">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-600">
            <FolderKanban size={15} />
            MUNICIPAL OPERATIONS
            <ChevronRight size={14} className="text-slate-400" />
            PROJECT MANAGEMENT
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17365D]">
            Projects & Tasks
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Plan, organize, and track your municipality's initiatives in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadProjects();
              if (selected) loadProject(selected.id);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            Refresh
          </button>
          {admin && (
            <button
              onClick={() => startProject()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#155EEF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
            >
              <Plus size={18} />
              New Project
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <CircleAlert size={18} />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {!selected ? (
        <>
          {/* STATISTICS */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Projects" value={stats.total}
              icon={FolderKanban} accent="bg-indigo-50 text-indigo-600"
              detail="All registered initiatives" />
            <MetricCard label="In Progress" value={stats.active}
              icon={Clock3} accent="bg-blue-50 text-blue-600"
              detail="Currently being executed" />
            <MetricCard label="Completed" value={stats.completed}
              icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600"
              detail="Successfully delivered" />
            <MetricCard label="Planned" value={stats.planned}
              icon={CalendarDays} accent="bg-amber-50 text-amber-600"
              detail="Upcoming projects" />
          </div>

          {/* PROJECT DIRECTORY */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#17365D]">
                  Project Directory
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {filteredProjects.length} projects found
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <Search size={17} className="text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="w-40 bg-transparent text-sm outline-none sm:w-52"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <SlidersHorizontal size={16} className="text-slate-400" />
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="bg-transparent text-sm text-slate-600 outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    {PROJECT_STATUSES.map(s => (
                      <option key={s} value={s}>{pretty(s)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex rounded-xl border border-slate-200 p-1">
                  <button
                    title="Grid view"
                    onClick={() => setView("grid")}
                    className={`rounded-lg p-2 ${view === "grid" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                  >
                    <LayoutGrid size={17} />
                  </button>
                  <button
                    title="List view"
                    onClick={() => setView("list")}
                    className={`rounded-lg p-2 ${view === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
                  >
                    <ListTodo size={17} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 p-20 text-slate-500">
                <Loader2 className="animate-spin" size={22} />
                Loading projects...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50">
                  <div className="absolute -right-2 -top-2 h-10 w-10 rounded-2xl bg-indigo-100" />
                  <FolderKanban size={42} className="relative text-blue-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[#17365D]">
                  {projects.length === 0 ? "Your projects start here" : "No matching projects"}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {projects.length === 0
                    ? "Bring your municipality's initiatives together. Create a project, assign a manager, and start tracking progress."
                    : "Try a different search term or status filter to find what you're looking for."}
                </p>
                {projects.length === 0 && admin ? (
                  <button
                    onClick={() => startProject()}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
                  >
                    <Plus size={18} />
                    Create First Project
                    <ArrowRight size={16} />
                  </button>
                ) : projects.length > 0 ? (
                  <button
                    onClick={() => { setSearch(""); setFilter("ALL"); }}
                    className="mt-5 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : view === "grid" ? (
              <div className="grid gap-5 bg-slate-50/40 p-5 sm:grid-cols-2 lg:p-6 2xl:grid-cols-3">
                {filteredProjects.map((project, index) => (
                  <div
                    key={project.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className={`h-1.5 ${
                      ["bg-blue-500", "bg-indigo-500", "bg-teal-500", "bg-violet-500"][index % 4]
                    }`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FolderKanban size={22} />
                        </div>
                        <Badge status={project.status} />
                      </div>

                      <button
                        onClick={() => loadProject(project.id)}
                        className="mt-5 block w-full text-left"
                      >
                        <h3 className="line-clamp-1 text-lg font-bold text-[#17365D] group-hover:text-blue-600">
                          {project.name}
                        </h3>
                        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                          {project.description || "No project description added yet."}
                        </p>
                      </button>

                      <div className="mt-5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500">Status progress</span>
                        <span className="font-bold text-[#17365D]">{progressFor(project)}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            project.status === "COMPLETED" ? "bg-emerald-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${progressFor(project)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Status indicator, not measured task completion
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
                        <div>
                          <p className="text-[11px] text-slate-400">Budget</p>
                          <p className="mt-1 text-sm font-bold text-slate-700">{money(project.budget)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">Deadline</p>
                          <p className="mt-1 text-sm font-bold text-slate-700">{formatDate(project.endDate)}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <InitialAvatar name={project.manager?.fullName || "U"} size="sm" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400">Project Manager</p>
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {project.manager?.fullName || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => loadProject(project.id)}
                          title="Open project"
                          className="rounded-lg bg-slate-50 p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>

                      {admin && (
                        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                          <button
                            onClick={() => startProject(project)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-50 py-2 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => deleteProject(project)}
                            className="flex items-center justify-center rounded-lg bg-rose-50 px-3 text-rose-500 hover:bg-rose-100"
                            title="Delete project"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Project</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Manager</th>
                      <th className="px-6 py-4">Budget</th>
                      <th className="px-6 py-4">Deadline</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map(project => (
                      <tr key={project.id} className="border-t border-slate-100 hover:bg-blue-50/30">
                        <td className="px-6 py-4">
                          <button onClick={() => loadProject(project.id)} className="font-bold text-[#17365D] hover:text-blue-600">
                            {project.name}
                          </button>
                          <p className="mt-1 text-xs text-slate-400">Project #{project.id}</p>
                        </td>
                        <td className="px-6 py-4"><Badge status={project.status} /></td>
                        <td className="px-6 py-4">{project.manager?.fullName || "Unassigned"}</td>
                        <td className="px-6 py-4 font-semibold">{money(project.budget)}</td>
                        <td className="px-6 py-4">{formatDate(project.endDate)}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <button onClick={() => loadProject(project.id)} className="font-semibold text-blue-600">View</button>
                            {admin && (
                              <>
                                <button onClick={() => startProject(project)} className="text-slate-500"><Pencil size={16} /></button>
                                <button onClick={() => deleteProject(project)} className="text-rose-500"><Trash2 size={16} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* PROJECT DETAILS */}
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={17} /> All Projects
          </button>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Project #{selected.id}
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[#17365D]">
                    {selected.name}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    {selected.description || "No description provided."}
                  </p>
                </div>
                <Badge status={selected.status} />
              </div>

              <div className="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Project Manager", value: selected.manager?.fullName || "Unassigned", icon: Users },
                  { label: "Budget", value: money(selected.budget), icon: DollarSign },
                  { label: "Start Date", value: formatDate(selected.startDate), icon: CalendarDays },
                  { label: "End Date", value: formatDate(selected.endDate), icon: CalendarDays }
                ].map(item => (
                  <div key={item.label} className="rounded-xl bg-slate-50 p-4">
                    <item.icon size={18} className="mb-3 text-blue-600" />
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-[#17365D]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#17365D]">
                    <ListTodo size={20} className="text-blue-600" />
                    Project Tasks
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Track assignments and task progress
                  </p>
                </div>
                {admin && (
                  <button
                    onClick={() => startTask()}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus size={16} /> Add Task
                  </button>
                )}
              </div>

              {selectedTasks.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-14 text-center">
                  <div className="mb-4 rounded-2xl bg-blue-50 p-5 text-blue-600">
                    <ListTodo size={30} />
                  </div>
                  <h4 className="font-bold text-[#17365D]">No tasks yet</h4>
                  <p className="mt-2 max-w-xs text-sm text-slate-500">
                    Break this project into manageable tasks and assign them to your team.
                  </p>
                  {admin && (
                    <button onClick={() => startTask()} className="mt-5 font-semibold text-blue-600 hover:underline">
                      + Create first task
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedTasks.map(task => (
                    <div key={task.id} className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:p-6">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`mt-0.5 rounded-xl p-2.5 ${
                          task.status === "DONE"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {task.status === "DONE" ? <Check size={18} /> : <ListTodo size={18} />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800">{task.title}</h4>
                          <p className="mt-1 text-xs text-slate-500">
                            {task.description || "No description"}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users size={13} />
                              {task.assignee?.fullName || "Unassigned"}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarDays size={13} />
                              {formatDate(task.dueDate)}
                            </span>
                            <span className={`rounded-md px-2 py-1 font-semibold ${
                              task.priority === "HIGH"
                                ? "bg-rose-50 text-rose-600"
                                : task.priority === "MEDIUM"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {task.priority} PRIORITY
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {admin || task.assignedTo === currentUserId ? (
                          <select
                            value={task.status}
                            onChange={e => updateTaskStatus(task, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                          >
                            {TASK_STATUSES.map(s => (
                              <option key={s} value={s}>{pretty(s)}</option>
                            ))}
                          </select>
                        ) : <Badge status={task.status} />}

                        {admin && (
                          <>
                            <button onClick={() => startTask(task)} title="Edit task" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => deleteTask(task)} title="Delete task" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[#17365D]">Task Completion</h3>
                <div className="mt-6 flex justify-center">
                  <div
                    className="flex h-36 w-36 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#2563eb ${taskProgress}%, #e2e8f0 0)`
                    }}
                  >
                    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-3xl font-extrabold text-[#17365D]">
                        {taskProgress}%
                      </span>
                      <span className="text-[11px] text-slate-400">Complete</span>
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-center text-sm text-slate-500">
                  <strong className="text-slate-800">{completedTasks}</strong> of{" "}
                  <strong className="text-slate-800">{selectedTasks.length}</strong> tasks completed
                </p>
              </div>

              <div className="rounded-2xl bg-[#17365D] p-5 text-white shadow-sm">
                <div className="flex items-center gap-2">
                  <CircleAlert size={19} className="text-blue-200" />
                  <h3 className="font-bold">Project Overview</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-blue-100">
                  Keep tasks assigned, monitor deadlines, and update their status as work progresses.
                </p>
                <div className="mt-5 border-t border-white/15 pt-4 text-xs text-blue-100">
                  {selectedTasks.filter(t => t.status === "IN_PROGRESS").length} tasks currently in progress
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PROJECT MODAL */}
      {projectModal && (
        <Modal
          title={editingProject ? "Edit Project" : "Create New Project"}
          subtitle="Define the project details and assign responsibility."
          onClose={() => setProjectModal(false)}
        >
          <form onSubmit={saveProject} className="space-y-5">
            <Field label="Project Name">
              <input
                required
                className={inputClass}
                placeholder="e.g. Road Infrastructure Upgrade"
                value={projectForm.name}
                onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Describe the objectives of this project..."
                value={projectForm.description}
                onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Project Status">
                <select className={inputClass} value={projectForm.status}
                  onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}>
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{pretty(s)}</option>)}
                </select>
              </Field>
              <Field label="Budget (USD)">
                <input type="number" min="0" step="0.01" className={inputClass}
                  placeholder="0.00" value={projectForm.budget}
                  onChange={e => setProjectForm({ ...projectForm, budget: e.target.value })} />
              </Field>
              <Field label="Start Date">
                <input type="date" className={inputClass} value={projectForm.startDate}
                  onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })} />
              </Field>
              <Field label="End Date">
                <input type="date" className={inputClass} value={projectForm.endDate}
                  onChange={e => setProjectForm({ ...projectForm, endDate: e.target.value })} />
              </Field>
            </div>
            <Field label="Project Manager">
              <select className={inputClass} value={projectForm.managerId}
                onChange={e => setProjectForm({ ...projectForm, managerId: e.target.value })}>
                <option value="">Select a manager (optional)</option>
                {employees.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role.name})
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setProjectModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">
                Cancel
              </button>
              <button disabled={saving}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* TASK MODAL */}
      {taskModal && (
        <Modal
          title={editingTask ? "Edit Task" : "Create New Task"}
          subtitle="Assign work and set a clear deadline."
          onClose={() => setTaskModal(false)}
        >
          <form onSubmit={saveTask} className="space-y-5">
            <Field label="Task Title">
              <input required className={inputClass}
                placeholder="e.g. Inspect damaged roads"
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea rows={3} className={inputClass}
                placeholder="Task instructions..."
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <select className={inputClass} value={taskForm.status}
                  onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                  {TASK_STATUSES.map(s => <option key={s} value={s}>{pretty(s)}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select className={inputClass} value={taskForm.priority}
                  onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{pretty(p)}</option>)}
                </select>
              </Field>
              <Field label="Assign Employee">
                <select className={inputClass} value={taskForm.assignedTo}
                  onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {employees.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </Field>
              <Field label="Due Date">
                <input type="date" className={inputClass} value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setTaskModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">
                Cancel
              </button>
              <button disabled={saving}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : editingTask ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
