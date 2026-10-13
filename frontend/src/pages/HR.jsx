
import { useEffect, useState } from "react";
import {
  Users, UserCheck, UserMinus, Building2, Plus, Search,
  Pencil, CalendarDays, Mail, Phone, BriefcaseBusiness,
  X, Loader2, RefreshCw, ShieldCheck
} from "lucide-react";
import api from "../api/axios";

const emptyEmployee = {
  firstName: "", lastName: "", email: "", phone: "",
  jobTitle: "", departmentId: "", userId: "",
  hireDate: "", salary: "", status: "ACTIVE"
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const statuses = ["ACTIVE", "ON_LEAVE", "INACTIVE"];

const dateOnly = value => value ? String(value).slice(0, 10) : "";
const pretty = value => String(value || "").replaceAll("_", " ");

function StatCard({ title, value, icon: Icon, color, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon size={23} />
      </div>
      <p className="text-3xl font-extrabold text-[#17365D]">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    ON_LEAVE: "bg-amber-50 text-amber-700",
    INACTIVE: "bg-slate-100 text-slate-600"
  };
  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${colors[status] || colors.INACTIVE}`}>
      {pretty(status)}
    </span>
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

export default function HR() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0, active: 0, onLeave: 0, inactive: 0, departments: 0
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyEmployee);
  const [departmentName, setDepartmentName] = useState("");
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [employeeRes, departmentRes, statsRes, usersRes] =
        await Promise.all([
          api.get("/hr/employees"),
          api.get("/hr/departments"),
          api.get("/hr/stats"),
          api.get("/hr/users")
        ]);
      setEmployees(employeeRes.data);
      setDepartments(departmentRes.data);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load HR information.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = employees.filter(employee => {
    const term = search.toLowerCase();
    const name = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    return (
      (
        name.includes(term) ||
        employee.jobTitle.toLowerCase().includes(term) ||
        (employee.email || "").toLowerCase().includes(term) ||
        (employee.department?.name || "").toLowerCase().includes(term)
      ) &&
      (status === "ALL" || employee.status === status) &&
      (!departmentFilter ||
        employee.departmentId === Number(departmentFilter))
    );
  });

  function openForm(employee = null) {
    setEditing(employee);
    setForm(employee ? {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || "",
      phone: employee.phone || "",
      jobTitle: employee.jobTitle,
      departmentId: employee.departmentId ?? "",
      userId: employee.userId ?? "",
      hireDate: dateOnly(employee.hireDate),
      salary: employee.salary ?? "",
      status: employee.status
    } : { ...emptyEmployee, hireDate: new Date().toISOString().slice(0, 10) });
    setError("");
    setModal(true);
  }

  async function saveEmployee(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        departmentId: form.departmentId === "" ? null : Number(form.departmentId),
        userId: form.userId === "" ? null : Number(form.userId),
        salary: form.salary === "" ? null : Number(form.salary)
      };

      if (editing) {
        await api.put(`/hr/employees/${editing.id}`, payload);
      } else {
        await api.post("/hr/employees", payload);
      }

      setModal(false);
      setSuccess(editing ? "Employee updated successfully." : "Employee created successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateEmployee(employee) {
    if (!window.confirm(`Deactivate ${employee.firstName} ${employee.lastName}?`)) return;
    try {
      await api.patch(`/hr/employees/${employee.id}/deactivate`);
      setSuccess("Employee deactivated.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to deactivate employee.");
    }
  }

  async function createDepartment(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/hr/departments", { name: departmentName.trim() });
      setDepartmentName("");
      setShowDepartmentForm(false);
      setSuccess("Department created.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create department.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            MUNICIPAL ADMINISTRATION / HUMAN RESOURCES
          </p>
          <h1 className="text-3xl font-extrabold text-[#17365D]">
            Employee Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage your workforce, departments, employment records and assignments.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            title="Refresh"
            className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
          >
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
          <button onClick={() => setSuccess("")}><X size={16} /></button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Employees" value={stats.total} icon={Users}
          color="bg-indigo-50 text-indigo-600" detail="Registered personnel" />
        <StatCard title="Active Employees" value={stats.active} icon={UserCheck}
          color="bg-emerald-50 text-emerald-600" detail="Currently active" />
        <StatCard title="On Leave" value={stats.onLeave} icon={CalendarDays}
          color="bg-amber-50 text-amber-600" detail="Employees on leave" />
        <StatCard title="Departments" value={stats.departments} icon={Building2}
          color="bg-blue-50 text-blue-600" detail="Organization departments" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h2 className="text-lg font-bold text-[#17365D]">Employee Directory</h2>
            <p className="mt-1 text-xs text-slate-500">{filtered.length} employees found</p>
          </div>
          <button
            onClick={() => setShowDepartmentForm(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Building2 size={17} /> Add Department
          </button>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-slate-100 bg-slate-50/40 p-5">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, job title, department..."
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </div>
          <select className={`${inputClass} w-auto`} value={status}
            onChange={e => setStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{pretty(s)}</option>)}
          </select>
          <select className={`${inputClass} w-auto`} value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-16 text-slate-500">
            <Loader2 size={20} className="animate-spin" /> Loading employees...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-5 rounded-3xl bg-blue-50 p-6 text-blue-600">
              <Users size={40} />
            </div>
            <h3 className="text-xl font-bold text-[#17365D]">
              {employees.length === 0 ? "Build your municipality team" : "No matching employees"}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {employees.length === 0
                ? "Add employees and organize them into departments to manage your workforce."
                : "Adjust the search or filters to find employees."}
            </p>
            {employees.length === 0 && (
              <button onClick={() => openForm()}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
                + Add First Employee
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Hire Date</th>
                  <th className="px-6 py-4">Salary</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(employee => (
                  <tr key={employee.id} className="border-t border-slate-100 transition hover:bg-blue-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-extrabold text-indigo-700">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#17365D]">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{employee.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{employee.department?.name || "Unassigned"}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{employee.jobTitle}</td>
                    <td className="px-6 py-4"><StatusBadge status={employee.status} /></td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(employee.hireDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {employee.salary == null ? "—" : `$${Number(employee.salary).toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button title="Edit employee" onClick={() => openForm(employee)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                          <Pencil size={17} />
                        </button>
                        {employee.status !== "INACTIVE" && (
                          <button title="Deactivate employee" onClick={() => deactivateEmployee(employee)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                            <UserMinus size={17} />
                          </button>
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

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#17365D]">
                  {editing ? "Edit Employee" : "Add New Employee"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Employee information and employment details
                </p>
              </div>
              <button onClick={() => setModal(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEmployee} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First Name">
                  <input required className={inputClass} value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </Field>
                <Field label="Last Name">
                  <input required className={inputClass} value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </Field>
                <Field label="Email">
                  <input type="email" className={inputClass} value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <input className={inputClass} value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="Job Title">
                  <input required className={inputClass} value={form.jobTitle}
                    onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
                </Field>
                <Field label="Department">
                  <select className={inputClass} value={form.departmentId}
                    onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>
                <Field label="Hire Date">
                  <input type="date" required className={inputClass} value={form.hireDate}
                    onChange={e => setForm({ ...form, hireDate: e.target.value })} />
                </Field>
                <Field label="Salary (USD)">
                  <input type="number" min="0" step="0.01" className={inputClass} value={form.salary}
                    onChange={e => setForm({ ...form, salary: e.target.value })} />
                </Field>
                <Field label="Employment Status">
                  <select className={inputClass} value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}>
                    {statuses.map(s => <option key={s} value={s}>{pretty(s)}</option>)}
                  </select>
                </Field>
                <Field label="Linked System Account (optional)">
                  <select className={inputClass} value={form.userId}
                    onChange={e => setForm({ ...form, userId: e.target.value })}>
                    <option value="">No linked account</option>
                    {editing?.userId && (
                      <option value={editing.userId}>
                        {editing.user?.fullName || `User #${editing.userId}`} (Current)
                      </option>
                    )}
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                  </select>
                </Field>
              </div>

              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold">
                  Cancel
                </button>
                <button disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDepartmentForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#17365D]">New Department</h2>
              <button onClick={() => setShowDepartmentForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={createDepartment} className="space-y-4">
              <Field label="Department Name">
                <input required maxLength={100} className={inputClass}
                  placeholder="e.g. Public Works"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)} />
              </Field>
              <button disabled={saving}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-50">
                {saving ? "Saving..." : "Create Department"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
