import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

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

function isShareCancelError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('cancel') ||
    message.includes('dismiss') ||
    message.includes('shareditemunavailable') ||
    error?.code === 'ERR_SHARE_CANCELED'
  );
}

function safePdfName(fileName, detail = {}) {
  const raw =
    fileName ||
    `ERC-Appointment-${String(detail.requestId || detail.patientId || 'record').replace(/[^\w-]+/g, '_')}.pdf`;
  const cleaned = String(raw).replace(/[^\w.-]+/g, '_');
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
}

/**
 * Build printable HTML for a doctor appointment booking / visit detail.
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

async function createPdfInCache(html, fileName) {
  const printed = await Print.printToFileAsync({ html });
  const sourceUri = printed?.uri;
  if (!sourceUri) throw new Error('Could not create the PDF file.');

  const cacheRoot = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!cacheRoot) return sourceUri;

  const targetUri = `${cacheRoot}${fileName}`;
  try {
    const info = await FileSystem.getInfoAsync(targetUri);
    if (info.exists) {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
    return targetUri;
  } catch {
    return sourceUri;
  }
}

async function savePdfToAppDocuments(uri, fileName) {
  const docsRoot = FileSystem.documentDirectory;
  if (!docsRoot) return uri;
  const dest = `${docsRoot}${fileName}`;
  try {
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      await FileSystem.deleteAsync(dest, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

/** Android: let the user pick a Downloads / folder location and write the PDF there. */
async function savePdfWithSaf(uri, fileName) {
  if (Platform.OS !== 'android' || !FileSystem.StorageAccessFramework) {
    return null;
  }
  try {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return null;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const created = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName.replace(/\.pdf$/i, ''),
      'application/pdf'
    );
    await FileSystem.writeAsStringAsync(created, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return created;
  } catch {
    return null;
  }
}

/**
 * Create appointment PDF and save it on the device (no print dialog).
 * Android prefers folder picker; otherwise share sheet for Save to Files / Drive.
 */
export async function downloadAppointmentPdf(detail = {}, options = {}) {
  const html = buildAppointmentPdfHtml(detail);
  const fileName = safePdfName(options.fileName, detail);

  try {
    if (Platform.OS === 'web') {
      // Browser download via print-to-file isn't available the same way; open a blob share.
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Appointment PDF',
        });
      }
      return { uri, saved: true };
    }

    const cacheUri = await createPdfInCache(html, fileName);
    const localUri = await savePdfToAppDocuments(cacheUri, fileName);

    // Prefer writing into a user-chosen system folder on Android.
    const safUri = await savePdfWithSaf(localUri, fileName);
    if (safUri) {
      Alert.alert('Downloaded', 'Appointment PDF saved to your selected folder.');
      return { uri: safUri, saved: true, method: 'saf' };
    }

    const canShare = await Sharing.isAvailableAsync().catch(() => false);
    if (canShare) {
      try {
        await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Appointment PDF',
          UTI: 'com.adobe.pdf',
        });
        return { uri: localUri, saved: true, method: 'share' };
      } catch (shareError) {
        if (isShareCancelError(shareError)) {
          return { uri: localUri, saved: false, canceled: true };
        }
      }
    }

    Alert.alert('PDF saved', `Saved on this device as ${fileName}`);
    return { uri: localUri, saved: true, method: 'documents' };
  } catch (error) {
    if (isShareCancelError(error)) {
      return { uri: null, saved: false, canceled: true };
    }
    Alert.alert('Download failed', 'Could not save the appointment PDF. Please try again.');
    throw error;
  }
}
