import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getRoomImage } from '../api/roomImages';
import {
  BedDouble, Users, Search, SlidersHorizontal,
  ArrowRight, Star, X, ChevronDown, ChevronUp,
  CalendarDays, Calendar, CheckCircle, ArrowUpDown, Heart,
} from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useFavorites } from '../context/FavoriteContext';
import { useToast } from '../context/ToastContext';
import LazyImage from '../components/LazyImage';

const TYPE_LABELS = { SINGLE: 'Simple', DOUBLE: 'Double', SUITE: 'Suite' };
const TYPE_COLORS = {
  SINGLE: 'bg-blue-100 text-blue-700',
  DOUBLE: 'bg-purple-100 text-purple-700',
  SUITE: 'bg-amber-100 text-amber-700',
};
const SORT_OPTIONS = [
  { value: 'default',    label: 'Recommandés' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'capacity',   label: 'Capacité' },
  { value: 'rating',     label: 'Mieux notés' },
];

const todayStr = () => new Date().toISOString().split('T')[0];
const addDays = (str, n) => {
  const d = new Date(str); d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const nightCount = (ci, co) => Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));
const fmtShort = (str) => new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/* ── Étoiles statiques ── */
const Stars = ({ value, size = 13 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} size={size}
        className={n <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'} />
    ))}
  </div>
);

const Explorer = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const { settings } = useSiteSettings();
  const { isFavorited, toggle } = useFavorites();
  const toast = useToast();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  /* ── Dates ── */
  const [checkIn, setCheckIn]   = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [datesApplied, setDatesApplied] = useState(false);

  /* ── Filtres ── */
  const [showFilters, setShowFilters]       = useState(false);
  const [search, setSearch]                 = useState('');
  const [filterType, setFilterType]         = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [sortBy, setSortBy]                 = useState('default');

  const fetchRooms = useCallback((ci = '', co = '') => {
    setLoading(true);
    const params = {};
    if (ci && co) { params.check_in = ci; params.check_out = co; }
    api.get('rooms/', { params })
      .then(res => setRooms(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRooms(); }, []);

  const handleSearch = () => {
    if (checkIn && checkOut && checkOut > checkIn) {
      setDatesApplied(true);
      setVisibleCount(3);
      fetchRooms(checkIn, checkOut);
    }
  };

  const clearDates = () => {
    setCheckIn(''); setCheckOut('');
    setDatesApplied(false);
    setVisibleCount(3);
    fetchRooms();
  };

  const handleCheckInChange = (val) => {
    setCheckIn(val);
    if (checkOut && checkOut <= val) setCheckOut(addDays(val, 1));
    if (datesApplied) { setDatesApplied(false); fetchRooms(); }
  };

  const clearFilters = () => {
    setSearch(''); setFilterType(''); setFilterMinPrice('');
    setFilterMaxPrice(''); setFilterCapacity(''); setFilterMinRating(0);
    setSortBy('default'); setVisibleCount(3);
  };

  /* ── Filtrage + tri ── */
  const filtered = useMemo(() => {
    let list = rooms.filter(room => {
      if (search && !room.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && room.room_type !== filterType) return false;
      if (filterMinPrice && parseFloat(room.price_per_night) < parseFloat(filterMinPrice)) return false;
      if (filterMaxPrice && parseFloat(room.price_per_night) > parseFloat(filterMaxPrice)) return false;
      if (filterCapacity && room.capacity < parseInt(filterCapacity)) return false;
      if (filterMinRating > 0 && (!room.avg_rating || room.avg_rating < filterMinRating)) return false;
      return true;
    });

    switch (sortBy) {
      case 'price_asc':  list = [...list].sort((a, b) => a.price_per_night - b.price_per_night); break;
      case 'price_desc': list = [...list].sort((a, b) => b.price_per_night - a.price_per_night); break;
      case 'capacity':   list = [...list].sort((a, b) => b.capacity - a.capacity); break;
      case 'rating':     list = [...list].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)); break;
    }
    return list;
  }, [rooms, search, filterType, filterMinPrice, filterMaxPrice, filterCapacity, filterMinRating, sortBy]);

  /* ── Chips actifs ── */
  const activeChips = [
    filterType       && { key: 'type',       label: TYPE_LABELS[filterType],              clear: () => setFilterType('') },
    filterMinPrice   && { key: 'minp',        label: `Min ${filterMinPrice}€`,             clear: () => setFilterMinPrice('') },
    filterMaxPrice   && { key: 'maxp',        label: `Max ${filterMaxPrice}€`,             clear: () => setFilterMaxPrice('') },
    filterCapacity   && { key: 'cap',         label: `≥ ${filterCapacity} pers.`,          clear: () => setFilterCapacity('') },
    filterMinRating  && { key: 'rat',         label: `≥ ${filterMinRating}★`,              clear: () => setFilterMinRating(0) },
    sortBy !== 'default' && { key: 'sort',   label: SORT_OPTIONS.find(o => o.value === sortBy)?.label, clear: () => setSortBy('default') },
  ].filter(Boolean);

  const hasActiveFilters = activeChips.length > 0 || search;
  const nights = (checkIn && checkOut) ? nightCount(checkIn, checkOut) : 0;

  React.useEffect(() => { setVisibleCount(3); }, [search, filterType, filterMinPrice, filterMaxPrice, filterCapacity, filterMinRating, sortBy]);

  const handleReserve = (roomId) => {
    const state = (datesApplied && checkIn && checkOut) ? { check_in: checkIn, check_out: checkOut } : undefined;
    if (isLoggedIn) navigate(`/reservation/${roomId}`, { state });
    else navigate('/login');
  };

  const inputCls = 'text-gray-800 font-bold text-sm outline-none bg-transparent cursor-pointer w-full';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── HERO ── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-6">
            <Star size={14} fill="currentColor" />
            {rooms.length} chambre{rooms.length > 1 ? 's' : ''} {datesApplied ? 'disponible' : 'au total'}{rooms.length > 1 ? 's' : ''}
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">{settings.hero_title}</h1>
          <p className="text-blue-100 text-lg mb-10">{settings.hero_subtitle}</p>

          {/* WIDGET */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

              <div className="flex-1 px-5 py-4 flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <CalendarDays size={11} /> Arrivée
                </label>
                <input type="date" value={checkIn} min={todayStr()}
                  onChange={e => handleCheckInChange(e.target.value)} className={inputCls} />
                <p className="text-xs text-gray-400">{checkIn ? fmtShort(checkIn) : 'Choisir une date'}</p>
              </div>

              <div className="flex-1 px-5 py-4 flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={11} /> Départ
                </label>
                <input type="date" value={checkOut}
                  min={checkIn ? addDays(checkIn, 1) : addDays(todayStr(), 1)}
                  onChange={e => setCheckOut(e.target.value)} className={inputCls} />
                <p className="text-xs text-gray-400">
                  {checkOut ? `${fmtShort(checkOut)}${nights > 0 ? ` · ${nights} nuit${nights > 1 ? 's' : ''}` : ''}` : 'Choisir une date'}
                </p>
              </div>

              <div className="flex-1 px-5 py-4 flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Search size={11} /> Chambre
                </label>
                <input type="text" placeholder="Suite, Double..." value={search}
                  onChange={e => setSearch(e.target.value)} className={inputCls} />
                <p className="text-xs text-gray-400">Nom ou type</p>
              </div>

              <div className="px-4 py-3 flex items-center justify-center">
                <button onClick={handleSearch}
                  disabled={!checkIn || !checkOut || checkOut <= checkIn}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap">
                  <Search size={16} /> Vérifier les dispo.
                </button>
              </div>
            </div>

            {datesApplied && checkIn && checkOut && (
              <div className="bg-green-50 border-t border-green-100 px-5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                  <CheckCircle size={15} />
                  {rooms.length} chambre{rooms.length > 1 ? 's' : ''} libre{rooms.length > 1 ? 's' : ''} du {fmtShort(checkIn)} au {fmtShort(checkOut)} ({nights} nuit{nights > 1 ? 's' : ''})
                </div>
                <button onClick={clearDates} className="text-xs text-green-600 hover:underline font-semibold flex items-center gap-1">
                  <X size={12} /> Effacer les dates
                </button>
              </div>
            )}
          </div>

          {/* Barre filtres + tri */}
          <div className="max-w-3xl mx-auto mt-3 flex items-center justify-between px-1 gap-3">
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 text-sm font-semibold transition ${showFilters || hasActiveFilters ? 'text-white' : 'text-blue-200 hover:text-white'}`}>
              <SlidersHorizontal size={15} />
              Filtres avancés
              {activeChips.length > 0 && (
                <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">
                  {activeChips.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-blue-200 hover:text-white font-semibold flex items-center gap-1">
                  <X size={12} /> Tout réinitialiser
                </button>
              )}
              {/* Tri rapide */}
              <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5">
                <ArrowUpDown size={13} className="text-blue-200" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="text-gray-800">{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Panneau filtres avancés */}
          {showFilters && (
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-3xl mx-auto mt-2 text-left">

              {/* Type — chips */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Type de chambre</p>
                <div className="flex gap-2 flex-wrap">
                  {[{ value: '', label: 'Tous' }, { value: 'SINGLE', label: 'Simple' }, { value: 'DOUBLE', label: 'Double' }, { value: 'SUITE', label: 'Suite' }].map(t => (
                    <button key={t.value} onClick={() => setFilterType(t.value)}
                      className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition ${filterType === t.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix min/max */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Fourchette de prix (€ / nuit)</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    <input type="number" placeholder="Min" min="0" value={filterMinPrice}
                      onChange={e => setFilterMinPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <span className="text-gray-300 font-bold">—</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    <input type="number" placeholder="Max" min="0" value={filterMaxPrice}
                      onChange={e => setFilterMaxPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
              </div>

              {/* Capacité — boutons */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Nombre de personnes minimum</p>
                <div className="flex gap-2">
                  {['', '1', '2', '3', '4'].map(n => (
                    <button key={n} onClick={() => setFilterCapacity(n)}
                      className={`w-11 h-11 rounded-xl text-sm font-bold border-2 transition ${filterCapacity === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}>
                      {n === '' ? 'Tous' : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note minimale */}
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Note minimale</p>
                <div className="flex gap-2">
                  {[0, 3, 3.5, 4, 4.5].map(n => (
                    <button key={n} onClick={() => setFilterMinRating(n)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border-2 transition ${filterMinRating === n
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-600'}`}>
                      {n === 0 ? 'Toutes' : <><Star size={13} className="fill-current" /> {n}+</>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chips des filtres actifs */}
          {activeChips.length > 0 && (
            <div className="max-w-3xl mx-auto mt-3 flex flex-wrap gap-2 px-1">
              {activeChips.map(chip => (
                <button key={chip.key} onClick={chip.clear}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition">
                  {chip.label} <X size={11} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="max-w-7xl mx-auto px-4 py-14">

        {/* TITRE RÉSULTATS */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {loading ? 'Recherche en cours...' : filtered.length === 0
                ? 'Aucun résultat'
                : `${filtered.length} chambre${filtered.length > 1 ? 's' : ''} trouvée${filtered.length > 1 ? 's' : ''}`}
            </h2>
            {datesApplied && !loading && (
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-0.5 flex items-center gap-1">
                <CheckCircle size={13} /> Disponibles du {fmtShort(checkIn)} au {fmtShort(checkOut)}
              </p>
            )}
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <X size={14} /> Réinitialiser
            </button>
          )}
        </div>

        {/* SKELETON */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden animate-pulse">
                <div className="h-52 bg-gray-200 dark:bg-gray-700" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ÉTAT VIDE */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <BedDouble size={36} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
              {datesApplied ? 'Aucune chambre disponible pour ces dates' : 'Aucune chambre trouvée'}
            </h3>
            <p className="text-gray-400 mb-6">
              {datesApplied ? "Essayez d'autres dates ou modifiez vos filtres." : 'Essayez de modifier vos filtres.'}
            </p>
            <div className="flex gap-3">
              {datesApplied && (
                <button onClick={clearDates} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">
                  Voir toutes les dates
                </button>
              )}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="border border-gray-300 text-gray-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50">
                  Supprimer les filtres
                </button>
              )}
            </div>
          </div>
        )}

        {/* GRILLE */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.slice(0, visibleCount).map(room => (
              <div key={room.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden group">

                {/* IMAGE */}
                <div className="h-52 bg-gray-100 overflow-hidden relative cursor-pointer" onClick={() => navigate(`/room/${room.id}`)}>
                  <LazyImage
                    src={getRoomImage(room)}
                    alt={room.name}
                    fallback={`https://picsum.photos/seed/fallback-${room.id}/800/500`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${TYPE_COLORS[room.room_type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[room.room_type] || room.room_type}
                    </span>
                    {datesApplied && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500 text-white flex items-center gap-1">
                        <CheckCircle size={10} /> Libre
                      </span>
                    )}
                  </div>
                  {/* Bouton cœur */}
                  {isLoggedIn && (
                    <button
                      onClick={async e => {
                        e.stopPropagation();
                        const result = await toggle(room.id);
                        if (result === true) toast('Ajouté aux favoris !', 'success');
                        else if (result === false) toast('Retiré des favoris.', 'info');
                      }}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform z-10"
                    >
                      <Heart size={16} className={isFavorited(room.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
                    </button>
                  )}
                  {/* Note en bas à droite */}
                  {room.avg_rating && (
                    <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-black text-gray-800 dark:text-white">{room.avg_rating}</span>
                      <span className="text-xs text-gray-400">({room.review_count})</span>
                    </div>
                  )}
                  {room.is_available === false && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white text-gray-800 font-bold px-4 py-2 rounded-full text-sm">Indisponible</span>
                    </div>
                  )}
                </div>

                {/* CONTENU */}
                <div className="p-6">
                  <h3
                    className="text-xl font-bold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                    onClick={() => navigate(`/room/${room.id}`)}>
                    {room.name}
                  </h3>

                  {/* Note sous le titre */}
                  {room.avg_rating ? (
                    <div className="flex items-center gap-2 mb-3">
                      <Stars value={room.avg_rating} />
                      <span className="text-xs text-gray-400">{room.avg_rating} · {room.review_count} avis</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mb-3">Pas encore d'avis</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><BedDouble size={15} className="text-blue-500" />{TYPE_LABELS[room.room_type]}</span>
                    <span className="flex items-center gap-1"><Users size={15} className="text-blue-500" />{room.capacity} pers.</span>
                  </div>

                  {datesApplied && nights > 0 ? (
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">{nights} nuit{nights > 1 ? 's' : ''} estimé</p>
                        <p className="text-xl font-black text-blue-600">{(parseFloat(room.price_per_night) * nights).toFixed(0)}€</p>
                      </div>
                      <p className="text-sm text-gray-400">{room.price_per_night}€/nuit</p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black text-gray-900 dark:text-white">{room.price_per_night}€</span>
                      <span className="text-gray-400 dark:text-gray-500 text-sm"> / nuit</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/room/${room.id}`)}
                      className="flex items-center gap-1 border border-blue-600 text-blue-600 px-3 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-950 transition">
                      Détails
                    </button>
                    <button onClick={() => handleReserve(room.id)}
                      disabled={room.is_available === false}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      {datesApplied ? 'Réserver ces dates' : 'Réserver'} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {visibleCount >= filtered.length && filtered.length < 6 &&
              Array.from({ length: 6 - filtered.length }).map((_, i) => (
                <div key={`ghost-${i}`} className="hidden lg:flex bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden flex-col opacity-40">
                  <div className="h-52 overflow-hidden">
                    <LazyImage src={`https://picsum.photos/seed/placeholder-${i + 99}/800/500`} alt="Chambre à venir" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
                    <p className="text-gray-400 font-semibold text-sm">Bientôt disponible</p>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* VOIR PLUS / MOINS */}
        {!loading && filtered.length > 3 && (
          <div className="flex flex-col items-center mt-12 gap-3">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {Math.min(visibleCount, filtered.length)} sur {filtered.length} chambre{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-3">
              {visibleCount > 3 && (
                <button onClick={() => setVisibleCount(3)}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-6 py-3 rounded-2xl font-bold hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  <ChevronUp size={18} /> Voir moins
                </button>
              )}
              {filtered.length > visibleCount && (
                <button onClick={() => setVisibleCount(v => v + 3)}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  Voir plus <ChevronDown size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
