
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Megaphone, Plus, Search, MapPin, Clock3,
  Pencil, Trash2, X, Loader2, CheckCircle2, AlertCircle,
  CalendarCheck, FileText
} from "lucide-react";
import api from "../api/axios";
import { isAdmin } from "../utils/auth";

const eventStatuses = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"];
const announcementStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const categories = ["GENERAL", "PUBLIC_NOTICE", "MAINTENANCE", "COMMUNITY"];

const blankEvent = {
  title: "", description: "", location: "",
  startDate: "", endDate: "", status: "SCHEDULED"
};
const blankAnnouncement = {
  title: "", content: "", category: "GENERAL", status: "DRAFT"
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const pretty = value => String(value || "").replaceAll("_", " ");
const displayDate = value =>
  value ? new Date(value).toLocaleString(undefined, {
    dateStyle: "medium", timeStyle: "short"
  }) : "Not set";

function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const statusColor = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  ONGOING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-600"
};

function Badge({ value }) {
  return (
    <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${statusColor[value] || "bg-slate-100"}`}>
      {pretty(value)}
    </span>
  );
}

function Stat({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon size={21} />
      </div>
      <p className="text-3xl font-extrabold text-[#17365D]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{title}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function Community() {
  const admin = isAdmin();
  const [tab, setTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankEvent);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [eventRes, announcementRes] = await Promise.all([
        api.get("/community/events"),
        api.get("/community/announcements")
      ]);
      setEvents(eventRes.data);
      setAnnouncements(announcementRes.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load community information.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const items = tab === "events" ? events : announcements;
    const term = search.trim().toLowerCase();

    return items.filter(item => {
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        String(item.description || item.content || "").toLowerCase().includes(term) ||
        String(item.location || "").toLowerCase().includes(term);

      return matchesSearch &&
        (statusFilter === "ALL" || item.status === statusFilter);
    });
  }, [events, announcements, search, statusFilter, tab]);

  const upcoming = events.filter(event =>
    event.status === "SCHEDULED" &&
    new Date(event.startDate).getTime() >= Date.now()
  ).length;

  const published = announcements.filter(a => a.status === "PUBLISHED").length;

  function changeTab(value) {
    setTab(value);
    setSearch("");
    setStatusFilter("ALL");
    setError("");
    setSuccess("");
  }

  function openModal(item = null) {
    setEditing(item);
    setError("");
    setForm(tab === "events"
      ? item
        ? {
            title: item.title,
            description: item.description || "",
            location: item.location || "",
            startDate: toLocalInput(item.startDate),
            endDate: toLocalInput(item.endDate),
            status: item.status
          }
        : { ...blankEvent }
      : item
        ? {
            title: item.title,
            content: item.content,
            category: item.category,
            status: item.status
          }
        : { ...blankAnnouncement }
    );
    setModal(true);
  }

  async function saveItem(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = tab === "events" ? "events" : "announcements";
      const payload = tab === "events"
        ? {
            ...form,
            startDate: new Date(form.startDate).toISOString(),
            endDate: form.endDate ? new Date(form.endDate).toISOString() : null
          }
        : form;

      if (editing) {
        await api.put(`/community/${endpoint}/${editing.id}`, payload);
      } else {
        await api.post(`/community/${endpoint}`, payload);
      }

      setModal(false);
      setSuccess(editing ? "Changes saved successfully." : "Record created successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save record.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;

    try {
      const endpoint = tab === "events" ? "events" : "announcements";
      await api.delete(`/community/${endpoint}/${item.id}`);
      setSuccess("Record deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete record.");
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 pb-12">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">
            MUNICIPAL OPERATIONS / COMMUNITY
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17365D]">
            Events & Announcements
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Organize municipal events and share official announcements.
          </p>
        </div>

        {admin && (
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
          >
            <Plus size={18} />
            {tab === "events" ? "New Event" : "New Announcement"}
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} /> {success}
          </span>
          <button onClick={() => setSuccess("")}><X size={17} /></button>
        </div>
      )}

      {/* METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total Events" value={events.length}
          icon={CalendarDays} color="bg-indigo-50 text-indigo-600" />
        <Stat title="Upcoming Events" value={upcoming}
          icon={CalendarCheck} color="bg-blue-50 text-blue-600" />
        <Stat title="Announcements" value={announcements.length}
          icon={Megaphone} color="bg-amber-50 text-amber-600" />
        <Stat title="Published Notices" value={published}
          icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
      </div>

      {/* DIRECTORY */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 pt-5">
          <div className="flex gap-7">
            {[
              { id: "events", label: "Municipal Events", icon: CalendarDays },
              { id: "announcements", label: "Announcements", icon: Megaphone }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => changeTab(item.id)}
                  className={`flex items-center gap-2 border-b-2 pb-5 text-sm font-bold transition ${
                    tab === item.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
          </div>
          <p className="pb-4 text-xs font-medium text-slate-400">
            {filtered.length} records
          </p>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-slate-100 bg-slate-50/40 p-5">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${tab}...`}
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`${inputClass} w-auto`}
          >
            <option value="ALL">All Statuses</option>
            {(tab === "events" ? eventStatuses : announcementStatuses).map(s => (
              <option key={s} value={s}>{pretty(s)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-20 text-slate-500">
            <Loader2 size={22} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-5 rounded-3xl bg-blue-50 p-6 text-blue-600">
              {tab === "events" ? <CalendarDays size={42} /> : <Megaphone size={42} />}
            </div>
            <h3 className="text-xl font-bold text-[#17365D]">
              No {tab} found
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {search || statusFilter !== "ALL"
                ? "Try changing the search term or status filter."
                : `Your municipality's ${tab} will appear here.`}
            </p>
            {admin && !search && statusFilter === "ALL" && (
              <button
                onClick={() => openModal()}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                + Create {tab === "events" ? "Event" : "Announcement"}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 bg-slate-50/40 p-5 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map(item => (
              <div key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`h-1.5 ${
                  tab === "events" ? "bg-blue-500" : "bg-indigo-500"
                }`} />
                <div className="p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div className={`rounded-xl p-3 ${
                      tab === "events"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-indigo-50 text-indigo-600"
                    }`}>
                      {tab === "events" ? <CalendarDays size={23} /> : <Megaphone size={23} />}
                    </div>
                    <Badge value={item.status} />
                  </div>

                  <h3 className="text-lg font-bold text-[#17365D]">
                    {item.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                    {item.description || item.content || "No description provided."}
                  </p>

                  {tab === "events" ? (
                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
                      <p className="flex items-center gap-2">
                        <Clock3 size={15} className="text-blue-600" />
                        {displayDate(item.startDate)}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={15} className="text-blue-600" />
                        {item.location || "Location not specified"}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs">
                      <span className="font-bold text-blue-600">
                        {pretty(item.category)}
                      </span>
                      <span className="text-slate-400">
                        {item.publishedAt
                          ? `Published ${new Date(item.publishedAt).toLocaleDateString()}`
                          : "Not published"}
                      </span>
                    </div>
                  )}

                  {admin && (
                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => openModal(item)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-50 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={15} /> Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        className="rounded-lg bg-rose-50 px-4 text-rose-600 hover:bg-rose-100"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#17365D]">
                  {editing ? "Edit" : "Create"} {tab === "events" ? "Event" : "Announcement"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the details below.
                </p>
              </div>
              <button onClick={() => setModal(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {error && (
              <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
                {error}
              </p>
            )}

            <form onSubmit={saveItem} className="space-y-5">
              <Field label="Title">
                <input required className={inputClass} value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter title" />
              </Field>

              <Field label={tab === "events" ? "Description" : "Announcement Content"}>
                <textarea
                  required={tab === "announcements"}
                  rows={4}
                  className={inputClass}
                  value={tab === "events" ? form.description : form.content}
                  onChange={e => setForm({
                    ...form,
                    [tab === "events" ? "description" : "content"]: e.target.value
                  })}
                  placeholder="Enter details..."
                />
              </Field>

              {tab === "events" ? (
                <>
                  <Field label="Location">
                    <input className={inputClass} value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Municipality Hall" />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Start Date & Time">
                      <input required type="datetime-local" className={inputClass}
                        value={form.startDate}
                        onChange={e => setForm({ ...form, startDate: e.target.value })} />
                    </Field>
                    <Field label="End Date & Time">
                      <input type="datetime-local" className={inputClass}
                        value={form.endDate}
                        onChange={e => setForm({ ...form, endDate: e.target.value })} />
                    </Field>
                  </div>
                </>
              ) : (
                <Field label="Category">
                  <select className={inputClass} value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{pretty(c)}</option>)}
                  </select>
                </Field>
              )}

              <Field label="Status">
                <select className={inputClass} value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  {(tab === "events" ? eventStatuses : announcementStatuses).map(s => (
                    <option key={s} value={s}>{pretty(s)}</option>
                  ))}
                </select>
              </Field>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
                  Cancel
                </button>
                <button disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
