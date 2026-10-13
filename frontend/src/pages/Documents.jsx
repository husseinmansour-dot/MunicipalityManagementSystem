
import { useEffect, useMemo, useState } from "react";
import {
  Files, UploadCloud, Search, FileText, FileImage,
  FileSpreadsheet, Download, Trash2, X, Plus,
  Loader2, FolderOpen, HardDrive, ShieldCheck,
  CheckCircle2, AlertCircle
} from "lucide-react";
import api from "../api/axios";
import { isAdmin } from "../utils/auth";

const categories = [
  "GENERAL", "CITIZEN", "PERMIT",
  "CONTRACT", "DECISION", "FINANCE"
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType) {
  if (mimeType?.startsWith("image/")) return FileImage;
  if (mimeType?.includes("spreadsheet")) return FileSpreadsheet;
  return FileText;
}

function Metric({ title, value, icon: Icon, color, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon size={21} />
      </div>
      <p className="text-3xl font-extrabold text-[#17365D]">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

export default function Documents() {
  const admin = isAdmin();

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "GENERAL"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDocuments() {
    setLoading(true);
    try {
      const { data } = await api.get("/documents");
      setDocuments(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return documents.filter(doc => {
      const matchesSearch =
        !term ||
        doc.title.toLowerCase().includes(term) ||
        doc.originalName.toLowerCase().includes(term) ||
        (doc.description || "").toLowerCase().includes(term);

      return matchesSearch &&
        (categoryFilter === "ALL" || doc.category === categoryFilter);
    });
  }, [documents, search, categoryFilter]);

  const storage = documents.reduce((sum, doc) => sum + doc.size, 0);
  const pdfCount = documents.filter(d => d.mimeType === "application/pdf").length;
  const categoryCount = new Set(documents.map(d => d.category)).size;

  function openUpload() {
    setForm({ title: "", description: "", category: "GENERAL" });
    setFile(null);
    setError("");
    setModal(true);
  }

  async function uploadDocument(event) {
    event.preventDefault();

    if (!file) {
      setError("Please select a file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Maximum file size is 10 MB.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("title", form.title);
      body.append("description", form.description);
      body.append("category", form.category);

      await api.post("/documents", body, {
        headers: { "Content-Type": undefined }
      });

      setModal(false);
      setSuccess("Document uploaded successfully.");
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadDocument(doc) {
    try {
      setError("");
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType: "blob"
      });

      const blob = new Blob([response.data], {
        type: doc.mimeType || "application/octet-stream"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Unable to download the document.");
    }
  }

  async function deleteDocument(doc) {
    if (!window.confirm(`Permanently delete "${doc.title}"?`)) return;

    try {
      await api.delete(`/documents/${doc.id}`);
      setSuccess("Document deleted successfully.");
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete document.");
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 pb-12">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">
            MUNICIPAL ADMINISTRATION / DOCUMENTS
          </p>
          <h1 className="text-3xl font-extrabold text-[#17365D]">
            Document Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Organize, store, and retrieve municipal documents securely.
          </p>
        </div>

        <button
          onClick={openUpload}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
        >
          <Plus size={18} />
          Upload Document
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={18} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess("")}><X size={16} /></button>
        </div>
      )}

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total Documents" value={documents.length}
          icon={Files} color="bg-indigo-50 text-indigo-600"
          detail="Stored records" />
        <Metric title="PDF Documents" value={pdfCount}
          icon={FileText} color="bg-rose-50 text-rose-600"
          detail="PDF files" />
        <Metric title="Categories Used" value={categoryCount}
          icon={FolderOpen} color="bg-blue-50 text-blue-600"
          detail="Document classifications" />
        <Metric title="Storage Used" value={formatBytes(storage)}
          icon={HardDrive} color="bg-emerald-50 text-emerald-600"
          detail="Stored file sizes" />
      </div>

      {/* DOCUMENT DIRECTORY */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h2 className="text-lg font-bold text-[#17365D]">
              Document Library
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filtered.length} documents found
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
              <Search size={17} className="text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-44 bg-transparent py-2.5 text-sm outline-none sm:w-56"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-20 text-slate-500">
            <Loader2 size={22} className="animate-spin" />
            Loading documents...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-5 rounded-3xl bg-blue-50 p-6 text-blue-600">
              <FolderOpen size={42} />
            </div>
            <h3 className="text-xl font-bold text-[#17365D]">
              {documents.length === 0
                ? "Your document library is empty"
                : "No matching documents"}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {documents.length === 0
                ? "Upload your first document to start organizing municipal records."
                : "Try a different search term or category."}
            </p>
            {documents.length === 0 && (
              <button
                onClick={openUpload}
                className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Upload First Document
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Uploaded By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const Icon = fileIcon(doc.mimeType);

                  return (
                    <tr
                      key={doc.id}
                      className="border-t border-slate-100 transition hover:bg-blue-50/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Icon size={21} />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[250px] truncate font-bold text-[#17365D]">
                              {doc.title}
                            </p>
                            <p className="mt-1 max-w-[250px] truncate text-xs text-slate-400">
                              {doc.originalName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                          {doc.category.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatBytes(doc.size)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {doc.uploadedBy?.fullName || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            title="Download"
                            onClick={() => downloadDocument(doc)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Download size={18} />
                          </button>
                          {admin && (
                            <button
                              title="Delete"
                              onClick={() => deleteDocument(doc)}
                              className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#17365D]">
                  Upload Document
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a file to the municipal document library.
                </p>
              </div>
              <button onClick={() => setModal(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={uploadDocument} className="space-y-5">
              <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-5 py-8 text-center hover:bg-blue-50">
                <UploadCloud size={36} className="mb-3 text-blue-600" />
                <span className="text-sm font-bold text-[#17365D]">
                  {file ? file.name : "Click to select a document"}
                </span>
                <span className="mt-2 text-xs text-slate-500">
                  PDF, JPG, PNG, DOCX, XLSX — maximum 10 MB
                </span>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                  className="sr-only"
                  onChange={e => {
                    const selected = e.target.files?.[0] || null;
                    setFile(selected);
                    if (selected && !form.title) {
                      setForm(prev => ({
                        ...prev,
                        title: selected.name.replace(/\.[^.]+$/, "")
                      }));
                    }
                  }}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Document Title
                </span>
                <input
                  required
                  maxLength={200}
                  className={inputClass}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Category
                </span>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Description
                </span>
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="Optional document description..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </label>

              {error && (
                <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}
                  {saving ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
