import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { LogIn, Lock, Mail, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Login = ({ setUser }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('login/', credentials);

      if (!res.data.access) throw new Error("Token manquant");

      localStorage.setItem('token', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);

      const userData = {
        username: res.data.username || credentials.username,
        isLoggedIn: true,
        is_staff: res.data.is_staff || false,
      };
      localStorage.setItem('proRdvUser', JSON.stringify(userData));
      setUser(userData);

      toast(`Bienvenue, ${userData.username} !`, 'success');
      navigate(res.data.is_staff ? '/dashboard' : '/');

    } catch (err) {
      if (err.response?.status === 401) {
        toast('Identifiants incorrects', 'error');
      } else {
        toast('Erreur serveur. Réessaie.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border border-gray-50 dark:border-gray-800">

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Bon retour !</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" size={20} />
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" size={20} />
            <input
              type="password"
              placeholder="Mot de passe"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Se connecter"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
