import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, Font,
} from '@react-pdf/renderer';

const TYPE_LABELS = { SINGLE: 'Simple', DOUBLE: 'Double', SUITE: 'Suite' };

const nightCount = (ci, co) =>
  Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    padding: 0,
  },

  /* Header */
  header: {
    backgroundColor: '#2563eb',
    padding: '32 40 28 40',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  hotelName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 9,
    color: '#bfdbfe',
    marginTop: 3,
  },
  invoiceLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#93c5fd',
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  invoiceRef: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textAlign: 'right',
    marginTop: 2,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerDate: {
    fontSize: 9,
    color: '#bfdbfe',
  },

  /* Body */
  body: {
    padding: '28 40',
  },

  /* Infos grid */
  infoGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 28,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: '14 16',
    borderLeft: '3 solid #2563eb',
  },
  infoBoxTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoKey: {
    fontSize: 9,
    color: '#6b7280',
    width: 70,
  },
  infoValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    flex: 1,
  },

  /* Room section */
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1 solid #e5e7eb',
  },

  /* Table */
  table: {
    marginBottom: 28,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    borderRadius: 4,
    padding: '8 12',
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '10 12',
    borderBottom: '1 solid #f3f4f6',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  cell: { fontSize: 9, color: '#374151' },
  cellBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' },

  /* Col widths */
  col1: { flex: 3 },
  col2: { flex: 1.5, textAlign: 'center' },
  col3: { flex: 1.5, textAlign: 'center' },
  col4: { flex: 1, textAlign: 'right' },
  col5: { flex: 1.5, textAlign: 'right' },

  /* Total */
  totalBox: {
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  totalCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    padding: '14 20',
    width: 220,
    borderLeft: '3 solid #2563eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: { fontSize: 9, color: '#6b7280' },
  totalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#374151' },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTop: '1 solid #bfdbfe',
    marginTop: 4,
  },
  totalFinalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937' },
  totalFinalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#2563eb' },

  /* Mentions */
  mentions: {
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    padding: '10 14',
    marginBottom: 20,
    borderLeft: '3 solid #22c55e',
  },
  mentionsText: { fontSize: 8, color: '#166534', lineHeight: 1.6 },

  /* Footer */
  footer: {
    backgroundColor: '#f8fafc',
    borderTop: '1 solid #e5e7eb',
    padding: '16 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 8, color: '#9ca3af' },
  footerBrand: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#6b7280' },
});

const InvoicePDF = ({ booking, settings, username }) => {
  const room = booking.room_details || booking.room;
  const n = nightCount(booking.check_in, booking.check_out);
  const basePrice = room?.price_per_night ? parseFloat(room.price_per_night) * n : parseFloat(booking.total_price);
  const total = parseFloat(booking.total_price);
  const extra = Math.max(0, total - basePrice);

  const invoiceNum = `INV-${String(booking.id).padStart(5, '0')}`;
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document
      title={`Facture ${invoiceNum}`}
      author={settings?.site_name || 'Hôtel'}
    >
      <Page size="A4" style={styles.page}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.hotelName}>{settings?.site_name || 'Hôtel'}</Text>
              <Text style={styles.tagline}>{settings?.tagline || ''}</Text>
            </View>
            <View>
              <Text style={styles.invoiceLabel}>Facture</Text>
              <Text style={styles.invoiceRef}>{invoiceNum}</Text>
            </View>
          </View>
          <View style={styles.headerBottom}>
            <Text style={styles.headerDate}>Émise le {today}</Text>
            <Text style={styles.headerDate}>Réservation #{booking.id}</Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* INFO GRID */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Client</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Nom</Text>
                <Text style={styles.infoValue}>{username || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Réservé le</Text>
                <Text style={styles.infoValue}>{fmtDate(booking.created_at)}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Établissement</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Adresse</Text>
                <Text style={styles.infoValue}>{settings?.footer_address || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Tél.</Text>
                <Text style={styles.infoValue}>{settings?.footer_phone || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Email</Text>
                <Text style={styles.infoValue}>{settings?.footer_email || '—'}</Text>
              </View>
            </View>
          </View>

          {/* TABLE */}
          <Text style={styles.sectionTitle}>Détail de la réservation</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.col1]}>Chambre</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>Arrivée</Text>
              <Text style={[styles.tableHeaderCell, styles.col3]}>Départ</Text>
              <Text style={[styles.tableHeaderCell, styles.col4]}>Nuits</Text>
              <Text style={[styles.tableHeaderCell, styles.col5]}>Prix / nuit</Text>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={styles.cellBold}>{room?.name || '—'}</Text>
                <Text style={[styles.cell, { color: '#6b7280', marginTop: 2 }]}>
                  {TYPE_LABELS[room?.room_type] || room?.room_type || ''} · {room?.capacity} pers.
                </Text>
              </View>
              <Text style={[styles.cell, styles.col2]}>{fmtDate(booking.check_in)}</Text>
              <Text style={[styles.cell, styles.col3]}>{fmtDate(booking.check_out)}</Text>
              <Text style={[styles.cellBold, styles.col4]}>{n}</Text>
              <Text style={[styles.cell, styles.col5]}>
                {room?.price_per_night ? `${parseFloat(room.price_per_night).toFixed(2)} €` : '—'}
              </Text>
            </View>
          </View>

          {/* TOTAL */}
          <View style={styles.totalBox}>
            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sous-total ({n} nuit{n > 1 ? 's' : ''})</Text>
                <Text style={styles.totalValue}>{basePrice.toFixed(2)} €</Text>
              </View>
              {extra > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Suppléments (weekend / saison)</Text>
                  <Text style={styles.totalValue}>+{extra.toFixed(2)} €</Text>
                </View>
              )}
              <View style={styles.totalFinalRow}>
                <Text style={styles.totalFinalLabel}>Total TTC</Text>
                <Text style={styles.totalFinalValue}>{total.toFixed(2)} €</Text>
              </View>
            </View>
          </View>

          {/* MENTIONS */}
          <View style={styles.mentions}>
            <Text style={styles.mentionsText}>
              ✓  Paiement reçu et confirmé.{'   '}
              ✓  Check-in à partir de 14h00 — Check-out avant 12h00.{'   '}
              ✓  Annulation gratuite jusqu'à 48h avant l'arrivée.
            </Text>
          </View>

        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{settings?.footer_address || ''}</Text>
          <Text style={styles.footerBrand}>{settings?.site_name || ''} · {settings?.footer_email || ''}</Text>
        </View>

      </Page>
    </Document>
  );
};

export default InvoicePDF;
