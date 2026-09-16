import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { getRoomImage } from '../api/roomImages';
import LazyImage from '../components/LazyImage';
import Skeleton from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoriteContext';
import {
  BedDouble, Users, ArrowLeft, ArrowRight,
  Wifi, Tv, Wind, Bath, Coffee, Sparkles,
  Star, ShieldCheck, CalendarDays, Loader2,
  ChevronLeft, ChevronRight, Images, MessageSquare,
  Send, Heart,
} from 'lucide-react';

const TYPE_LABELS = { SINGLE: 'Simple', DOUBLE: 'Double', SUITE: 'Suite' };
const TYPE_COLORS = {
  SINGLE: 'bg-blue-100 text-blue-700',
  DOUBLE: 'bg-purple-100 text-purple-700',
  SUITE: 'bg-amber-100 text-amber-700',
};

const AMENITIES = {
  SINGLE: [
    { icon: Wifi, label: 'Wi-Fi gratuit' },
    { icon: Tv, label: 'Télévision HD' },
    { icon: Wind, label: 'Climatisation' },
    { icon: Bath, label: 'Salle de bain privée' },
  ],
  DOUBLE: [
    { icon: Wifi, label: 'Wi-Fi gratuit' },
    { icon: Tv, label: 'Télévision HD' },
    { icon: Wind, label: 'Climatisation' },
    { icon: Bath, label: 'Salle de bain privée' },
    { icon: Coffee, label: 'Mini-bar inclus' },
    { icon: BedDouble, label: 'Grand lit king-size' },
  ],
  SUITE: [
    { icon: Wifi, label: 'Wi-Fi gratuit' },
    { icon: Tv, label: 'Télévision 4K' },
    { icon: Wind, label: 'Climatisation' },
    { icon: Bath, label: 'Baignoire balnéo' },
    { icon: Coffee, label: 'Mini-bar & Room service' },
    { icon: BedDouble, label: 'Lit king-size premium' },
    { icon: Sparkles, label: 'Salon privé' },
    { icon: Star, label: 'Vue panoramique' },
  ],
};

/* ─── Slider ─── */
const ImageSlider = ({ images, roomName }) => {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  const prev = useCallback(() => setCurrent(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent(i => (i + 1) % total), [total]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  if (total === 0) return null;

  return (
    <div className="relative h-[55vh] bg-gray-900 overflow-hidden group">
      {/* Images */}
      {images.map((src, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <LazyImage
            src={src}
            alt={`${roomName} — photo ${i + 1}`}
            fallback={`https://picsum.photos/seed/room-${i}/1200/600`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

      {/* Flèches — visibles au hover si plusieurs photos */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}

      {/* Compteur */}
      {total > 1 && (
        <div className="absolute top-6 right-20 bg-black/40 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
          <Images size={13} /> {current + 1} / {total}
        </div>
      )}

      {/* Thumbnails strip */}
      {total > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex gap-2 px-6 pb-3 pt-2 overflow-x-auto no-scrollbar z-10">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === current ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Sélecteur d'étoiles ─── */
const StarPicker = ({ value, onChange, size = 28 }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={`transition-colors ${n <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
          />
        </button>
      ))}
    </div>
  );
};

/* ─── Affichage étoiles statiques ─── */
const Stars = ({ value, size = 16 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star
        key={n}
        size={size}
        className={n <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
      />
    ))}
  </div>
);

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const toast = useToast();
  const { isFavorited, toggle } = useFavorites();
  const isLoggedIn = !!localStorage.getItem('token');
  const reviewsRef = React.useRef(null);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviewsData, setReviewsData] = useState({ reviews: [], count: 0, average: null, can_review: false, user_review: null });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = () => {
    setReviewsLoading(true);
    api.get(`rooms/${id}/reviews/`)
      .then(res => setReviewsData(res.data))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  };

  useEffect(() => {
    api.get(`rooms/${id}/`)
      .then(res => setRoom(res.data))
      .catch(() => setError('Chambre introuvable.'))
      .finally(() => setLoading(false));
    fetchReviews();
  }, [id]);

  // Auto-scroll vers les avis si on vient de MesReservations
  useEffect(() => {
    if (navState?.scrollToReview && reviewsRef.current && !reviewsLoading) {
      setTimeout(() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [navState, reviewsLoading]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast('Choisissez une note.', 'error'); return; }
    setSubmitting(true);
    try {
      await api.post(`rooms/${id}/reviews/`, { rating, comment });
      toast('Avis publié, merci !', 'success');
      setRating(0);
      setComment('');
      fetchReviews();
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de la publication.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Skeleton className="h-[55vh] rounded-none" />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex gap-3">
                <Skeleton className="h-12 w-28" />
                <Skeleton className="h-12 w-28" />
                <Skeleton className="h-12 w-28" />
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
                <Skeleton className="h-6 w-40 mb-5" />
                <div className="grid grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-12 w-full mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <BedDouble size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Chambre introuvable</h2>
        <p className="text-gray-400 mb-6">Cette chambre n'existe pas ou a été supprimée.</p>
        <button onClick={() => navigate('/explorer')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">
          Voir toutes les chambres
        </button>
      </div>
    );
  }

  const amenities = AMENITIES[room.room_type] || AMENITIES.SINGLE;

  // Construit la liste d'images : galerie BD d'abord, sinon image_url / fallback
  const galleryImages = room.images && room.images.length > 0
    ? room.images.map(img => img.url)
    : [getRoomImage(room)];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* HERO SLIDER */}
      <div className="relative">
        <ImageSlider images={galleryImages} roomName={room.name} />

        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition z-20"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        {/* Badge type */}
        <div className="absolute top-6 right-6 z-20">
          <span className={`text-sm font-bold px-4 py-2 rounded-full ${TYPE_COLORS[room.room_type] || 'bg-gray-100 text-gray-600'}`}>
            {TYPE_LABELS[room.room_type] || room.room_type}
          </span>
        </div>

        {/* Titre en bas de l'image */}
        <div className="absolute bottom-16 left-0 right-0 px-6 max-w-5xl mx-auto z-10">
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow">{room.name}</h1>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* COLONNE GAUCHE — Infos */}
          <div className="lg:col-span-2 space-y-10">

            {/* Infos rapides */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow text-sm font-semibold text-gray-700 dark:text-gray-200">
                <Users size={18} className="text-blue-500" />
                {room.capacity} personne{room.capacity > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow text-sm font-semibold text-gray-700 dark:text-gray-200">
                <BedDouble size={18} className="text-blue-500" />
                {TYPE_LABELS[room.room_type] || room.room_type}
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow text-sm font-semibold text-gray-700 dark:text-gray-200">
                <ShieldCheck size={18} className="text-green-500" />
                {room.is_available !== false ? 'Disponible' : 'Indisponible'}
              </div>
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <Images size={18} className="text-purple-500" />
                  {galleryImages.length} photos
                </div>
              )}
              {reviewsData.average && (
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <Star size={18} className="text-amber-400 fill-amber-400" />
                  {reviewsData.average} <span className="font-normal text-gray-400">({reviewsData.count} avis)</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3">À propos de cette chambre</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {room.description || 'Une chambre confortable avec tout le nécessaire pour un séjour agréable dans notre établissement.'}
              </p>
            </div>

            {/* Équipements */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-5">Équipements inclus</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {amenities.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-blue-600" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Politiques */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Politiques</h2>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <CalendarDays size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  Check-in à partir de 14h00 — Check-out avant 12h00
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck size={16} className="text-green-500 mt-0.5 shrink-0" />
                  Annulation gratuite jusqu'à 48h avant l'arrivée
                </li>
              </ul>
            </div>

            {/* ── AVIS CLIENTS ── */}
            <div ref={reviewsRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare size={20} className="text-amber-500" />
                  Avis clients
                  {reviewsData.count > 0 && (
                    <span className="text-base font-normal text-gray-400">({reviewsData.count})</span>
                  )}
                </h2>
                {reviewsData.average && (
                  <div className="flex items-center gap-2">
                    <Stars value={reviewsData.average} size={18} />
                    <span className="text-2xl font-black text-amber-500">{reviewsData.average}</span>
                    <span className="text-sm text-gray-400">/ 5</span>
                  </div>
                )}
              </div>

              {/* Formulaire — visible si can_review */}
              {reviewsData.can_review && (
                <form onSubmit={handleSubmitReview} className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 space-y-4">
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <Star size={15} className="fill-amber-400 text-amber-400" />
                    Vous avez séjourné ici — partagez votre expérience
                  </p>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold uppercase tracking-widest">Votre note</p>
                    <StarPicker value={rating} onChange={setRating} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold uppercase tracking-widest">Commentaire (optionnel)</p>
                    <textarea
                      rows={3}
                      placeholder="Décrivez votre séjour..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || rating === 0}
                    className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} /> Publier mon avis</>}
                  </button>
                </form>
              )}

              {/* Avis déjà posté */}
              {reviewsData.user_review && (
                <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                  <span>Votre avis a été publié — merci pour votre retour.</span>
                </div>
              )}

              {/* Inviter à se connecter */}
              {!isLoggedIn && (
                <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">Connectez-vous</button> pour laisser un avis après votre séjour.
                </div>
              )}

              {/* Liste des avis */}
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-amber-500" size={28} />
                </div>
              ) : reviewsData.reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="font-semibold">Aucun avis pour le moment</p>
                  <p className="text-sm mt-1">Soyez le premier à partager votre expérience.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {reviewsData.reviews.map(r => (
                    <div key={r.id} className="flex gap-4">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center shrink-0 font-black text-amber-600 dark:text-amber-400">
                        {r.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{r.username}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <Stars value={r.rating} size={14} />
                        {r.comment && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* COLONNE DROITE — Réservation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 sticky top-24">
              <div className="mb-6">
                <span className="text-4xl font-black text-gray-900 dark:text-white">{room.price_per_night}€</span>
                <span className="text-gray-400 text-sm"> / nuit</span>
              </div>

              <div className="space-y-3 mb-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="font-semibold dark:text-gray-200">{TYPE_LABELS[room.room_type]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacité</span>
                  <span className="font-semibold dark:text-gray-200">{room.capacity} personne{room.capacity > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span>Disponibilité</span>
                  <span className={`font-semibold ${room.is_available !== false ? 'text-green-600' : 'text-red-500'}`}>
                    {room.is_available !== false ? 'Disponible' : 'Indisponible'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => isLoggedIn ? navigate(`/reservation/${room.id}`) : navigate('/login')}
                disabled={room.is_available === false}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Réserver maintenant <ArrowRight size={18} />
              </button>

              {isLoggedIn && (
                <button
                  onClick={async () => {
                    const result = await toggle(room.id);
                    if (result === true) toast('Ajouté aux favoris !', 'success');
                    else if (result === false) toast('Retiré des favoris.', 'info');
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold border-2 transition mt-1 ${
                    isFavorited(room.id)
                      ? 'border-red-300 text-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  <Heart size={17} className={isFavorited(room.id) ? 'fill-red-500 text-red-500' : ''} />
                  {isFavorited(room.id) ? 'Retiré des favoris' : 'Sauvegarder'}
                </button>
              )}

              {!isLoggedIn && (
                <p className="text-center text-xs text-gray-400 mt-3">
                  Connexion requise pour réserver
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
