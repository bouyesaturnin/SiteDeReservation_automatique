import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getRoomImage } from '../api/roomImages';
import {
  Calendar, BedDouble, Star,
  Loader2, Trash2, AlertTriangle, ArrowRight, Plus,
  Euro, Moon,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import Skeleton from '../components/Skeleton';
import InvoiceDownloadButton from '../components/InvoiceDownloadButton';

const TYPE_LABELS = { SINGLE: 'Simple', DOUBLE: 'Double', SUITE: 'Suite' };
const TYPE_COLORS = {
  SINGLE: 'bg-blue-100 text-blue-700',
  DOUBLE: 'bg-purple-100 text-purple-700',
  SUITE: 'bg-amber-100 text-amber-700',
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const nightCount = (ci, co) =>
  Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));

const getStatus = (checkIn, checkOut) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ci = new Date(checkIn); const co = new Date(checkOut);
  if (co <= today) return 'past';
  if (ci <= today) return 'active';
  return 'upcoming';
};

const STATUS_CONFIG = {
  upcoming: { label: 'À venir',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  active:   { label: 'En cours',  cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  past:     { label: 'Terminée',  cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

const MesReservations = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSiteSettings();
  const username = JSON.parse(localStorage.getItem('proRdvUser') || '{}')?.username || '';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    api.get('bookings/')
      .then(res => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      setCancelling(true);
      await api.delete(`bookings/${cancelId}/`);
      setBookings(prev => prev.filter(b => b.id !== cancelId));
      setCancelId(null);
      toast('Réservation annulée.', 'success');
    } catch {
      toast("Erreur lors de l'annulation.", 'error');
    } finally {
      setCancelling(false);
    }
  };

  /* KPIs */
  const totalNights = bookings.reduce((s, b) => s + nightCount(b.check_in, b.check_out), 0);
  const totalSpent  = bookings.reduce((s, b) => s + parseFloat(b.total_price || 0), 0);
  const pastCount   = bookings.filter(b => getStatus(b.check_in, b.check_out) === 'past').length;

  const filtered = activeFilter === 'all'
    ? bookings
    : bookings.filter(b => getStatus(b.check_in, b.check_out) === activeFilter);

  const TABS = [
    { key: 'all',      label: 'Toutes',   count: bookings.length },
    { key: 'upcoming', label: 'À venir',  count: bookings.filter(b => getStatus(b.check_in, b.check_out) === 'upcoming').length },
    { key: 'active',   label: 'En cours', count: bookings.filter(b => getStatus(b.check_in, b.check_out) === 'active').length },
    { key: 'past',     label: 'Passées',  count: pastCount },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2"><Skeleton className="h-10 w-64" /><Skeleton className="h-4 w-40" /></div>
          <Skeleton className="h-11 w-44" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-12 w-80 mb-6" />
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden flex">
              <Skeleton className="w-44 h-36 rounded-none shrink-0" />
              <div className="flex-1 p-5 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Mes réservations</h1>
          <p className="text-gray-400 mt-1">{bookings.length} réservation{bookings.length > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => navigate('/explorer')}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition"
        >
          <Plus size={16} /> Nouvelle réservation
        </button>
      </div>

      {/* KPIs */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Calendar,   label: 'Séjours',       value: bookings.length,                       color: 'bg-blue-600' },
            { icon: Moon,       label: 'Nuits au total', value: totalNights,                           color: 'bg-violet-600' },
            { icon: Euro,       label: 'Total dépensé',  value: `${totalSpent.toFixed(0)}€`,           color: 'bg-amber-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl shadow p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest leading-tight">{label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AUCUNE RÉSERVATION */}
      {bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-gray-900 rounded-2xl shadow">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
            <Calendar size={36} className="text-blue-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Aucune réservation</h3>
          <p className="text-gray-400 mb-6">Vous n'avez pas encore réservé de chambre.</p>
          <button
            onClick={() => navigate('/explorer')}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
          >
            Explorer les chambres <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ONGLETS FILTRE */}
      {bookings.length > 0 && (
        <>
          <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
            {TABS.map(({ key, label, count }) => (
              <button key={key} onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  activeFilter === key
                    ? 'bg-white dark:bg-gray-900 text-blue-600 shadow'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                {label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                    activeFilter === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {/* LISTE */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Aucune réservation dans cette catégorie</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  settings={settings}
                  username={username}
                  onCancel={() => setCancelId(booking.id)}
                  onReview={() => navigate(`/room/${booking.room_details?.id}`, { state: { scrollToReview: true } })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL ANNULATION */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCancelId(null)} />
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full relative z-10 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Annuler la réservation ?</h3>
            <p className="text-gray-400 text-sm mb-6">Cette action est irréversible. La réservation sera définitivement supprimée.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800">
                Retour
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 flex items-center justify-center gap-2">
                {cancelling ? <Loader2 size={18} className="animate-spin" /> : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Carte réservation ── */
const BookingCard = ({ booking, settings, username, onCancel, onReview }) => {
  const navigate = useNavigate();
  const room = booking.room_details;
  const n = nightCount(booking.check_in, booking.check_out);
  const status = getStatus(booking.check_in, booking.check_out);
  const { label, cls } = STATUS_CONFIG[status];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row">

      {/* IMAGE */}
      <div
        className="sm:w-44 h-36 sm:h-auto bg-gray-100 shrink-0 overflow-hidden cursor-pointer relative"
        onClick={() => navigate(`/room/${room?.id}`)}
      >
        <img
          src={room ? getRoomImage(room) : 'https://picsum.photos/seed/booking/400/300'}
          onError={e => { e.target.src = 'https://picsum.photos/seed/booking/400/300'; }}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          alt={room?.name}
        />
        {/* Overlay statut sur mobile */}
        <div className="absolute top-2 left-2 sm:hidden">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${cls}`}>{label}</span>
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3
                className="text-lg font-black text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                onClick={() => navigate(`/room/${room?.id}`)}
              >
                {room?.name || 'Chambre'}
              </h3>
              {room?.room_type && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[room.room_type] || 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_LABELS[room.room_type]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <BedDouble size={14} />
              {room?.capacity} personne{room?.capacity > 1 ? 's' : ''}
            </div>
          </div>

          {/* Badge statut — desktop */}
          <span className={`hidden sm:inline text-xs font-bold px-3 py-1 rounded-full shrink-0 ${cls}`}>
            {label}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-4">
          {/* DATES */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar size={13} className="text-blue-500" />
              <span>{formatDate(booking.check_in)}</span>
            </div>
            <ArrowRight size={13} className="text-gray-300" />
            <div className="flex items-center gap-1">
              <Calendar size={13} className="text-blue-500" />
              <span>{formatDate(booking.check_out)}</span>
            </div>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400">{n} nuit{n > 1 ? 's' : ''}</span>
          </div>

          {/* ACTIONS + PRIX */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xl font-black text-gray-900 dark:text-white">{parseFloat(booking.total_price).toFixed(0)}€</p>
            </div>

            {/* Facture PDF */}
            <InvoiceDownloadButton booking={booking} settings={settings} username={username} />

            {/* Laisser un avis — réservations terminées */}
            {status === 'past' && (
              <button
                onClick={onReview}
                className="flex items-center gap-1.5 border border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                title="Laisser un avis"
              >
                <Star size={14} className="fill-amber-400 text-amber-400" /> Avis
              </button>
            )}

            {/* Annuler — réservations à venir */}
            {status === 'upcoming' && (
              <button
                onClick={onCancel}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition"
                title="Annuler"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MesReservations;
