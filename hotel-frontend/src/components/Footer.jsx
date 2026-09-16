import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, MapPin, Phone, Mail, Clock,
  Star, BedDouble, Shield, CreditCard
} from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
  </svg>
);

const IconTwitter = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-gray-900 text-white">

      {/* BANDE SUPÉRIEURE — Points forts */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0">
              <Star size={20} className="text-blue-400" fill="currentColor" />
            </div>
            <div>
              <p className="font-bold text-sm">Hôtel 4 étoiles</p>
              <p className="text-gray-400 text-xs">Confort et élégance garantis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-sm">Paiement sécurisé</p>
              <p className="text-gray-400 text-xs">Visa, Mastercard, PayPal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0">
              <Shield size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-sm">Annulation gratuite</p>
              <p className="text-gray-400 text-xs">Jusqu'à 48h avant l'arrivée</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* COLONNE 1 — Logo & description */}
        <div className="lg:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Sparkles size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-black">{settings.site_name.slice(0, -3)}<span style={{ color: settings.primary_color }}>{settings.site_name.slice(-3)}</span></span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {settings.footer_description}
          </p>
          {/* Réseaux sociaux */}
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition">
              <IconFacebook />
            </a>
            <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition">
              <IconInstagram />
            </a>
            <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition">
              <IconTwitter />
            </a>
          </div>
        </div>

        {/* COLONNE 2 — Navigation */}
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-5">Navigation</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/" className="text-gray-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-400 rounded-full" /> Accueil
              </Link>
            </li>
            <li>
              <Link to="/explorer" className="text-gray-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-400 rounded-full" /> Nos chambres
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-gray-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-400 rounded-full" /> Connexion
              </Link>
            </li>
            <li>
              <Link to="/signup" className="text-gray-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-400 rounded-full" /> Créer un compte
              </Link>
            </li>
            <li>
              <Link to="/mes-reservations" className="text-gray-300 hover:text-white transition flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-400 rounded-full" /> Mes réservations
              </Link>
            </li>
          </ul>
        </div>

        {/* COLONNE 3 — Chambres */}
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-5">Nos chambres</h3>
          <ul className="space-y-3 text-sm">
            {[
              { label: 'Chambre Simple', desc: 'À partir de 59€ / nuit' },
              { label: 'Chambre Double', desc: 'À partir de 89€ / nuit' },
              { label: 'Suite Prestige', desc: 'À partir de 149€ / nuit' },
            ].map(item => (
              <li key={item.label}>
                <Link to="/explorer" className="group flex items-start gap-2">
                  <BedDouble size={15} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-300 group-hover:text-white transition">{item.label}</p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4 mt-8">Horaires</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-gray-300">
              <Clock size={14} className="text-blue-400 shrink-0" />
              Check-in : à partir de 14h00
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <Clock size={14} className="text-blue-400 shrink-0" />
              Check-out : jusqu'à 12h00
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <Clock size={14} className="text-blue-400 shrink-0" />
              Réception : 24h/24 — 7j/7
            </li>
          </ul>
        </div>

        {/* COLONNE 4 — Contact */}
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-5">Contact & Adresse</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-blue-400 mt-0.5 shrink-0" />
              <span className="text-gray-300 leading-relaxed">
                {settings.footer_address}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-blue-400 shrink-0" />
              <a href={`tel:${settings.footer_phone.replace(/\s/g, '')}`} className="text-gray-300 hover:text-white transition">
                {settings.footer_phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-blue-400 shrink-0" />
              <a href={`mailto:${settings.footer_email}`} className="text-gray-300 hover:text-white transition">
                {settings.footer_email}
              </a>
            </li>
          </ul>

          {/* Mini carte / localisation */}
          <div className="mt-6 bg-gray-800 rounded-xl p-4 text-xs text-gray-400 flex items-center gap-3">
            <MapPin size={20} className="text-blue-400 shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm mb-0.5">Nous trouver</p>
              <a
                href="https://maps.google.com/?q=Paris+France"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                Voir sur Google Maps →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* BANDE INFÉRIEURE */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {currentYear} {settings.site_name} — Tous droits réservés.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-gray-300 transition">Mentions légales</a>
            <a href="#" className="hover:text-gray-300 transition">Politique de confidentialité</a>
            <a href="#" className="hover:text-gray-300 transition">CGU</a>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
