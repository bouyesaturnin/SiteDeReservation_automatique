import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line,
} from 'recharts';
import { TrendingUp, Euro, CalendarCheck, BedDouble, Loader2, BarChart2 } from 'lucide-react';
import api from '../api/axios';
import Skeleton from './Skeleton';

const COLORS = ['#2563eb', '#7c3aed', '#f59e0b', '#10b981', '#ef4444'];

const occupationColor = (rate) => {
  if (rate >= 70) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' };
  if (rate >= 40) return { bg: 'bg-amber-400', text: 'text-amber-600', light: 'bg-amber-50' };
  return { bg: 'bg-red-400', text: 'text-red-500', light: 'bg-red-50' };
};

const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const OccupationGauge = ({ rate }) => {
  const c = occupationColor(rate);
  const circumference = 2 * Math.PI * 36;
  const dash = (rate / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444'}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${c.text}`}>{rate}%</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-500 mt-2">Taux global</p>
      <p className="text-xs text-gray-400">30 derniers jours</p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-black text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name === 'revenus' ? `Revenus: ${Number(p.value).toLocaleString('fr-FR')}€`
           : p.name === 'occupation' ? `Occupation: ${p.value}%`
           : `${p.name}: ${p.value}`}
        </p>
      ))}
    </div>
  );
};

const DashboardStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('stats/')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, monthly, by_type, top_rooms, occupation_by_room } = data;

  return (
    <div className="space-y-8 mb-12">

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Euro} label="Revenus totaux" value={`${kpis.total_revenue.toLocaleString('fr-FR')}€`} color="bg-blue-600" />
        <KpiCard icon={CalendarCheck} label="Réservations" value={kpis.total_bookings} sub={`${kpis.active_bookings} en cours`} color="bg-violet-600" />
        <KpiCard icon={BedDouble} label="Chambres" value={kpis.total_rooms} color="bg-amber-500" />
        <KpiCard icon={TrendingUp} label="Rev. moyen / rés." value={kpis.total_bookings ? `${Math.round(kpis.total_revenue / kpis.total_bookings)}€` : '—'} color="bg-emerald-500" />
      </div>

      {/* REVENUS + TAUX D'OCCUPATION (graphique combiné) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Revenus & Taux d'occupation</h3>
          <p className="text-xs text-gray-400 mb-5">6 derniers mois — revenus (€) et occupation (%)</p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="revenus" name="revenus" stroke="#2563eb" strokeWidth={2.5} fill="url(#colorRev)" dot={{ fill: '#2563eb', r: 4 }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="occupation" name="occupation" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} strokeDasharray="5 3" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-600 inline-block" /> Revenus</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-500 inline-block border-dashed border-t-2" /> Occupation</span>
          </div>
        </div>

        {/* JAUGE OCCUPATION GLOBALE */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 flex flex-col items-center justify-between">
          <div className="w-full">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Occupation hôtel</h3>
            <p className="text-xs text-gray-400 mb-4">Taux global sur 30 jours</p>
          </div>
          <OccupationGauge rate={kpis.occupation_rate} />
          <div className="w-full mt-4 space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> ≥ 70% — Excellent</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 40–69% — Correct</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> &lt; 40% — Faible</div>
          </div>
        </div>
      </div>

      {/* OCCUPATION PAR CHAMBRE */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={20} className="text-blue-600" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white">Taux d'occupation par chambre</h3>
          <span className="ml-auto text-xs text-gray-400">30 derniers jours</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {occupation_by_room.map((room) => {
            const c = occupationColor(room.taux);
            return (
              <div key={room.room} className={`rounded-xl p-4 ${c.light}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold text-gray-800 leading-tight">{room.room}</p>
                  <span className={`text-lg font-black ${c.text}`}>{room.taux}%</span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${c.bg} transition-all duration-700`}
                    style={{ width: `${room.taux}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{room.nuits} nuit{room.nuits > 1 ? 's' : ''} réservée{room.nuits > 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* GRAPHIQUES BAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* BAR CHART réservations */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Réservations / mois</h3>
          <p className="text-xs text-gray-400 mb-4">Nombre de séjours confirmés</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="reservations" name="réservations" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART type */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Par type</h3>
          <p className="text-xs text-gray-400 mb-3">Réservations par catégorie</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={by_type} dataKey="reservations" nameKey="type" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                {by_type.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-1">
            {by_type.map((item, i) => (
              <div key={item.type} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-gray-600">{item.type}</span>
                </div>
                <span className="font-bold text-gray-800">{item.reservations}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TOP CHAMBRES */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Top chambres</h3>
          <p className="text-xs text-gray-400 mb-4">Par chiffre d'affaires</p>
          <div className="space-y-3">
            {top_rooms.map((room, i) => {
              const maxRevenue = top_rooms[0]?.total || 1;
              const pct = Math.round((room.total / maxRevenue) * 100);
              return (
                <div key={room.room__name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700 truncate max-w-[60%]">
                      <span className="text-gray-400 mr-1">#{i + 1}</span>{room.room__name}
                    </span>
                    <span className="font-black text-gray-900">{Number(room.total).toLocaleString('fr-FR')}€</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
