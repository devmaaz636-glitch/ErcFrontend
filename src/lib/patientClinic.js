import { normalizeRegionKey, REGION_CURRENCY, formatRegionPrice } from './regionPricing';

const TAGLINE = 'Discover exclusive offers and experience the beauty you deserve.';

/**
 * Real Enfield clinic locations.
 * Patients keep the same UI — only clinic / price data changes by region (+ branch when set).
 */
export const PATIENT_CLINIC_CATALOG = [
  // UAE
  {
    id: 'clinic-dubai',
    branchId: 'br-dubai',
    region: 'UAE',
    name: 'Enfield Royal Clinic Dubai, UAE',
    city: 'Dubai',
    phone: '+971 4373 9000',
    email: 'info@royalclinicdubai.com',
    address: 'Villa 1089, Al Wasl Road, Al Manara Area, Dubai UAE',
    shortAddress: 'Villa 1089, Al Wasl Road, Al Manara Area',
    tagline: TAGLINE,
    lat: 25.2116,
    lng: 55.2534,
    aliases: ['dubai', 'al manara', 'al wasl', 'br-dubai'],
  },
  {
    id: 'clinic-abu-dhabi-khalifa',
    branchId: 'br-abu-dhabi',
    region: 'UAE',
    name: 'Enfield Royal Clinic Abu Dhabi, UAE',
    city: 'Abu Dhabi',
    phone: '+971 25568001',
    email: 'info@enfieldabudhabi.ae',
    address: '142 Al ishoush Street - Khalifa City - Abu Dhabi',
    shortAddress: '142 Al ishoush Street, Khalifa City',
    tagline: TAGLINE,
    lat: 24.4192,
    lng: 54.578,
    aliases: ['khalifa', 'ishoush', 'abu dhabi', 'abudhabi', 'br-abu-dhabi'],
  },
  {
    id: 'clinic-abu-dhabi-shakhbout',
    branchId: 'br-shakhbout',
    region: 'UAE',
    name: 'Enfield Royal Clinic Abu Dhabi | Shakhbout City',
    city: 'Abu Dhabi',
    phone: '+971 025 014200',
    email: 'info@enfieldroyalclinicad.ae',
    address: "Villa 3 - Block 9 Al ʹAlya-a St - Shakhbout City - Abu Dhabi",
    shortAddress: "Villa 3, Block 9 Al ʹAlya-a St, Shakhbout City",
    tagline: TAGLINE,
    lat: 24.358,
    lng: 54.625,
    aliases: ['shakhbout', 'alya', 'br-shakhbout'],
  },
  // KSA
  {
    id: 'clinic-riyadh',
    branchId: 'br-riyadh',
    region: 'KSA',
    name: 'Enfield Royal Clinic Riyadh, KSA',
    city: 'Riyadh',
    phone: '+966 58 262 2856',
    email: 'info@enfieldroyalsaudia.com',
    address: 'QQ85+M2M, Al Hamra, Riyadh 13214, Saudi Arabia',
    shortAddress: 'QQ85+M2M, Al Hamra, Riyadh 13214',
    tagline: TAGLINE,
    lat: 24.7743,
    lng: 46.7386,
    aliases: ['riyadh', 'al hamra', 'ksa', 'saudi', 'br-riyadh'],
  },
  // Oman
  {
    id: 'clinic-muscat',
    branchId: 'br-muscat',
    region: 'Oman',
    name: 'Enfield Royal Clinic Muscat, Oman',
    city: 'Muscat',
    phone: '+968 9272 6406',
    email: 'info@enfieldroyalclinics.om',
    address: 'Al Sarooj, 3013 Way, Al Kharjiyah St, Muscat, Oman',
    shortAddress: 'Al Sarooj, 3013 Way, Al Kharjiyah St',
    tagline: TAGLINE,
    lat: 23.615,
    lng: 58.45,
    aliases: ['muscat', 'sarooj', 'kharjiyah', 'oman', 'br-muscat'],
  },
  // Pakistan — Islamabad only (not Lahore)
  {
    id: 'clinic-islamabad',
    branchId: 'br-lahore', // existing Pakistan branch id in app data
    region: 'Pakistan',
    name: 'Enfield Royal Clinic Islamabad, Pakistan',
    city: 'Islamabad',
    phone: '+92 332 5488777',
    email: 'info@enfieldroyalclinics.com.pk',
    address: '3rd Floor, Ammar Center, Block # 13-A College road F-7 Markaz Islamabad, Pakistan',
    shortAddress: 'Ammar Center, Block 13-A, F-7 Markaz',
    tagline: TAGLINE,
    lat: 33.7295,
    lng: 73.057,
    aliases: ['islamabad', 'f-7', 'ammar', 'f7', 'pakistan', 'br-islamabad', 'br-lahore', 'lahore'],
  },
  // USA
  {
    id: 'clinic-viera-fl',
    branchId: 'br-viera',
    region: 'USA',
    name: 'Enfield Royal Clinics | Med Spa of Viera, FL',
    city: 'Rockledge',
    phone: '+1 908-836-7788',
    email: 'info@enfieldroyalclinic.com',
    address: '5460 Village Drive, Rockledge, Florida 32955, United States',
    shortAddress: '5460 Village Drive, Rockledge, FL 32955',
    tagline: TAGLINE,
    lat: 28.265,
    lng: -80.725,
    aliases: ['viera', 'rockledge', 'florida', 'fl', 'br-viera', 'br-nyc'],
  },
  {
    id: 'clinic-tomball-tx',
    branchId: 'br-tomball',
    region: 'USA',
    name: 'Enfield Royal Houston – Med Spa of Tomball, TX',
    city: 'Tomball',
    phone: '(281) 956-8950',
    email: 'info@enfieldroyalclinic.com',
    address: '11606 Westlock Dr, 105A Tomball, TX, 77377',
    shortAddress: '11606 Westlock Dr, 105A, Tomball, TX',
    tagline: TAGLINE,
    lat: 30.097,
    lng: -95.616,
    aliases: ['tomball', 'houston', 'texas', 'tx', 'westlock', 'br-tomball'],
  },
  {
    id: 'clinic-branchburg-nj',
    branchId: 'br-branchburg',
    region: 'USA',
    name: 'Enfield Royal Clinics - Med Spa Of Branchburg, NJ',
    city: 'Branchburg',
    phone: '+1 908-895-8008',
    email: 'info@enfieldroyalclinic.com',
    address: '1018 US-202, Branchburg, NJ 08876',
    shortAddress: '1018 US-202, Branchburg, NJ',
    tagline: TAGLINE,
    lat: 40.565,
    lng: -74.685,
    aliases: ['branchburg', 'br-branchburg'],
  },
  {
    id: 'clinic-princeton-nj',
    branchId: 'br-princeton',
    region: 'USA',
    name: 'Enfield Royal Clinic – Med Spa Of Princeton, NJ',
    city: 'Princeton Junction',
    phone: '+1 908-895-8008',
    email: 'info@enfieldroyalclinic.com',
    address: '43 Princeton Hightstown Rd #1103, Princeton Junction, NJ 08550',
    shortAddress: '43 Princeton Hightstown Rd #1103',
    tagline: TAGLINE,
    lat: 40.304,
    lng: -74.62,
    aliases: ['princeton', 'hightstown', 'br-princeton'],
  },
];

/** Default clinic id when a region has several locations. */
const REGION_DEFAULT_CLINIC = {
  UAE: 'clinic-dubai',
  KSA: 'clinic-riyadh',
  Oman: 'clinic-muscat',
  Pakistan: 'clinic-islamabad',
  USA: 'clinic-viera-fl',
};

function clinicHint(user) {
  return [
    user?.clinicId,
    user?.branchId,
    user?.branchName,
    user?.clinicName,
    user?.city,
    user?.displayRegion,
    user?.region,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function resolvePatientRegion(user) {
  return normalizeRegionKey(
    user?.region || user?.displayRegion || user?.branchName || user?.city || 'UAE'
  );
}

export function listPatientClinics(region) {
  const key = normalizeRegionKey(region);
  return PATIENT_CLINIC_CATALOG.filter((item) => item.region === key);
}

function matchClinicByHint(clinics, hint) {
  if (!hint) return null;
  const byBranch = clinics.find(
    (item) =>
      hint.includes(String(item.branchId || '').toLowerCase()) ||
      hint.includes(String(item.id || '').toLowerCase())
  );
  if (byBranch) return byBranch;

  return (
    clinics.find((item) =>
      (item.aliases || []).some((alias) => alias && hint.includes(String(alias).toLowerCase()))
    ) ||
    clinics.find((item) => hint.includes(String(item.city || '').toLowerCase())) ||
    null
  );
}

/**
 * Resolve the clinic card for a patient.
 * Same design for every patient — location/phone/map/currency follow their region
 * (and specific branch when branchId/city is set).
 */
export function getPatientClinic(userOrRegion) {
  if (typeof userOrRegion === 'string') {
    const key = normalizeRegionKey(userOrRegion);
    const list = listPatientClinics(key);
    const defaultId = REGION_DEFAULT_CLINIC[key];
    return list.find((item) => item.id === defaultId) || list[0] || PATIENT_CLINIC_CATALOG[0];
  }

  const user = userOrRegion || {};
  const region = resolvePatientRegion(user);
  const list = listPatientClinics(region);
  const hint = clinicHint(user);
  const matched = matchClinicByHint(list, hint) || matchClinicByHint(PATIENT_CLINIC_CATALOG, hint);
  if (matched) return matched;

  const defaultId = REGION_DEFAULT_CLINIC[region];
  return list.find((item) => item.id === defaultId) || list[0] || PATIENT_CLINIC_CATALOG[0];
}

/** @deprecated shape kept for older imports — prefer getPatientClinic / listPatientClinics */
export const PATIENT_CLINICS = Object.fromEntries(
  Object.keys(REGION_DEFAULT_CLINIC).map((key) => [key, getPatientClinic(key)])
);

export function clinicMapsUrl(clinic) {
  if (!clinic) return '';
  // Prefer full address so maps open on the correct city (e.g. Islamabad, not Lahore).
  const query =
    clinic.address ||
    [clinic.name, clinic.shortAddress, clinic.city, clinic.region].filter(Boolean).join(', ');
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  if (clinic.lat != null && clinic.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${clinic.lat},${clinic.lng}`;
  }
  return 'https://www.google.com/maps/search/?api=1&query=Enfield%20Royal%20Clinic';
}

export function clinicMapImageUrl(clinic, width = 640, height = 280) {
  const lat = clinic?.lat ?? 25.2116;
  const lng = clinic?.lng ?? 55.2534;
  const w = Math.min(Math.max(Math.round(width), 320), 1280);
  const h = Math.min(Math.max(Math.round(height), 160), 1024);
  return `https://maps.wikimedia.org/img/osm-intl,16,${lat},${lng},${w}x${h}.png`;
}

/** Interactive OpenStreetMap embed for the selected clinic coords. */
export function clinicMapEmbedHtml(clinic) {
  const lat = Number(clinic?.lat ?? 25.2116);
  const lng = Number(clinic?.lng ?? 55.2534);
  const title = String(clinic?.name || 'Enfield Royal Clinic').replace(/[<>&"']/g, '');
  const city = String(clinic?.city || '').replace(/[<>&"']/g, '');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin:0; padding:0; width:100%; height:100%; background:#e8efe8; }
    .leaflet-control-attribution { font-size:9px !important; }
    .pin {
      background:#BF824F; width:16px; height:16px; border-radius:50%;
      border:3px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,.25);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: true })
      .setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    var icon = L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [22,22], iconAnchor: [11,11] });
    L.marker([${lat}, ${lng}], { icon: icon }).addTo(map)
      .bindPopup('${title}<br/>${city}');
    setTimeout(function(){ map.invalidateSize(); }, 120);
  </script>
</body>
</html>`;
}

export function patientTreatmentPrice(basePrice = 600, userOrRegion) {
  const region =
    typeof userOrRegion === 'string'
      ? normalizeRegionKey(userOrRegion)
      : resolvePatientRegion(userOrRegion);
  const priced = formatRegionPrice(basePrice, region, '');
  return {
    ...priced,
    priceLabel: `${priced.currency} ${Number(priced.price).toLocaleString('en-US')}`.trim(),
  };
}

const REGION_FLAGS = {
  UAE: '🇦🇪',
  KSA: '🇸🇦',
  Oman: '🇴🇲',
  Pakistan: '🇵🇰',
  USA: '🇺🇸',
};

export function patientRegionFlag(userOrRegion) {
  const region =
    typeof userOrRegion === 'string'
      ? normalizeRegionKey(userOrRegion)
      : resolvePatientRegion(userOrRegion);
  return REGION_FLAGS[region] || '📍';
}

export function patientBranchLabel(user) {
  const clinic = getPatientClinic(user);
  if (!clinic) return user?.branchName || 'Select clinic';
  return clinic.city || 'Clinic';
}

export function patientBranchMeta(user) {
  const clinic = getPatientClinic(user);
  return {
    clinic,
    city: clinic?.city || 'Clinic',
    region: clinic?.region || resolvePatientRegion(user),
    flag: patientRegionFlag(clinic?.region || user),
    label: clinic?.city ? `${clinic.city} Branch` : 'Select clinic',
  };
}

export { REGION_CURRENCY, normalizeRegionKey };
