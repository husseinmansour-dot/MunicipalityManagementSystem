
import { useEffect, useState } from "react";
import {
  Users, Shield, Plus, RefreshCw, X,
  UserRound, Mail, LockKeyhole
} from "lucide-react";
import api from "../api/axios";

const emptyUser = {
  fullName: "",
  email: "",
  password: "",
  roleId: ""
};

export default function UsersRoles() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [roleName, setRoleName] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        api.get("/users"),
        api.get("/roles")
      ]);

      const userData = usersResponse.data;
      const roleData = rolesResponse.data;

      setUsers(
        Array.isArray(userData)
          ? userData
          : userData.data ?? userData.users ?? []
      );

      setRoles(
        Array.isArray(roleData)
          ? roleData
          : roleData.data ?? roleData.roles ?? []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load users and roles."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openUserModal() {
    setUserForm(emptyUser);
    setModal("user");
    setError("");
    setSuccess("");
  }

  function openRoleModal() {
    setRoleName("");
    setModal("role");
    setError("");
    setSuccess("");
  }

  async function createUser(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/users", {
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        roleId: Number(userForm.roleId)
      });

      setModal(null);
      setSuccess("User created successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to create user."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createRole(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/roles", {
        name: roleName.trim().toUpperCase()
      });

      setModal(null);
      setSuccess("Role created successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to create role."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white " +
    "px-4 py-3 text-sm outline-none focus:border-blue-500";

  const primaryButton =
    "inline-flex items-center justify-center gap-2 " +
    "rounded-xl bg-blue-600 px-4 py-2.5 text-sm " +
    "font-medium text-white hover:bg-blue-700 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  const getRoleName = (user) =>
    user.role?.name ||
    roles.find(r => r.id === user.roleId)?.name ||
    "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Users & Roles
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage municipality accounts and permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className={primaryButton}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {success && (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Users",
            value: users.length,
            icon: Users
          },
          {
            label: "Administrators",
            value: users.filter(
              u => getRoleName(u) === "ADMIN"
            ).length,
            icon: Shield
          },
          {
            label: "Employees",
            value: users.filter(
              u => getRoleName(u) === "EMPLOYEE"
            ).length,
            icon: UserRound
          }
        ].map(card => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
              <card.icon size={22} />
            </div>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex gap-2 border-b border-slate-200 p-4">
          {["users", "roles"].map(item => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setTab(item);
                setError("");
              }}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium ${
                tab === item
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item === "users" ? "Users" : "Roles"}
            </button>
          ))}
        </div>

        <div className="p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-800">
              {tab === "users" ? "Registered Users" : "System Roles"}
            </h2>

            <button
              type="button"
              onClick={
                tab === "users" ? openUserModal : openRoleModal
              }
              className={primaryButton}
            >
              <Plus size={17} />
              {tab === "users" ? "Add User" : "Add Role"}
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Loading...
            </p>
          ) : (
            <div className="overflow-x-auto">
              {tab === "users" ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Full Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr
                        key={user.id}
                        className="border-t border-slate-100"
                      >
                        <td className="p-4">{user.id}</td>
                        <td className="p-4 font-medium">
                          {user.fullName}
                        </td>
                        <td className="p-4">{user.email}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {getRoleName(user)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Role Name</th>
                      <th className="p-4">Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(role => (
                      <tr
                        key={role.id}
                        className="border-t border-slate-100"
                      >
                        <td className="p-4">{role.id}</td>
                        <td className="p-4 font-semibold">
                          {role.name}
                        </td>
                        <td className="p-4">
                          {
                            users.filter(
                              u =>
                                Number(u.roleId ?? u.role?.id) === Number(role.id) ||
                                u.role?.name === role.name
                            ).length
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {((tab === "users" && users.length === 0) ||
                (tab === "roles" && roles.length === 0)) && (
                <p className="py-8 text-center text-slate-500">
                  No records found.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {modal === "user" ? "Add New User" : "Add New Role"}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-slate-500 hover:text-slate-800"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={
                modal === "user" ? createUser : createRole
              }
              className="space-y-4"
            >
              {modal === "user" ? (
                <>
                  <label className="block text-sm font-medium text-slate-700">
                    Full Name
                    <div className="relative mt-2">
                      <UserRound
                        size={17}
                        className="absolute left-3 top-3.5 text-slate-400"
                      />
                      <input
                        required
                        value={userForm.fullName}
                        onChange={e => setUserForm({
                          ...userForm,
                          fullName: e.target.value
                        })}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Email
                    <div className="relative mt-2">
                      <Mail
                        size={17}
                        className="absolute left-3 top-3.5 text-slate-400"
                      />
                      <input
                        required
                        type="email"
                        value={userForm.email}
                        onChange={e => setUserForm({
                          ...userForm,
                          email: e.target.value
                        })}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Password
                    <div className="relative mt-2">
                      <LockKeyhole
                        size={17}
                        className="absolute left-3 top-3.5 text-slate-400"
                      />
                      <input
                        required
                        type="password"
                        minLength={6}
                        value={userForm.password}
                        onChange={e => setUserForm({
                          ...userForm,
                          password: e.target.value
                        })}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Role
                    <select
                      required
                      value={userForm.roleId}
                      onChange={e => setUserForm({
                        ...userForm,
                        roleId: e.target.value
                      })}
                      className={`${inputClass} mt-2`}
                    >
                      <option value="">Select role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <label className="block text-sm font-medium text-slate-700">
                  Role Name
                  <input
                    required
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                    placeholder="Example: MANAGER"
                    className={`${inputClass} mt-2`}
                  />
                </label>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={primaryButton}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
