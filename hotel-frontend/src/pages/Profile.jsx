import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  User, Mail, Lock, Check, Loader2,
  CalendarDays, ShieldCheck, Pencil, X, ArrowLeft,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editInfo, setEditInfo] = useState(false);
  const [editPassword, setEditPassword] = useState(false);

  const [formInfo, setFormInfo] = useState({ username: '', email: '' });
  const [formPassword, setFormPassword] = useState({ current_password: '', new_password: '', confirm: '' });

  useEffect(() => {
    api.get('profile/')
      .then(res => {
        setProfile(res.data);
        setFormInfo({ username: res.data.username, email: res.data.email });
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveInfo = async () => {
    if (!formInfo.username) { toast("Le nom d'utilisateur est requis.", 'error'); return; }
    try {
      setSaving(true);
      const res = await api.patch('profile/', { username: formInfo.username, email: formInfo.email });
      setProfile(res.data);
      const updated = { ...user, username: res.data.username };
      setUser(updated);
      localStorage.setItem('proRdvUser', JSON.stringify(updated));
      setEditInfo(false);
      toast('Informations mises à jour.', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de la mise à jour.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!formPassword.current_password || !formPassword.new_password) {
      toast('Remplissez les deux champs de mot de passe.', 'error'); return;
    }
    if (formPassword.new_password !== formPassword.confirm) {
      toast('Les mots de passe ne correspondent pas.', 'error'); return;
    }
    if (formPassword.new_password.length < 6) {
      toast('Le nouveau mot de passe doit contenir au moins 6 caractères.', 'error'); return;
    }
    try {
      setSaving(true);
      await api.patch('profile/', { current_password: formPassword.current_password, new_password: formPassword.new_password });
      setEditPassword(false);
      setFormPassword({ current_password: '', new_password: '', confirm: '' });
      toast('Mot de passe modifié. Reconnectez-vous.', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors du changement.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 min-h-screen">
        <Skeleton className="h-8 w-20 mb-8" />
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-8 mb-6 flex items-center gap-6">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}
        </div>
      </div>
    );
  }

  const joinedDate = profile?.date_joined
    ? new Date(profile.date_joined).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const inputClass = "w-full p-3 border dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition text-sm font-semibold"
        >
          <ArrowLeft size={18} /> Retour
        </button>

        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 rounded-2xl p-8 text-white flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-3xl font-black">{profile?.username?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <div>
            <h1 className="text-2xl font-black">{profile?.username}</h1>
            <p className="text-blue-200 text-sm">{profile?.email || 'Aucun email renseigné'}</p>
            <div className="flex items-center gap-2 mt-2 text-blue-200 text-xs">
              <CalendarDays size={13} /> Membre depuis le {joinedDate}
            </div>
          </div>
        </div>

        {/* INFOS PERSONNELLES */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-blue-600" /> Informations personnelles
            </h2>
            {!editInfo && (
              <button
                onClick={() => { setEditInfo(true); setEditPassword(false); }}
                className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:underline"
              >
                <Pencil size={14} /> Modifier
              </button>
            )}
          </div>

          {editInfo ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Nom d'utilisateur</label>
                <input type="text" value={formInfo.username} onChange={e => setFormInfo({ ...formInfo, username: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Adresse email</label>
                <input type="email" value={formInfo.email} onChange={e => setFormInfo({ ...formInfo, email: e.target.value })} className={inputClass} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleSaveInfo} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Enregistrer
                </button>
                <button onClick={() => { setEditInfo(false); setFormInfo({ username: profile.username, email: profile.email }); }} className="px-5 py-2.5 rounded-xl font-bold text-sm border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <User size={16} className="text-gray-400 shrink-0" />
                <span className="text-gray-400 w-24 shrink-0">Utilisateur</span>
                <span className="font-semibold">{profile?.username}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <span className="text-gray-400 w-24 shrink-0">Email</span>
                <span className="font-semibold">{profile?.email || '—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* SÉCURITÉ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Lock size={18} className="text-blue-600" /> Sécurité
            </h2>
            {!editPassword && (
              <button
                onClick={() => { setEditPassword(true); setEditInfo(false); }}
                className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:underline"
              >
                <Pencil size={14} /> Changer le mot de passe
              </button>
            )}
          </div>

          {editPassword ? (
            <div className="space-y-4">
              {[
                { label: 'Mot de passe actuel', key: 'current_password' },
                { label: 'Nouveau mot de passe', key: 'new_password' },
                { label: 'Confirmer le nouveau mot de passe', key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">{label}</label>
                  <input
                    type="password"
                    value={formPassword[key]}
                    onChange={e => setFormPassword({ ...formPassword, [key]: e.target.value })}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button onClick={handleSavePassword} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Enregistrer
                </button>
                <button onClick={() => { setEditPassword(false); setFormPassword({ current_password: '', new_password: '', confirm: '' }); }} className="px-5 py-2.5 rounded-xl font-bold text-sm border dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <ShieldCheck size={16} className="text-green-500 shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">Mot de passe défini — modifiez-le si nécessaire.</span>
            </div>
          )}
        </div>

        {/* ACTIONS RAPIDES */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Accès rapide</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/mes-reservations')}
              className="flex items-center gap-2 border border-blue-600 text-blue-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-950 transition"
            >
              <CalendarDays size={16} /> Mes réservations
            </button>
            <button
              onClick={() => navigate('/explorer')}
              className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Explorer les chambres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
