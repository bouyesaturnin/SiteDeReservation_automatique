import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getRoomImage } from "../api/roomImages";
import {
  Users, Plus, Loader2, ArrowUpRight, BedDouble,
  X, Check, Pencil, Trash2, AlertTriangle, ArrowLeft, Settings,
  CalendarDays, Search, Euro, Clock, CheckCircle2, XCircle,
  RefreshCw, User, ChevronDown, Images, ImagePlus, Link,
} from "lucide-react";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useToast } from "../context/ToastContext";
import DashboardStats from "../components/DashboardStats";
import LazyImage from "../components/LazyImage";
import Skeleton from "../components/Skeleton";

const EMPTY_ROOM = {
  name: "", room_type: "SINGLE", price_per_night: "", capacity: 2, image_url: "",
};
const TYPE_LABELS = { SINGLE: "Simple", DOUBLE: "Double", SUITE: "Suite" };

const formatDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const nights = (ci, co) => Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));

const bookingStatus = (b) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ci = new Date(b.check_in); const co = new Date(b.check_out);
  if (co <= today) return "past";
  if (ci <= today && co > today) return "active";
  return "upcoming";
};

const STATUS_CONFIG = {
  upcoming: { label: "À venir",   cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  active:   { label: "En cours",  cls: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  past:     { label: "Terminée",  cls: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

/* ── RoomForm ── */
const RoomForm = ({ value, onChange }) => (
  <div className="space-y-4">
    {[
      { type: "text",   placeholder: "Nom de la chambre *",    key: "name" },
      { type: "number", placeholder: "Prix par nuit (€) *",    key: "price_per_night" },
      { type: "number", placeholder: "Capacité (personnes)",   key: "capacity" },
      { type: "url",    placeholder: "URL de l'image (optionnel)", key: "image_url" },
    ].map(({ type, placeholder, key }) => (
      <input key={key} type={type} placeholder={placeholder} value={value[key]}
        onChange={e => onChange({ ...value, [key]: e.target.value })}
        className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    ))}
    <select value={value.room_type} onChange={e => onChange({ ...value, room_type: e.target.value })}
      className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="SINGLE">Simple</option>
      <option value="DOUBLE">Double</option>
      <option value="SUITE">Suite</option>
    </select>
  </div>
);

/* ── Onglet Réservations ── */
const BookingsTab = ({ rooms }) => {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);

  const fetchBookings = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (roomFilter) params.room_id = roomFilter;
    api.get("staff/bookings/", { params })
      .then(res => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast("Erreur lors du chargement.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [search, statusFilter, roomFilter]);

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      setCancelling(true);
      await api.delete(`staff/bookings/${cancelId}/`);
      setBookings(prev => prev.filter(b => b.id !== cancelId));
      setCancelId(null);
      toast("Réservation annulée.", "success");
    } catch {
      toast("Erreur lors de l'annulation.", "error");
    } finally {
      setCancelling(false);
    }
  };

  /* KPIs locaux */
  const kpis = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter(b => bookingStatus(b) === "active").length;
    const upcoming = bookings.filter(b => bookingStatus(b) === "upcoming").length;
    const revenue = bookings.reduce((s, b) => s + parseFloat(b.total_price || 0), 0);
    return { total, active, upcoming, revenue };
  }, [bookings]);

  const visible = bookings.slice(0, visibleCount);

  return (
    <div className="space-y-6">

      {/* KPI MINI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CalendarDays, label: "Total réservations", value: kpis.total, color: "bg-blue-600" },
          { icon: Clock,        label: "À venir",            value: kpis.upcoming, color: "bg-violet-600" },
          { icon: CheckCircle2, label: "En cours",           value: kpis.active,   color: "bg-green-600" },
          { icon: Euro,         label: "Revenus affichés",   value: `${kpis.revenue.toLocaleString("fr-FR")}€`, color: "bg-amber-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl shadow p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest">{label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Client ou chambre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          <option value="upcoming">À venir</option>
          <option value="active">En cours</option>
          <option value="past">Passées</option>
        </select>

        <select
          value={roomFilter}
          onChange={e => setRoomFilter(e.target.value)}
          className="border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les chambres</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition font-semibold"
        >
          <RefreshCw size={15} /> Actualiser
        </button>

        {(search || statusFilter || roomFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); setRoomFilter(""); }}
            className="text-sm text-red-500 hover:underline font-semibold"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow text-center">
          <CalendarDays size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 font-semibold">Aucune réservation trouvée</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden">
          {/* En-têtes */}
          <div className="hidden md:grid grid-cols-[2fr_2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b dark:border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Client</span>
            <span>Chambre</span>
            <span>Dates</span>
            <span>Nuits</span>
            <span>Total</span>
            <span>Statut</span>
            <span />
          </div>

          <div className="divide-y dark:divide-gray-800">
            {visible.map(b => {
              const st = bookingStatus(b);
              const n = nights(b.check_in, b.check_out);
              return (
                <div key={b.id} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">

                  {/* Client */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-blue-600 dark:text-blue-300">
                        {b.username?.[0]?.toUpperCase() || <User size={14} />}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{b.username}</p>
                      {b.user_email && <p className="text-xs text-gray-400 truncate max-w-[120px]">{b.user_email}</p>}
                    </div>
                  </div>

                  {/* Chambre */}
                  <div className="flex items-center gap-2 text-sm">
                    <BedDouble size={15} className="text-blue-500 shrink-0" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {b.room_details?.name || "—"}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatDate(b.check_in)}</span>
                    <span className="mx-1 text-gray-300">→</span>
                    <span>{formatDate(b.check_out)}</span>
                  </div>

                  {/* Nuits */}
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:block">
                    {n} nuit{n > 1 ? "s" : ""}
                  </div>

                  {/* Total */}
                  <div className="text-base font-black text-gray-900 dark:text-white">
                    {parseFloat(b.total_price).toFixed(0)}€
                  </div>

                  {/* Statut */}
                  <div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_CONFIG[st].cls}`}>
                      {STATUS_CONFIG[st].label}
                    </span>
                  </div>

                  {/* Action */}
                  <div>
                    {st !== "past" && (
                      <button
                        onClick={() => setCancelId(b.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition"
                        title="Annuler"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Voir plus */}
          {bookings.length > visibleCount && (
            <div className="px-6 py-4 border-t dark:border-gray-800 text-center">
              <button
                onClick={() => setVisibleCount(v => v + 15)}
                className="flex items-center gap-2 mx-auto text-sm font-bold text-blue-600 hover:underline"
              >
                Voir plus <ChevronDown size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal annulation */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCancelId(null)} />
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full relative z-10 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Annuler cette réservation ?</h3>
            <p className="text-gray-400 text-sm mb-6">Cette action est irréversible et libérera les dates pour d'autres clients.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="flex-1 border dark:border-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Retour
              </button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition flex items-center justify-center gap-2">
                {cancelling ? <Loader2 size={18} className="animate-spin" /> : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   PAGE DASHBOARD
══════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("rooms");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { settings: globalSettings, setSettings: setGlobalSettings } = useSiteSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ROOM);
  const [addError, setAddError] = useState("");

  const [editRoom, setEditRoom] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_ROOM);
  const [editError, setEditError] = useState("");

  const [deleteRoom, setDeleteRoom] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [imagesRoom, setImagesRoom] = useState(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [roomImages, setRoomImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get("rooms/");
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const openSettings = () => {
    setLocalSettings({ ...globalSettings });
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await api.patch("settings/", localSettings);
      setGlobalSettings(res.data);
      setLocalSettings(res.data);
      toast("Paramètres sauvegardés !", "success");
    } catch {
      toast("Erreur lors de la sauvegarde.", "error");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleAdd = async () => {
    setAddError("");
    if (!addForm.name || !addForm.price_per_night) { setAddError("Le nom et le prix sont obligatoires."); return; }
    try {
      setSaving(true);
      await api.post("rooms/", { ...addForm, price_per_night: Number(addForm.price_per_night), capacity: Number(addForm.capacity) });
      setAddOpen(false); setAddForm(EMPTY_ROOM); fetchRooms();
      toast("Chambre ajoutée !", "success");
    } catch (err) {
      setAddError(err.response?.data ? Object.values(err.response.data).flat().join(" ") : "Erreur lors de l'ajout.");
    } finally { setSaving(false); }
  };

  const openEdit = (room) => {
    setEditRoom(room);
    setEditForm({ name: room.name, room_type: room.room_type, price_per_night: room.price_per_night, capacity: room.capacity, image_url: room.image_url || "" });
    setEditError("");
  };

  const handleEdit = async () => {
    setEditError("");
    if (!editForm.name || !editForm.price_per_night) { setEditError("Le nom et le prix sont obligatoires."); return; }
    try {
      setSaving(true);
      await api.patch(`rooms/${editRoom.id}/`, { ...editForm, price_per_night: Number(editForm.price_per_night), capacity: Number(editForm.capacity) });
      setEditRoom(null); fetchRooms();
      toast("Chambre modifiée.", "success");
    } catch (err) {
      setEditError(err.response?.data ? Object.values(err.response.data).flat().join(" ") : "Erreur lors de la modification.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`rooms/${deleteRoom.id}/`);
      setDeleteRoom(null); fetchRooms();
      toast("Chambre supprimée.", "success");
    } catch { toast("Erreur lors de la suppression.", "error"); }
    finally { setDeleting(false); }
  };

  const openImages = async (room) => {
    setImagesRoom(room);
    setNewImageUrl("");
    setImagesLoading(true);
    try {
      const res = await api.get(`rooms/${room.id}/images/`);
      setRoomImages(Array.isArray(res.data) ? res.data : []);
    } catch { toast("Erreur lors du chargement des images.", "error"); }
    finally { setImagesLoading(false); }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    setAddingImage(true);
    try {
      const res = await api.post(`rooms/${imagesRoom.id}/images/`, { url: newImageUrl.trim(), order: roomImages.length });
      setRoomImages(prev => [...prev, res.data]);
      setNewImageUrl("");
      fetchRooms();
      toast("Photo ajoutée.", "success");
    } catch { toast("Erreur lors de l'ajout.", "error"); }
    finally { setAddingImage(false); }
  };

  const handleDeleteImage = async (imgId) => {
    try {
      await api.delete(`rooms/${imagesRoom.id}/images/${imgId}/`);
      setRoomImages(prev => prev.filter(i => i.id !== imgId));
      fetchRooms();
      toast("Photo supprimée.", "success");
    } catch { toast("Erreur lors de la suppression.", "error"); }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2"><Skeleton className="h-12 w-64" /><Skeleton className="h-4 w-48" /></div>
          <div className="flex gap-3"><Skeleton className="h-12 w-36" /><Skeleton className="h-12 w-44" /></div>
        </div>
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden">
              <Skeleton className="h-52 rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const TABS = [
    { key: "rooms",    label: "Chambres",     icon: BedDouble },
    { key: "bookings", label: "Réservations", icon: CalendarDays },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">

      {/* RETOUR */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition text-sm font-semibold mb-6">
        <ArrowLeft size={18} /> Retour
      </button>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-2">
            Dashboard <span className="text-blue-600">Pro</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Gestionnaire de disponibilités et revenus.</p>
        </div>
        {activeTab === "rooms" && (
          <div className="flex items-center gap-3">
            <button onClick={openSettings} className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-3 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <Settings size={18} /> Personnaliser
            </button>
            <button onClick={() => { setAddOpen(true); setAddError(""); setAddForm(EMPTY_ROOM); }} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition">
              <Plus size={18} /> Ajouter une chambre
            </button>
          </div>
        )}
      </div>

      {/* ONGLETS */}
      <div className="flex items-center gap-1 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === key
                ? "bg-white dark:bg-gray-900 text-blue-600 shadow"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ──── ONGLET CHAMBRES ──── */}
      {activeTab === "rooms" && (
        <>
          <DashboardStats />

          {/* SETTINGS PANEL */}
          {settingsOpen && localSettings && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-8 mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings size={22} className="text-blue-600" /> Personnalisation du site
                </h2>
                <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-black text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">Identité</h3>
                  {[
                    { label: "Nom du site", key: "site_name", type: "text" },
                    { label: "Slogan",      key: "tagline",   type: "text" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">{label}</label>
                      <input type={type} value={localSettings[key] || ""} onChange={e => setLocalSettings({...localSettings, [key]: e.target.value})}
                        className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Couleur principale</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={localSettings.primary_color} onChange={e => setLocalSettings({...localSettings, primary_color: e.target.value})} className="w-12 h-12 rounded-lg border cursor-pointer" />
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{localSettings.primary_color}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">Page d'accueil</h3>
                  {[
                    { label: "Titre principal", key: "hero_title",    type: "text" },
                    { label: "Sous-titre",      key: "hero_subtitle", type: "text" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">{label}</label>
                      <input type={type} value={localSettings[key] || ""} onChange={e => setLocalSettings({...localSettings, [key]: e.target.value})}
                        className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 md:col-span-2">
                  <h3 className="font-black text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">Footer</h3>
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Description de l'hôtel</label>
                    <textarea rows={3} value={localSettings.footer_description || ""} onChange={e => setLocalSettings({...localSettings, footer_description: e.target.value})}
                      className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Adresse",    key: "footer_address", type: "text"  },
                      { label: "Téléphone",  key: "footer_phone",   type: "text"  },
                      { label: "Email",      key: "footer_email",   type: "email" },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">{label}</label>
                        <input type={type} value={localSettings[key] || ""} onChange={e => setLocalSettings({...localSettings, [key]: e.target.value})}
                          className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t dark:border-gray-700">
                <h3 className="font-black text-gray-700 dark:text-gray-300 text-sm uppercase tracking-widest">Tarification dynamique</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Supplément weekend (%)", key: "weekend_surcharge", hint: "Vendredis & Samedis" },
                    { label: "Supplément haute saison (%)", key: "peak_surcharge", hint: "Mois de haute saison" },
                  ].map(({ label, key, hint }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">{label}</label>
                      <input type="number" min="0" max="200" value={localSettings[key] ?? 0}
                        onChange={e => setLocalSettings({...localSettings, [key]: Number(e.target.value)})}
                        className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <p className="text-xs text-gray-400 mt-1">{hint}</p>
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Mois haute saison</label>
                    <input type="text" value={localSettings.peak_months ?? "7,8"} placeholder="Ex: 6,7,8,12"
                      onChange={e => setLocalSettings({...localSettings, peak_months: e.target.value})}
                      className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-400 mt-1">Numéros séparés par virgule (1=Jan … 12=Déc)</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t dark:border-gray-700">
                <button onClick={handleSaveSettings} disabled={settingsSaving} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                  {settingsSaving ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Enregistrer</>}
                </button>
                <button onClick={() => setSettingsOpen(false)} className="px-6 py-3 rounded-xl font-bold border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* ÉTAT VIDE */}
          {rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-2xl shadow text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <BedDouble size={36} className="text-blue-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Aucune chambre</h3>
              <p className="text-gray-400 mb-6">Ajoutez votre première chambre pour commencer.</p>
              <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">
                <Plus size={18} /> Ajouter une chambre
              </button>
            </div>
          )}

          {/* GRILLE CHAMBRES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow hover:shadow-lg transition overflow-hidden group">
                <div className="h-52 bg-gray-100 overflow-hidden cursor-pointer relative" onClick={() => navigate(`/room/${room.id}`)}>
                  <LazyImage src={getRoomImage(room)} alt={room.name} fallback={`https://picsum.photos/seed/fallback-${room.id}/800/500`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/80 text-gray-700">{TYPE_LABELS[room.room_type] || room.room_type}</span>
                    {room.images && room.images.length > 0 && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-black/50 text-white flex items-center gap-1">
                        <Images size={11} /> {room.images.length}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={e => { e.stopPropagation(); openEdit(room); }} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow text-blue-600 hover:bg-blue-600 hover:text-white transition" title="Modifier"><Pencil size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); setDeleteRoom(room); }} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow text-red-500 hover:bg-red-500 hover:text-white transition" title="Supprimer"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition" onClick={() => navigate(`/room/${room.id}`)}>
                    {room.name || "Chambre"}
                  </h3>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Users size={16} /> {room.capacity || 0} pers.</span>
                    <span className="flex items-center gap-1"><BedDouble size={16} /> {TYPE_LABELS[room.room_type] || room.room_type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-black dark:text-white">{room.price_per_night}€<span className="text-sm font-normal text-gray-400"> /nuit</span></span>
                    <div className="flex gap-2">
                      <button onClick={() => openImages(room)} className="p-2 rounded-lg border text-purple-600 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/30 transition" title="Gérer les photos"><Images size={15} /></button>
                      <button onClick={() => openEdit(room)} className="p-2 rounded-lg border text-blue-600 border-blue-200 hover:bg-blue-50 transition" title="Modifier"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteRoom(room)} className="p-2 rounded-lg border text-red-500 border-red-200 hover:bg-red-50 transition" title="Supprimer"><Trash2 size={15} /></button>
                      <button onClick={() => navigate(`/reservation/${room.id}`)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold transition">
                        Réserver <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ──── ONGLET RÉSERVATIONS ──── */}
      {activeTab === "bookings" && <BookingsTab rooms={rooms} />}

      {/* MODAL AJOUT */}
      {addOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddOpen(false)} />
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-black dark:text-white">Ajouter une chambre</h2>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            {addError && <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl">{addError}</div>}
            <RoomForm value={addForm} onChange={setAddForm} />
            <button onClick={handleAdd} disabled={saving} className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl flex justify-center items-center gap-2 font-bold hover:bg-blue-700 transition">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Ajouter</>}
            </button>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION */}
      {editRoom && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditRoom(null)} />
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl w-full max-w-md relative z-10 shadow-xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-black dark:text-white">Modifier la chambre</h2>
              <button onClick={() => setEditRoom(null)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            {editError && <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl">{editError}</div>}
            <RoomForm value={editForm} onChange={setEditForm} />
            <button onClick={handleEdit} disabled={saving} className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl flex justify-center items-center gap-2 font-bold hover:bg-blue-700 transition">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Enregistrer</>}
            </button>
          </div>
        </div>
      )}

      {/* MODAL GALERIE */}
      {imagesRoom && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setImagesRoom(null)} />
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Images size={20} className="text-purple-500" /> Photos — {imagesRoom.name}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">{roomImages.length} photo{roomImages.length !== 1 ? 's' : ''} dans la galerie</p>
              </div>
              <button onClick={() => setImagesRoom(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={22} />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">

              {/* Ajouter une photo */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ImagePlus size={13} /> Ajouter une photo
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddImage()}
                      className="w-full pl-9 pr-4 py-2.5 border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    onClick={handleAddImage}
                    disabled={addingImage || !newImageUrl.trim()}
                    className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {addingImage ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Ajouter</>}
                  </button>
                </div>

                {/* Aperçu URL */}
                {newImageUrl.trim() && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={newImageUrl}
                      alt="aperçu"
                      className="w-16 h-12 object-cover rounded-lg border dark:border-gray-700"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <span className="text-xs text-gray-400 truncate">Aperçu</span>
                  </div>
                )}
              </div>

              {/* Grille des photos existantes */}
              {imagesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-purple-500" size={32} />
                </div>
              ) : roomImages.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Images size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">Aucune photo dans la galerie</p>
                  <p className="text-sm mt-1">Ajoutez des URLs ci-dessus pour enrichir cette chambre.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {roomImages.map((img, idx) => (
                    <div key={img.id} className="group relative rounded-xl overflow-hidden border dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-video">
                      <img
                        src={img.url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = `https://picsum.photos/seed/err-${img.id}/400/250`; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="opacity-0 group-hover:opacity-100 transition bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <span className="absolute bottom-1.5 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION CHAMBRE */}
      {deleteRoom && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteRoom(null)} />
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl w-full max-w-sm relative z-10 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Supprimer cette chambre ?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              "<span className="font-semibold">{deleteRoom.name}</span>" sera définitivement supprimée.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteRoom(null)} className="flex-1 border dark:border-gray-700 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <><Trash2 size={16} /> Supprimer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
