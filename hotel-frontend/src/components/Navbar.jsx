import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Sparkles, CalendarDays, LayoutDashboard, Sun, Moon, Heart } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoriteContext';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { dark, toggle } = useTheme();
  const { favoriteIds } = useFavorites();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("proRdvUser");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-black text-gray-900 dark:text-white">{settings.site_name.slice(0, -3)}<span style={{ color: settings.primary_color }}>{settings.site_name.slice(-3)}</span></span>
        </Link>

        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/explorer" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Explorer</Link>
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {user ? (
            <div className="flex items-center gap-4 border-l pl-4 border-gray-200 dark:border-gray-700">
              {user.is_staff && (
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              )}
              <Link
                to="/mes-reservations"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                <CalendarDays size={16} /> Mes réservations
              </Link>
              <Link
                to="/favoris"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition relative"
              >
                <Heart size={16} className={favoriteIds.size > 0 ? 'text-red-500 fill-red-500' : ''} />
                {favoriteIds.size > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {favoriteIds.size}
                  </span>
                )}
              </Link>
              <Link to="/profil" className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-black text-sm">
                  {user.username?.[0]?.toUpperCase() || <User size={16} />}
                </div>
                {user.username}
              </Link>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Connexion</Link>
              <Link to="/signup" className="bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 dark:hover:bg-blue-500 transition shadow-xl shadow-gray-200 dark:shadow-none">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;