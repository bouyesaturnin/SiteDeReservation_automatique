import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, BedDouble, Home } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import InvoiceDownloadButton from '../components/InvoiceDownloadButton';

const Success = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const room = state?.room;
  const dates = state?.dates;
  const total = state?.total;
  const booking = state?.booking;

  const username = JSON.parse(localStorage.getItem('proRdvUser') || '{}')?.username || '';

  const invoiceBooking = booking ? { ...booking, room_details: room } : null;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">

        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Réservation confirmée !</h1>
        <p className="text-gray-400 mb-8">Merci pour votre réservation. Voici votre récapitulatif.</p>

        {room && dates && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-left space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <BedDouble size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Chambre</p>
                <p className="font-bold text-gray-900 dark:text-white">{room.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Arrivée</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatDate(dates.check_in)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Départ</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatDate(dates.check_out)}</p>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Total payé</span>
              <span className="text-2xl font-black text-blue-600">{total}€</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {invoiceBooking && (
            <InvoiceDownloadButton
              booking={invoiceBooking}
              settings={settings}
              username={username}
              variant="full"
            />
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
          >
            <Home size={18} /> Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;
