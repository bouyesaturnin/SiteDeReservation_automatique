import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const DEFAULT = {
  site_name: 'ProRDV',
  tagline: 'Votre hôtel de luxe au cœur de la ville',
  primary_color: '#2563eb',
  hero_title: 'Trouvez votre chambre idéale',
  hero_subtitle: 'Réservez en quelques clics, profitez sans attendre.',
  footer_description: "Un hôtel d'exception au cœur de la ville, alliant luxe moderne et hospitalité authentique pour un séjour inoubliable.",
  footer_address: '12 Avenue des Hôtels, 75008 Paris, France',
  footer_phone: '+33 1 23 45 67 89',
  footer_email: 'contact@prordv.fr',
};

const SiteSettingsContext = createContext({ settings: DEFAULT, setSettings: () => {} });

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT);

  useEffect(() => {
    api.get('settings/')
      .then(res => setSettings(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', settings.primary_color);
  }, [settings.primary_color]);

  return (
    <SiteSettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
