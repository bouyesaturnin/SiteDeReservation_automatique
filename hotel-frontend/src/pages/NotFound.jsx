import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* 404 animé */}
        <div className="relative mb-8">
          <p className="text-[10rem] font-black text-gray-100 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 rotate-6">
              <Search size={40} className="text-white -rotate-6" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-3">
          Page introuvable
        </h1>
        <p className="text-gray-400 mb-10 leading-relaxed">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} /> Retour
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            <Home size={18} /> Accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
