import { useEffect, useState } from "react";

import {

  Users, Plus, Search, Eye, Pencil, ChevronLeft,

  ChevronRight, RefreshCw, Trash2

} from "lucide-react";

import api from "../api/axios";

import AddCitizenModal from "../components/AddCitizenModal";

import ViewCitizenModal from "../components/ViewCitizenModal";

import EditCitizenModal from "../components/EditCitizenModal";

import DeleteCitizenModal from "../components/DeleteCitizenModal";



function Citizens() {

  const [citizens, setCitizens] = useState([]);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [addressFilter, setAddressFilter] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedCitizenId, setSelectedCitizenId] = useState(null);

  const [editingCitizenId, setEditingCitizenId] = useState(null);

  const [citizenToDelete, setCitizenToDelete] = useState(null);






  useEffect(() => {

    const controller = new AbortController();

    async function fetchCitizens() {

      setLoading(true);

      setError("");

      try {

        const response = await api.get("/citizens", {

            params: {

              page,

              limit: 10,

              ...(search.trim() && { name: search.trim() }),

              ...(addressFilter.trim() && {

                address: addressFilter.trim()

              })

            },

            signal: controller.signal

          });

        setCitizens(Array.isArray(response.data?.data) ? response.data.data : []);

        setPagination(response.data?.pagination ?? { page, limit: 10, total: 0, totalPages: 0 });

      } catch (err) {

        if (controller.signal.aborted || err.code === "ERR_CANCELED") return;

        setCitizens([]);

        if (err.response?.status === 401) setError("Please log in to view citizens.");

        else if (err.response?.status === 403) setError("You do not have permission to view citizens.");

        else setError(err.response?.data?.message || "Unable to load citizens. Check your backend connection.");

      } finally {

        if (!controller.signal.aborted) setLoading(false);

      }

    }

    fetchCitizens();

    return () => controller.abort();

  }, [page, refreshKey, search, addressFilter]);







  const displayedCitizens = citizens;
  const isBusy = loading;
  const activeError = error;



  function refresh() {

    setRefreshKey((key) => key + 1);

  }



  return (

    <div className="space-y-6">

      {/* Heading */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>

          <h2 className="text-2xl font-bold text-slate-800">Citizens Management</h2>

          <p className="text-sm text-slate-500 mt-2">Manage registered municipality citizens.</p>

        </div>

        <button type="button" onClick={() => setShowAddModal(true)}

          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors">

          <Plus size={18} /> Add Citizen

        </button>

      </div>



      {/* Summary */}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">

        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Users size={24} /></div>

        <div>

          <p className="text-sm text-slate-500">Total Registered Citizens</p>

          <h3 className="text-2xl font-bold text-slate-800">{pagination.total}</h3>

        </div>

      </div>



      {/* Table */}

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="relative w-full md:max-w-sm">

            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input type="search" value={search} onChange={(event) => {

                  setSearch(event.target.value);

                  setPage(1);

                }}

              placeholder="Search all citizens by name..." aria-label="Search all citizens by name"

              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />

          </div>

          <div className="w-full md:w-56">

            <select

              value={addressFilter}

              onChange={(event) => {

                setAddressFilter(event.target.value);

                setPage(1);

              }}

              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"

            >

              <option value="">All areas</option>

              <option value="Beirut">Beirut</option>

              <option value="Saida">Saida</option>

              <option value="Janoub">Janoub</option>

            </select>

          </div>

          <button type="button" onClick={refresh}

            className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">

            <RefreshCw size={17} /> Refresh

          </button>

        </div>



        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-slate-50 border-y border-slate-100">

              <tr className="text-xs uppercase tracking-wide text-slate-500">

                <th className="px-6 py-4">ID</th>

                <th className="px-6 py-4">Citizen</th>

                <th className="px-6 py-4">National ID</th>

                <th className="px-6 py-4">Phone</th>

                <th className="px-6 py-4">Address</th>

                <th className="px-6 py-4 text-right">Actions</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {!isBusy && !activeError && displayedCitizens.map((citizen) => (

                <tr key={citizen.id} className="hover:bg-slate-50 transition-colors">

                  <td className="px-6 py-4 text-sm text-slate-500">#{citizen.id}</td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{citizen.firstName} {citizen.lastName}</td>

                  <td className="px-6 py-4 text-sm text-slate-600">{citizen.nationalId}</td>

                  <td className="px-6 py-4 text-sm text-slate-600">{citizen.phoneNumber || "—"}</td>

                  <td className="px-6 py-4 text-sm text-slate-600">{citizen.address || "—"}</td>

                  <td className="px-6 py-4">

                    <div className="flex justify-end gap-2">

                      <button type="button" onClick={() => setSelectedCitizenId(citizen.id)}

                        title="View citizen details" aria-label={`View ${citizen.firstName} ${citizen.lastName}`}

                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={17} /></button>

                      <button type="button" onClick={() => setEditingCitizenId(citizen.id)}

                        title="Edit citizen" aria-label={`Edit ${citizen.firstName} ${citizen.lastName}`}

                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={17} /></button>

                      <button type="button" onClick={() => setCitizenToDelete(citizen)}

                        title="Delete citizen" aria-label={`Delete ${citizen.firstName} ${citizen.lastName}`}

                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={17} /></button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          {isBusy && <p className="text-center py-12 text-slate-500">{search.trim() ? "Searching citizens..." : "Loading citizens..."}</p>}

          {!isBusy && activeError && <p role="alert" className="text-center py-12 px-4 text-red-600">{activeError}</p>}

          {!isBusy && !activeError && displayedCitizens.length === 0 &&

            <p className="text-center py-12 text-slate-500">No citizens found.</p>}

        </div>



        {/* Pagination for filtered citizens. */}

        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">

          <p className="text-sm text-slate-500">

            {`Page ${pagination.page} of ${Math.max(1, pagination.totalPages)} · ${pagination.total} matching citizens`}

          </p>

          <div className="flex gap-2">

              <button type="button" disabled={loading || page <= 1}

                onClick={() => setPage((current) => current - 1)}

                className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40">

                <ChevronLeft size={16} /> Previous

              </button>

              <button type="button"

                disabled={loading || pagination.totalPages === 0 || page >= pagination.totalPages}

                onClick={() => setPage((current) => current + 1)}

                className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40">

                Next <ChevronRight size={16} />

              </button>

          </div>

        </div>

      </section>



      {showAddModal && (

        <AddCitizenModal onClose={() => setShowAddModal(false)} onSuccess={() => {

          setShowAddModal(false); setPage(1); refresh();

        }} />

      )}

      {selectedCitizenId !== null && (

        <ViewCitizenModal citizenId={selectedCitizenId} onClose={() => setSelectedCitizenId(null)} />

      )}

      {editingCitizenId !== null && (

        <EditCitizenModal citizenId={editingCitizenId} onClose={() => setEditingCitizenId(null)}

          onSuccess={() => { setEditingCitizenId(null); refresh(); }} />

      )}

      {citizenToDelete !== null && (

        <DeleteCitizenModal citizen={citizenToDelete} onClose={() => setCitizenToDelete(null)}

          onSuccess={() => { setCitizenToDelete(null); setPage(1); refresh(); }} />

      )}

    </div>

  );

}



export default Citizens;
