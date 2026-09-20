import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api/axios';
import { getRoomImage } from '../api/roomImages';
import LazyImage from '../components/LazyImage';
import Skeleton from '../components/Skeleton';
import {
  BedDouble, Users, Calendar, CreditCard, Lock,
  Loader2, ArrowLeft, XCircle, TrendingUp, Tag,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const ROOM_TYPE_LABELS = { SINGLE: 'Simple', DOUBLE: 'Double', SUITE: 'Suite' };
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const toStr = (date) => date.toISOString().split('T')[0];
const fromStr = (str) => new Date(str + 'T00:00:00');
const addDays = (dateStr, n) => {
  const d = fromStr(dateStr);
  d.setDate(d.getDate() + n);
  return toStr(d);
};
const formatDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/* ─── Calendrier de sélection de plage ─── */
const BookingCalendar = ({ unavailable, dates, onChange }) => {
  const todayDate = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const [month, setMonth] = useState(todayDate.getMonth());
  const [year, setYear] = useState(todayDate.getFullYear());
  const [selecting, setSelecting] = useState('check_in');
  const [hoverDate, setHoverDate] = useState(null);

  const unavailSet = useMemo(() => {
    const s = new Set();
    unavailable.forEach(({ check_in, check_out }) => {
      let d = fromStr(check_in);
      const end = fromStr(check_out);
      while (d < end) { s.add(toStr(d)); d.setDate(d.getDate() + 1); }
    });
    return s;
  }, [unavailable]);

  const checkIn = dates.check_in ? fromStr(dates.check_in) : null;
  const checkOut = dates.check_out ? fromStr(dates.check_out) : null;
  const hoverD = hoverDate ? fromStr(hoverDate) : null;

  const handleClick = (dateStr) => {
    const clicked = fromStr(dateStr);
    if (clicked < todayDate || unavailSet.has(dateStr)) return;

    if (selecting === 'check_in' || !checkIn || clicked <= checkIn) {
      onChange({ check_in: dateStr, check_out: addDays(dateStr, 1) });
      setSelecting('check_out');
    } else {
      let d = new Date(checkIn);
      d.setDate(d.getDate() + 1);
      let hasConflict = false;
      while (d < clicked) {
        if (unavailSet.has(toStr(d))) { hasConflict = true; break; }
        d.setDate(d.getDate() + 1);
      }
      if (hasConflict) {
        onChange({ check_in: dateStr, check_out: addDays(dateStr, 1) });
        setSelecting('check_out');
      } else {
        onChange({ ...dates, check_out: dateStr });
        setSelecting('check_in');
      }
    }
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const date = fromStr(dateStr);
      const isPast = date < todayDate;
      const isUnavail = unavailSet.has(dateStr);
      const isIn = dateStr === dates.check_in;
      const isOut = dateStr === dates.check_out;
      const inRange = checkIn && checkOut && date > checkIn && date < checkOut;
      const inHover = selecting === 'check_out' && checkIn && hoverD && date > checkIn && date <= hoverD;
      result.push({ d, dateStr, isPast, isUnavail, isIn, isOut, inRange, inHover });
    }
    return result;
  }, [year, month, unavailSet, dates, checkIn, checkOut, hoverD, selecting, todayDate]);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
          <ChevronLeft size={18} />
        </button>
        <span className="font-bold text-gray-900 dark:text-white text-sm">
          {MONTHS_FR[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="h-9" />;

          const { d, dateStr, isPast, isUnavail, isIn, isOut, inRange, inHover } = cell;
          const disabled = isPast || isUnavail;

          let base = 'h-9 flex items-center justify-center text-sm transition-colors relative ';

          if (isIn) {
            base += 'bg-blue-600 text-white font-bold rounded-l-full z-10 ';
          } else if (isOut) {
            base += 'bg-blue-600 text-white font-bold rounded-r-full z-10 ';
          } else if (inRange) {
            base += 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ';
          } else if (inHover) {
            base += 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 ';
          } else if (isUnavail && !isPast) {
            base += 'text-red-300 cursor-not-allowed ';
          } else if (isPast) {
            base += 'text-gray-300 dark:text-gray-700 cursor-not-allowed ';
          } else {
            base += 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full cursor-pointer ';
          }

          return (
            <div
              key={dateStr}
              className={base}
              onClick={() => handleClick(dateStr)}
              onMouseEnter={() => !disabled && setHoverDate(dateStr)}
              onMouseLeave={() => setHoverDate(null)}
            >
              {isUnavail && !isPast ? (
                <span className="line-through opacity-40">{d}</span>
              ) : d}
              {isUnavail && !isPast && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-gray-400 border-t dark:border-gray-800 pt-3">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Sélectionné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-300 inline-block" /> Indisponible
        </span>
        <span className="ml-auto font-medium text-blue-600 dark:text-blue-400">
          {selecting === 'check_in' ? "→ Choisissez l'arrivée" : "→ Choisissez le départ"}
        </span>
      </div>
    </div>
  );
};

/* ─── Formulaire Stripe ─── */
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

const PaymentForm = ({ room, dates, totalPrice, nights, conflictingPeriod, pricing, pricingLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');

    if (fromStr(dates.check_out) <= fromStr(dates.check_in)) {
      setError("La date de départ doit être après la date d'arrivée."); return;
    }
    if (conflictingPeriod) {
      setError("Ces dates sont déjà réservées. Veuillez choisir d'autres dates."); return;
    }
    if (!stripe || !elements) return;

    try {
      setPaying(true);

      // 1. Create PaymentIntent on backend
      const intentRes = await api.post('payments/create-intent/', { amount: totalPrice });
      const { client_secret } = intentRes.data;

      // 2. Confirm card payment with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        setError(stripeError.message);
        return;
      }

      // 3. Create booking with verified payment_intent_id
      const res = await api.post('bookings/', {
        room: room.id,
        check_in: dates.check_in,
        check_out: dates.check_out,
        total_price: totalPrice,
        payment_intent_id: paymentIntent.id,
      });

      navigate('/success', { state: { room, dates, total: totalPrice, booking: res.data } });
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la réservation. Réessaie.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
          <XCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div>
        <label className="text-xs text-gray-400 uppercase font-semibold mb-2 block">
          Informations de carte
        </label>
        <div className="border dark:border-gray-700 rounded-lg p-3.5 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 transition">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Test : <span className="font-mono">4242 4242 4242 4242</span> · 12/28 · 123
        </p>
      </div>

      <div className="border-t dark:border-gray-700 pt-4 mt-2">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
          <span>Chambre ({nights} nuit{nights > 1 ? 's' : ''})</span>
          <span>{totalPrice}€</span>
        </div>
        <div className="flex justify-between font-black text-lg mt-2 text-gray-900 dark:text-white">
          <span>Total</span>
          <span className="text-blue-600">{totalPrice}€</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={paying || !!conflictingPeriod || !stripe}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {paying ? <Loader2 className="animate-spin" size={20} /> : <><Lock size={18} /> Payer {totalPrice}€</>}
      </button>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <Lock size={12} /> Paiement sécurisé par Stripe
      </p>
    </form>
  );
};

/* ─── Page principale ─── */
const Booking = () => {
  const { proId } = useParams();
  const navigate = useNavigate();
  const { state: navState } = useLocation();

  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [unavailable, setUnavailable] = useState([]);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const todayStr = toStr(new Date());

  const [dates, setDates] = useState({
    check_in: navState?.check_in || todayStr,
    check_out: navState?.check_out || addDays(todayStr, 1),
  });

  useEffect(() => {
    Promise.all([
      api.get(`rooms/${proId}/`),
      api.get(`rooms/${proId}/unavailable_dates/`),
    ])
      .then(([roomRes, datesRes]) => {
        setRoom(roomRes.data);
        setUnavailable(Array.isArray(datesRes.data) ? datesRes.data : []);
      })
      .catch(() => setError('Chambre introuvable.'))
      .finally(() => setLoadingRoom(false));
  }, [proId]);

  const nights = () => {
    const diff = fromStr(dates.check_out) - fromStr(dates.check_in);
    return Math.max(1, Math.round(diff / 86400000));
  };

  const totalPrice = () =>
    pricing ? pricing.total.toFixed(2) : room ? (nights() * parseFloat(room.price_per_night)).toFixed(2) : 0;

  useEffect(() => {
    if (!room || !dates.check_in || !dates.check_out) return;
    if (dates.check_out <= dates.check_in) return;
    setPricingLoading(true);
    api.get(`rooms/${proId}/dynamic_price/`, { params: { check_in: dates.check_in, check_out: dates.check_out } })
      .then(res => setPricing(res.data))
      .catch(() => setPricing(null))
      .finally(() => setPricingLoading(false));
  }, [room, dates.check_in, dates.check_out]);

  const conflictingPeriod = useMemo(() => {
    return unavailable.find(p => dates.check_in < p.check_out && dates.check_out > p.check_in);
  }, [dates, unavailable]);

  if (loadingRoom) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-10 w-72 mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden shadow">
              <Skeleton className="h-52 rounded-none" />
              <div className="bg-white dark:bg-gray-900 p-6 space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16" /><Skeleton className="h-16" />
              </div>
              <Skeleton className="h-64" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-8 space-y-4 h-fit">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-14 w-full mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <p className="text-red-500 font-medium">{error || 'Chambre introuvable.'}</p>
        <button onClick={() => navigate('/explorer')} className="text-blue-600 underline">
          Retour à l'explorer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 mb-8 transition text-sm font-semibold">
        <ArrowLeft size={18} /> Retour
      </button>

      <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-10">Réserver une chambre</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* GAUCHE */}
        <div className="space-y-6">

          {/* Carte chambre */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden">
            <div className="h-52 overflow-hidden">
              <LazyImage
                src={getRoomImage(room)}
                alt={room.name}
                fallback="https://picsum.photos/seed/booking-fallback/800/500"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold dark:text-white mb-2">{room.name}</h2>
              <div className="flex gap-6 text-gray-500 dark:text-gray-400 text-sm mb-4">
                <span className="flex items-center gap-1"><BedDouble size={16} /> {ROOM_TYPE_LABELS[room.room_type] || room.room_type}</span>
                <span className="flex items-center gap-1"><Users size={16} /> {room.capacity} personne{room.capacity > 1 ? 's' : ''}</span>
              </div>
              <p className="text-3xl font-black text-blue-600">
                {room.price_per_night}€ <span className="text-base font-normal text-gray-400">/ nuit</span>
              </p>
            </div>
          </div>

          {/* Calendrier */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
            <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" /> Dates de séjour
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className={`rounded-xl border-2 p-3 transition ${dates.check_in ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700'}`}>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Arrivée</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  {dates.check_in ? formatDate(dates.check_in) : '—'}
                </p>
              </div>
              <div className={`rounded-xl border-2 p-3 transition ${dates.check_out ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700'}`}>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Départ</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  {dates.check_out ? formatDate(dates.check_out) : '—'}
                </p>
              </div>
            </div>

            <BookingCalendar
              unavailable={unavailable}
              dates={dates}
              onChange={setDates}
            />

            {conflictingPeriod && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <span>
                  Déjà réservée du <strong>{formatDate(conflictingPeriod.check_in)}</strong> au <strong>{formatDate(conflictingPeriod.check_out)}</strong>.
                </span>
              </div>
            )}

            {!conflictingPeriod && (
              <div className="mt-4 space-y-3">
                {pricingLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 p-3">
                    <Loader2 className="animate-spin" size={16} /> Calcul du prix en cours...
                  </div>
                ) : pricing ? (
                  <>
                    {pricing.extra > 0 && (
                      <div className="border dark:border-gray-700 rounded-xl overflow-hidden text-sm">
                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                          <TrendingUp size={13} /> Détail par nuit
                        </div>
                        <div className="max-h-36 overflow-y-auto divide-y dark:divide-gray-800">
                          {pricing.nights.map(n => (
                            <div key={n.date} className="flex items-center justify-between px-4 py-2">
                              <div>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {new Date(n.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                                {n.reasons.length > 0 && (
                                  <span className="ml-2 text-xs text-amber-600 font-semibold">{n.reasons.join(' · ')}</span>
                                )}
                              </div>
                              <span className={`font-bold ${n.surcharge > 0 ? 'text-amber-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                {n.price}€
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 space-y-1.5">
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Base ({nights()} nuit{nights() > 1 ? 's' : ''} × {room.price_per_night}€)</span>
                        <span>{pricing.base_total}€</span>
                      </div>
                      {pricing.extra > 0 && (
                        <div className="flex justify-between text-sm text-amber-600 font-semibold">
                          <span className="flex items-center gap-1"><Tag size={13} /> Suppléments</span>
                          <span>+{pricing.extra}€</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-lg pt-1 border-t border-blue-200 dark:border-blue-800">
                        <span className="text-gray-800 dark:text-white">Total</span>
                        <span className="text-blue-600">{pricing.total}€</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">{nights()} nuit{nights() > 1 ? 's' : ''} × {room.price_per_night}€</span>
                    <span className="text-2xl font-black text-blue-600">{totalPrice()}€</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DROITE — Paiement */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-8 h-fit sticky top-24">
          <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
            <CreditCard size={20} className="text-blue-600" /> Paiement sécurisé
          </h3>

          <Elements stripe={stripePromise}>
            <PaymentForm
              room={room}
              dates={dates}
              totalPrice={totalPrice()}
              nights={nights()}
              conflictingPeriod={conflictingPeriod}
              pricing={pricing}
              pricingLoading={pricingLoading}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default Booking;
