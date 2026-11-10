import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const BRAND = '#BF824F';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label, value) {
  if (value == null || value === '') return '';
  return `
    <tr>
      <td class="label">${escapeHtml(label)}</td>
      <td class="value">${escapeHtml(value)}</td>
    </tr>
  `;
}

/**
 * Build printable HTML for a doctor appointment booking / visit detail.
 * Includes patient, treatment, doctor, schedule, and medical notes from the page.
 */
export function buildAppointmentPdfHtml(detail = {}) {
  const title = detail.title || 'Appointment Details';
  const requestId = detail.requestId || detail.code || detail.id || '—';
  const generatedAt = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1F1B16;
      padding: 28px;
      line-height: 1.45;
    }
    .brand { color: ${BRAND}; font-size: 12px; font-weight: 700; letter-spacing: 0.4px; }
    h1 { font-size: 22px; margin: 6px 0 4px; }
    .sub { color: #8D8680; font-size: 12px; margin-bottom: 18px; }
    h2 {
      font-size: 14px;
      margin: 22px 0 8px;
      padding-bottom: 6px;
      border-bottom: 2px solid ${BRAND};
    }
    table { width: 100%; border-collapse: collapse; }
    .label {
      width: 38%;
      color: #8D8680;
      font-size: 12px;
      padding: 7px 0;
      vertical-align: top;
    }
    .value {
      font-size: 13px;
      font-weight: 600;
      padding: 7px 0;
      vertical-align: top;
    }
    .footer {
      margin-top: 28px;
      font-size: 10px;
      color: #8D8680;
      border-top: 1px solid #F1E7DD;
      padding-top: 10px;
    }
    .pill {
      display: inline-block;
      background: #E6F7EA;
      color: #00AD28;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 999px;
    }
  </style>
</head>
<body>
  <div class="brand">ENFIELD ROYAL CLINICS</div>
  <h1>${escapeHtml(title)}</h1>
  <div class="sub">Request ID: ${escapeHtml(requestId)} · Generated ${escapeHtml(generatedAt)}</div>
  ${detail.statusLabel ? `<div class="pill">${escapeHtml(detail.statusLabel)}</div>` : ''}

  <h2>Patient Information</h2>
  <table>
    ${row('Patient Name', detail.patient || detail.patientName)}
    ${row('Patient ID', detail.patientId)}
    ${row('Phone', detail.phone)}
    ${row('Age / Gender', detail.ageGender)}
  </table>

  <h2>Treatment Details</h2>
  <table>
    ${row('Treatment', detail.treatment)}
    ${row('Department', detail.department)}
    ${row('Duration', detail.duration)}
    ${row('Treatment Price', detail.price)}
  </table>

  <h2>Selected Doctor</h2>
  <table>
    ${row('Doctor Name', detail.doctorName || detail.doctor)}
    ${row('Specialty', detail.doctorSpecialty || detail.specialty)}
    ${row('Branch', detail.branch)}
  </table>

  <h2>Appointment Schedule</h2>
  <table>
    ${row('Requested Date', detail.dateLabel || detail.date)}
    ${row('Requested Time', detail.timeRange || detail.time)}
    ${row('Branch', detail.branch)}
  </table>

  ${
    detail.allergy || detail.medication
      ? `<h2>Medical Alerts</h2>
  <table>
    ${row('Allergies', detail.allergy)}
    ${row('Medications', detail.medication)}
  </table>`
      : ''
  }

  <div class="footer">
    Enfield Royal Clinics · Appointment record for clinical reference.<br/>
    This PDF was generated from the doctor appointment detail screens.
  </div>
</body>
</html>`;
}

/**
 * Create a PDF from appointment page details and open the native share/save sheet.
 */
export async function downloadAppointmentPdf(detail = {}, options = {}) {
  const html = buildAppointmentPdfHtml(detail);
  const fileName =
    options.fileName ||
    `ERC-Appointment-${String(detail.requestId || detail.patientId || 'record').replace(/[^\w-]+/g, '_')}.pdf`;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Appointment PDF',
        UTI: 'com.adobe.pdf',
      });
      return { uri, shared: true };
    }

    // Web / environments without share sheet — open print dialog as fallback.
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return { uri, shared: false, printed: true };
    }

    Alert.alert('PDF ready', `Saved temporarily as ${fileName}`);
    return { uri, shared: false };
  } catch (error) {
    const message = error?.message || 'Could not create the appointment PDF.';
    Alert.alert('Download failed', message);
    throw error;
  }
}
