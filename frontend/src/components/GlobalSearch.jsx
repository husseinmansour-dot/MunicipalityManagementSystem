
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Users,
  ClipboardList,
  FileCheck,
  Loader2,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const emptyResults = {
  citizens: [],
  requests: [],
  permits: []
};

function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(emptyResults);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults(emptyResults);
      setLoading(false);
      setError("");
      return;
    }

    let active = true;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/search", {
          params: { q: trimmed }
        });

        if (active) {
          setResults(response.data);
        }
      } catch (err) {
        if (active) {
          setResults(emptyResults);
          setError(
            err.response?.data?.message || "Search failed"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const total =
    results.citizens.length +
    results.requests.length +
    results.permits.length;

  function openResult(path) {
    navigate(path);
    setQuery("");
    setOpen(false);
    setResults(emptyResults);
  }

  const sections = [
    {
      title: "Citizens",
      icon: Users,
      path: "/citizens",
      items: results.citizens,
      label: item => `${item.firstName} ${item.lastName}`,
      description: item => `National ID: ${item.nationalId}`
    },
    {
      title: "Requests",
      icon: ClipboardList,
      path: "/requests",
      items: results.requests,
      label: item => `Request #${item.id} — ${item.type}`,
      description: item =>
        `${item.citizen.firstName} ${item.citizen.lastName} · ${item.status}`
    },
    {
      title: "Permits",
      icon: FileCheck,
      path: "/permits",
      items: results.permits,
      label: item => `Permit #${item.id} — ${item.type}`,
      description: item =>
        `${item.citizen.firstName} ${item.citizen.lastName} · ${item.status}`
    }
  ];

  return (
    <div
      ref={containerRef}
      className="relative hidden md:block"
    >
      <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2">
        <Search size={18} className="text-slate-400" />

        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search..."
          aria-label="Global search"
          className="w-44 bg-transparent text-sm outline-none"
        />

        {loading && (
          <Loader2
            size={15}
            className="animate-spin text-slate-400"
          />
        )}

        {query && !loading && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
          >
            <X size={15} className="text-slate-400" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[390px] max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">
              Search Results
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {error && (
              <p className="px-4 py-5 text-sm text-red-600">
                {error}
              </p>
            )}

            {!error && !loading && total === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                No matching records found.
              </p>
            )}

            {!error &&
              sections.map(section => {
                if (!section.items.length) return null;

                const Icon = section.icon;

                return (
                  <div key={section.title} className="py-2">
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {section.title}
                    </p>

                    {section.items.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openResult(section.path)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                      >
                        <Icon
                          size={18}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {section.label(item)}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {section.description(item)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
