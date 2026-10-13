
import { useEffect, useState } from "react";
import {
  UserRound,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  Save,
  LockKeyhole,
  Mail,
  Phone,
  MapPin,
  Globe2,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Settings2
} from "lucide-react";
import api from "../api/axios";
import { getCurrentUser, isAdmin } from "../utils/auth";

const tabs = [
  {
    id: "profile",
    label: "My Profile",
    description: "Personal information",
    icon: UserRound
  },
  {
    id: "security",
    label: "Security",
    description: "Password & account",
    icon: ShieldCheck
  },
  {
    id: "municipality",
    label: "Municipality",
    description: "Organization details",
    icon: Building2
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Personal settings",
    icon: SlidersHorizontal
  }
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-500";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-7 flex items-start gap-4 border-b border-slate-100 pb-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={23} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#17365D]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function SaveButton({ loading, label = "Save Changes" }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={17} className="animate-spin" />
      ) : (
        <Save size={17} />
      )}
      {loading ? "Saving..." : label}
    </button>
  );
}

export default function Settings() {
  const admin = isAdmin();
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    email: ""
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [municipality, setMunicipality] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    emailNotifications: true
  });

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);

      const results = await Promise.allSettled([
        api.get("/settings/profile"),
        api.get("/settings/municipality"),
        api.get("/settings/preferences")
      ]);

      if (results[0].status === "fulfilled") {
        const data = results[0].value.data;
        const user = data.user || data.profile || data;

        setProfile({
          fullName: user.fullName || "",
          email: user.email || ""
        });
      }

      if (results[1].status === "fulfilled") {
        const data = results[1].value.data;
        const organization = data.municipality || data.settings || data;

        setMunicipality({
          name: organization.name || "",
          address: organization.address || "",
          phone: organization.phone || "",
          email: organization.email || ""
        });
      }

      if (results[2].status === "fulfilled") {
        const data = results[2].value.data;
        const prefs = data.preferences || data;

        setPreferences({
          language: prefs.language || "en",
          emailNotifications: prefs.emailNotifications ?? true
        });
      }

      if (results.some(result => result.status === "rejected")) {
        setMessage({
          type: "error",
          text: "Some settings could not be loaded. Check the backend connection."
        });
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  function changeTab(tab) {
    setActiveTab(tab);
    setMessage(null);
  }

  function success(text) {
    setMessage({ type: "success", text });
  }

  function failure(error, fallback) {
    setMessage({
      type: "error",
      text: error.response?.data?.message || fallback
    });
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data } = await api.put("/settings/profile", profile);
      const updated = data.user || data.profile || data;

      const stored = getCurrentUser() || {};

      sessionStorage.setItem(
        "user",
        JSON.stringify({
          ...stored,
          fullName: updated.fullName || profile.fullName,
          email: updated.email || profile.email
        })
      );

      success("Your profile has been updated successfully.");
      window.dispatchEvent(new Event("user-updated"));
    } catch (error) {
      failure(error, "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setMessage(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({
        type: "error",
        text: "New password and confirmation do not match."
      });
      return;
    }

    if (passwords.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "New password must contain at least 8 characters."
      });
      return;
    }

    setSaving(true);

    try {
      await api.put("/settings/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      success("Your password has been changed successfully.");
    } catch (error) {
      failure(error, "Unable to change your password.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMunicipality(event) {
    event.preventDefault();
    if (!admin) return;

    setSaving(true);
    setMessage(null);

    try {
      await api.put("/settings/municipality", municipality);
      success("Municipality information updated successfully.");
    } catch (error) {
      failure(error, "Unable to update municipality settings.");
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.put("/settings/preferences", preferences);
      success("Your preferences have been saved.");
    } catch (error) {
      failure(error, "Unable to save preferences.");
    } finally {
      setSaving(false);
    }
  }

  const fullName =
    profile.fullName || currentUser?.fullName || "Municipality User";

  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-[1450px] space-y-7 pb-12">
      {/* PAGE INTRODUCTION */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
          <Settings2 size={15} />
          Administration / Settings
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#17365D]">
          Account & Settings
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage your personal information, security, and municipality configuration.
        </p>
      </div>

      {/* PROFILE BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-[#17365D] p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[45px] border-white/5" />
        <div className="absolute right-32 bottom-[-110px] h-52 w-52 rounded-full bg-blue-500/10" />

        <div className="relative flex flex-wrap items-center gap-5">
          <div className="flex h-17 w-17 h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl font-extrabold">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
              My Account
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              {fullName}
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              {profile.email || currentUser?.email || "No email available"}
            </p>
          </div>

          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide">
            {admin ? "Administrator" : "Employee"}
          </span>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
        {/* SETTINGS NAVIGATION */}
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-4 pb-3 pt-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Settings Menu
          </p>

          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => changeTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold">{tab.label}</p>
                    <p className={`mt-0.5 text-xs ${
                      active ? "text-blue-500" : "text-slate-400"
                    }`}>
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mx-2 mt-5 rounded-xl bg-slate-50 p-4">
            <ShieldCheck size={20} className="text-blue-600" />
            <p className="mt-2 text-xs font-bold text-[#17365D]">
              Secure account
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Keep your account information and password up to date.
            </p>
          </div>
        </aside>

        {/* MAIN SETTINGS PANEL */}
        <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {message && (
            <div
              role="alert"
              className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message.type === "success"
                ? <CheckCircle2 size={19} className="shrink-0" />
                : <AlertCircle size={19} className="shrink-0" />}
              <span className="flex-1">{message.text}</span>
              <button type="button" onClick={() => setMessage(null)}>
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 size={22} className="animate-spin text-blue-600" />
              Loading settings...
            </div>
          ) : (
            <>
              {/* PROFILE */}
              {activeTab === "profile" && (
                <>
                  <SectionHeading
                    icon={UserRound}
                    title="Personal Information"
                    description="Update your name and email address used within the municipality system."
                  />

                  <form onSubmit={saveProfile} className="space-y-6">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-[#17365D]">
                            {fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {admin ? "System Administrator" : "Municipality Employee"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Full Name">
                        <div className="relative">
                          <UserRound size={17} className="absolute left-4 top-3.5 text-slate-400" />
                          <input
                            required
                            className={`${inputClass} pl-11`}
                            value={profile.fullName}
                            onChange={e => setProfile({
                              ...profile,
                              fullName: e.target.value
                            })}
                            placeholder="Enter full name"
                          />
                        </div>
                      </Field>

                      <Field label="Email Address">
                        <div className="relative">
                          <Mail size={17} className="absolute left-4 top-3.5 text-slate-400" />
                          <input
                            required
                            type="email"
                            className={`${inputClass} pl-11`}
                            value={profile.email}
                            onChange={e => setProfile({
                              ...profile,
                              email: e.target.value
                            })}
                            placeholder="name@example.com"
                          />
                        </div>
                      </Field>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-6">
                      <SaveButton loading={saving} label="Save Profile" />
                    </div>
                  </form>
                </>
              )}

              {/* SECURITY */}
              {activeTab === "security" && (
                <>
                  <SectionHeading
                    icon={ShieldCheck}
                    title="Password & Security"
                    description="Protect your account by updating your password regularly."
                  />

                  <div className="mb-7 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <LockKeyhole size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-[#17365D]">
                        Password Security
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Use a unique password with at least 8 characters. Avoid reusing passwords from other accounts.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={changePassword} className="max-w-2xl space-y-5">
                    <Field label="Current Password">
                      <input
                        required
                        type={showPasswords ? "text" : "password"}
                        className={inputClass}
                        value={passwords.currentPassword}
                        onChange={e => setPasswords({
                          ...passwords,
                          currentPassword: e.target.value
                        })}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                      />
                    </Field>

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="New Password">
                        <input
                          required
                          minLength={8}
                          type={showPasswords ? "text" : "password"}
                          className={inputClass}
                          value={passwords.newPassword}
                          onChange={e => setPasswords({
                            ...passwords,
                            newPassword: e.target.value
                          })}
                          placeholder="New password"
                          autoComplete="new-password"
                        />
                      </Field>

                      <Field label="Confirm Password">
                        <input
                          required
                          minLength={8}
                          type={showPasswords ? "text" : "password"}
                          className={inputClass}
                          value={passwords.confirmPassword}
                          onChange={e => setPasswords({
                            ...passwords,
                            confirmPassword: e.target.value
                          })}
                          placeholder="Confirm password"
                          autoComplete="new-password"
                        />
                      </Field>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                      {showPasswords ? "Hide passwords" : "Show passwords"}
                    </button>

                    <div className="flex justify-end border-t border-slate-100 pt-6">
                      <SaveButton loading={saving} label="Update Password" />
                    </div>
                  </form>
                </>
              )}

              {/* MUNICIPALITY */}
              {activeTab === "municipality" && (
                <>
                  <SectionHeading
                    icon={Building2}
                    title="Municipality Information"
                    description="Manage the official information associated with your municipality."
                  />

                  {!admin && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <ShieldCheck size={19} />
                      Only administrators can modify municipality information.
                    </div>
                  )}

                  <form onSubmit={saveMunicipality} className="space-y-5">
                    <Field label="Municipality Name">
                      <div className="relative">
                        <Building2 size={17} className="absolute left-4 top-3.5 text-slate-400" />
                        <input
                          required
                          disabled={!admin}
                          className={`${inputClass} pl-11`}
                          value={municipality.name}
                          onChange={e => setMunicipality({
                            ...municipality,
                            name: e.target.value
                          })}
                          placeholder="Municipality name"
                        />
                      </div>
                    </Field>

                    <Field label="Office Address">
                      <div className="relative">
                        <MapPin size={17} className="absolute left-4 top-3.5 text-slate-400" />
                        <input
                          disabled={!admin}
                          className={`${inputClass} pl-11`}
                          value={municipality.address}
                          onChange={e => setMunicipality({
                            ...municipality,
                            address: e.target.value
                          })}
                          placeholder="Municipality office address"
                        />
                      </div>
                    </Field>

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Phone Number">
                        <div className="relative">
                          <Phone size={17} className="absolute left-4 top-3.5 text-slate-400" />
                          <input
                            type="tel"
                            disabled={!admin}
                            className={`${inputClass} pl-11`}
                            value={municipality.phone}
                            onChange={e => setMunicipality({
                              ...municipality,
                              phone: e.target.value
                            })}
                            placeholder="+961 ..."
                          />
                        </div>
                      </Field>

                      <Field label="Official Email">
                        <div className="relative">
                          <Mail size={17} className="absolute left-4 top-3.5 text-slate-400" />
                          <input
                            type="email"
                            disabled={!admin}
                            className={`${inputClass} pl-11`}
                            value={municipality.email}
                            onChange={e => setMunicipality({
                              ...municipality,
                              email: e.target.value
                            })}
                            placeholder="municipality@example.com"
                          />
                        </div>
                      </Field>
                    </div>

                    {admin && (
                      <div className="flex justify-end border-t border-slate-100 pt-6">
                        <SaveButton loading={saving} label="Save Municipality" />
                      </div>
                    )}
                  </form>
                </>
              )}

              {/* PREFERENCES */}
              {activeTab === "preferences" && (
                <>
                  <SectionHeading
                    icon={SlidersHorizontal}
                    title="Personal Preferences"
                    description="Customize your account preferences and notification settings."
                  />

                  <form onSubmit={savePreferences} className="space-y-7">
                    <div className="rounded-xl border border-slate-200 p-5">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                          <Globe2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#17365D]">
                            Language
                          </p>
                          <p className="text-xs text-slate-500">
                            Choose your preferred language.
                          </p>
                        </div>
                      </div>

                      <Field label="Preferred Language">
                        <select
                          className={inputClass}
                          value={preferences.language}
                          onChange={e => setPreferences({
                            ...preferences,
                            language: e.target.value
                          })}
                        >
                          <option value="en">English</option>
                          <option value="ar">Arabic</option>
                          <option value="fr">French</option>
                        </select>
                      </Field>

                      <p className="mt-3 text-xs text-slate-400">
                        This saves your language preference. Full interface translation requires a separate localization feature.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                          <BellRing size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#17365D]">
                            Email Notifications
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Save your preference for email alerts.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={preferences.emailNotifications}
                        aria-label="Email notifications"
                        onClick={() => setPreferences({
                          ...preferences,
                          emailNotifications: !preferences.emailNotifications
                        })}
                        className={`relative h-7 w-12 rounded-full transition ${
                          preferences.emailNotifications
                            ? "bg-blue-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                          preferences.emailNotifications
                            ? "left-6"
                            : "left-1"
                        }`} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400">
                      Email delivery is not enabled by this setting alone; an email service must also be configured.
                    </p>

                    <div className="flex justify-end border-t border-slate-100 pt-6">
                      <SaveButton loading={saving} label="Save Preferences" />
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
