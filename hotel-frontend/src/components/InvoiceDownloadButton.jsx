import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

const InvoiceDownloadButton = ({ booking, settings, username, variant = 'icon' }) => {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (generating) return;
    try {
      setGenerating(true);
      const { pdf } = await import('@react-pdf/renderer');
      const { default: InvoicePDF } = await import('./InvoicePDF');
      const React = (await import('react')).default;

      const blob = await pdf(
        React.createElement(InvoicePDF, { booking, settings, username })
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-INV-${String(booking.id).padStart(5, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleDownload}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 py-4 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-950 transition disabled:opacity-60"
      >
        {generating
          ? <><Loader2 size={18} className="animate-spin" /> Génération...</>
          : <><Download size={18} /> Télécharger la facture PDF</>
        }
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition disabled:opacity-60"
      title="Télécharger la facture"
    >
      {generating ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <Download size={18} />}
    </button>
  );
};

export default InvoiceDownloadButton;
