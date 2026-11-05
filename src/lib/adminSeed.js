/**
 * Instant admin home/appointments seed — same shape as backend getDashboard / listAppointments.
 * Pass a region (UAE/KSA/Oman/USA/Pakistan) to get a complete region-scoped payload
 * with the same design; omit region for the full multi-region catalog (cache source).
 */

const REGION_BRANCH = {
  UAE: 'br-dubai',
  KSA: 'br-riyadh',
  Oman: 'br-muscat',
  USA: 'br-nyc',
  Pakistan: 'br-lahore',
};

const REGION_STATS = {
  UAE: { appointments: 42, upcoming: 14, canceled: 9, alerts: 2 },
  KSA: { appointments: 31, upcoming: 11, canceled: 6, alerts: 2 },
  Oman: { appointments: 22, upcoming: 8, canceled: 4, alerts: 1 },
  USA: { appointments: 18, upcoming: 7, canceled: 5, alerts: 2 },
  Pakistan: { appointments: 24, upcoming: 9, canceled: 5, alerts: 1 },
};

function normalizeRegion(label) {
  const raw = String(label || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes('ksa') || raw.includes('saudi') || raw.includes('riyadh')) return 'KSA';
  if (raw.includes('oman') || raw === 'om' || raw.includes('muscat')) return 'Oman';
  if (raw.includes('pakistan') || raw === 'pk' || raw.includes('lahore')) return 'Pakistan';
  if (raw.includes('usa') || raw === 'us' || raw.includes('york') || raw.includes('united states')) {
    return 'USA';
  }
  if (raw.includes('uae') || raw.includes('emirates') || raw.includes('dubai')) return 'UAE';
  const hit = Object.keys(REGION_BRANCH).find((key) => key.toLowerCase() === raw);
  return hit || null;
}

function pad2(n) {
  return String(Math.max(0, Number(n) || 0)).padStart(2, '0');
}

function buildHomeStats(regionKey) {
  const stats = REGION_STATS[regionKey] || REGION_STATS.UAE;
  return [
    {
      id: 'appointments',
      icon: 'calendar-outline',
      value: pad2(stats.appointments),
      label: "Today's Appointments",
    },
    {
      id: 'upcoming',
      icon: 'time-outline',
      value: pad2(stats.upcoming),
      label: 'Upcoming Appointments',
    },
    {
      id: 'canceled',
      icon: 'document-text-outline',
      value: pad2(stats.canceled),
      label: 'Canceled Approvals',
    },
    {
      id: 'alerts',
      icon: 'notifications-outline',
      value: pad2(stats.alerts),
      label: 'Clinic Alerts',
    },
  ];
}

const ALL_ATTENTION = [
  {
    id: 'att-1',
    title: 'Refund Spike Detected',
    time: '5 hr ago',
    body: 'Dubai Branch: 18 refunds requested (~3.8× normal pace).',
    type: 'refund',
    branchId: 'br-dubai',
    region: 'UAE',
  },
  {
    id: 'att-2',
    title: 'Booking Drop Detected',
    time: '5 hr ago',
    body: 'New York Branch booking volume fell below the alert threshold.',
    type: 'booking',
    branchId: 'br-nyc',
    region: 'USA',
  },
  {
    id: 'att-ksa-1',
    title: 'Capacity Watch',
    time: '3 hr ago',
    body: 'Riyadh Royal Clinic is approaching peak afternoon capacity.',
    type: 'booking',
    branchId: 'br-riyadh',
    region: 'KSA',
  },
  {
    id: 'att-oman-1',
    title: 'Staff Coverage',
    time: '4 hr ago',
    body: 'Muscat Royal Clinic needs evening coverage confirmation.',
    type: 'accountRequests',
    branchId: 'br-muscat',
    region: 'Oman',
  },
  {
    id: 'att-pk-1',
    title: 'Follow-up Queue',
    time: '2 hr ago',
    body: 'Lahore Royal Clinic has pending treatment follow-ups.',
    type: 'booking',
    branchId: 'br-lahore',
    region: 'Pakistan',
  },
  {
    id: 'att-3',
    title: 'Approvals Pending',
    time: '5 hr ago',
    body: 'Clinic manager account requests requiring regional admin review.',
    type: 'accountRequests',
    branchId: null,
    region: null,
  },
];

const ALL_BRANCHES = [
  {
    id: 'br-dubai',
    name: 'Dubai Enfield Royal Clinic',
    address: 'Sheikh Zayed Rd',
    value: 109,
    quota: 81,
    progress: 0.813,
    city: 'Dubai',
    region: 'UAE',
    bookings: 109,
    growth: 32.2,
    status: 'active',
    bookingsToday: 42,
  },
  {
    id: 'br-riyadh',
    name: 'Riyadh Royal Clinic',
    address: 'King Fahd Rd',
    value: 98,
    quota: 74,
    progress: 0.74,
    city: 'Riyadh',
    region: 'KSA',
    bookings: 98,
    growth: 12.4,
    status: 'active',
    bookingsToday: 31,
  },
  {
    id: 'br-muscat',
    name: 'Muscat Royal Clinic',
    address: 'Qurum',
    value: 87,
    quota: 68,
    progress: 0.685,
    city: 'Muscat',
    region: 'Oman',
    bookings: 87,
    growth: 8.1,
    status: 'active',
    bookingsToday: 22,
  },
  {
    id: 'br-lahore',
    name: 'Lahore Royal Clinic',
    address: 'MM Alam Rd',
    value: 76,
    quota: 61,
    progress: 0.612,
    city: 'Lahore',
    region: 'Pakistan',
    bookings: 76,
    growth: 5.0,
    status: 'active',
    bookingsToday: 18,
  },
  {
    id: 'br-nyc',
    name: 'New York Royal Clinic',
    address: '5th Avenue',
    value: 54,
    quota: 42,
    progress: 0.42,
    city: 'New York',
    region: 'USA',
    bookings: 54,
    growth: -4.3,
    status: 'attention',
    bookingsToday: 11,
  },
];

const ALL_DOCTORS = [
  {
    id: 'doc-dubai-dermatologists-1',
    name: 'Dr. Layla Hassan',
    specialty: 'Dermatologist',
    specialtyCategory: 'Dermatologists',
    consults: 48,
    score: 94,
    branchId: 'br-dubai',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-dubai', name: 'Dubai Enfield Royal Clinic', city: 'Dubai', region: 'UAE' },
  },
  {
    id: 'doc-dubai-hair-transplant-1',
    name: 'Dr. Sarah Malik',
    specialty: 'Hair Specialist',
    specialtyCategory: 'Hair Transplant',
    consults: 42,
    score: 92,
    branchId: 'br-dubai',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-dubai', name: 'Dubai Enfield Royal Clinic', city: 'Dubai', region: 'UAE' },
  },
  {
    id: 'doc-dubai-laser-treatments-1',
    name: 'Dr. Nora Ahmed',
    specialty: 'Laser Specialist',
    specialtyCategory: 'Laser Treatments',
    consults: 39,
    score: 90,
    branchId: 'br-dubai',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-dubai', name: 'Dubai Enfield Royal Clinic', city: 'Dubai', region: 'UAE' },
  },
  {
    id: 'doc-riyadh-dermatologists-1',
    name: 'Dr. Layla Hassan',
    specialty: 'Dermatologist',
    specialtyCategory: 'Dermatologists',
    consults: 41,
    score: 91,
    branchId: 'br-riyadh',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-riyadh', name: 'Riyadh Royal Clinic', city: 'Riyadh', region: 'KSA' },
  },
  {
    id: 'doc-riyadh-laser-treatments-1',
    name: 'Dr. Nora Ahmed',
    specialty: 'Laser Specialist',
    specialtyCategory: 'Laser Treatments',
    consults: 36,
    score: 88,
    branchId: 'br-riyadh',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-riyadh', name: 'Riyadh Royal Clinic', city: 'Riyadh', region: 'KSA' },
  },
  {
    id: 'doc-riyadh-hair-transplant-1',
    name: 'Dr. Yusuf Alharbi',
    specialty: 'Hair Specialist',
    specialtyCategory: 'Hair Transplant',
    consults: 33,
    score: 87,
    branchId: 'br-riyadh',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-riyadh', name: 'Riyadh Royal Clinic', city: 'Riyadh', region: 'KSA' },
  },
  {
    id: 'doc-muscat-dental-treatments-1',
    name: 'Dr. Hassan Reza',
    specialty: 'Dentist',
    specialtyCategory: 'Dental Treatments',
    consults: 29,
    score: 85,
    branchId: 'br-muscat',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-muscat', name: 'Muscat Royal Clinic', city: 'Muscat', region: 'Oman' },
  },
  {
    id: 'doc-muscat-skincare-1',
    name: 'Dr. Lina Costa',
    specialty: 'Skincare Specialist',
    specialtyCategory: 'Skincare',
    consults: 26,
    score: 84,
    branchId: 'br-muscat',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-muscat', name: 'Muscat Royal Clinic', city: 'Muscat', region: 'Oman' },
  },
  {
    id: 'doc-nyc-dermatologists-1',
    name: 'Dr. Ali Khan',
    specialty: 'Dermatologist',
    specialtyCategory: 'Dermatologists',
    consults: 38,
    score: 90,
    branchId: 'br-nyc',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-nyc', name: 'New York Royal Clinic', city: 'New York', region: 'USA' },
  },
  {
    id: 'doc-nyc-laser-treatments-1',
    name: 'Dr. Adam Keller',
    specialty: 'Laser Specialist',
    specialtyCategory: 'Laser Treatments',
    consults: 31,
    score: 87,
    branchId: 'br-nyc',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-nyc', name: 'New York Royal Clinic', city: 'New York', region: 'USA' },
  },
  {
    id: 'doc-lahore-dermatologists-1',
    name: 'Dr. Priya Shah',
    specialty: 'Dermatologist',
    specialtyCategory: 'Dermatologists',
    consults: 34,
    score: 89,
    branchId: 'br-lahore',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-lahore', name: 'Lahore Royal Clinic', city: 'Lahore', region: 'Pakistan' },
  },
  {
    id: 'doc-lahore-hair-transplant-1',
    name: 'Dr. Bilal Ahmed',
    specialty: 'Hair Specialist',
    specialtyCategory: 'Hair Transplant',
    consults: 28,
    score: 86,
    branchId: 'br-lahore',
    photoKey: 'treatmentdoctor',
    clinic: { id: 'br-lahore', name: 'Lahore Royal Clinic', city: 'Lahore', region: 'Pakistan' },
  },
];

const ALL_MANAGERS = [
  {
    id: 'mgr-ksa',
    name: 'Ahmed Al-Faisal',
    email: 'ahmed.ksa@erc-demo.com',
    status: 'active',
    employeeId: 'CM-2001',
    appointmentsToday: 22,
    branchId: 'br-riyadh',
    clinic: { id: 'br-riyadh', name: 'Riyadh Royal Clinic', city: 'Riyadh', region: 'KSA' },
  },
  {
    id: 'mgr-dubai',
    name: 'Omar Hassan',
    email: 'omar.dubai@erc-demo.com',
    status: 'active',
    employeeId: 'CM-2002',
    appointmentsToday: 28,
    branchId: 'br-dubai',
    clinic: { id: 'br-dubai', name: 'Dubai Enfield Royal Clinic', city: 'Dubai', region: 'UAE' },
  },
  {
    id: 'mgr-oman',
    name: 'Khalid Al-Balushi',
    email: 'khalid.oman@erc-demo.com',
    status: 'active',
    employeeId: 'CM-2003',
    appointmentsToday: 16,
    branchId: 'br-muscat',
    clinic: { id: 'br-muscat', name: 'Muscat Royal Clinic', city: 'Muscat', region: 'Oman' },
  },
  {
    id: 'mgr-usa',
    name: 'James Anderson',
    email: 'james.usa@erc-demo.com',
    status: 'active',
    employeeId: 'CM-2004',
    appointmentsToday: 14,
    branchId: 'br-nyc',
    clinic: { id: 'br-nyc', name: 'New York Royal Clinic', city: 'New York', region: 'USA' },
  },
  {
    id: 'mgr-pk',
    name: 'Hamza Khan',
    email: 'hamza.pk@erc-demo.com',
    status: 'active',
    employeeId: 'CM-2005',
    appointmentsToday: 18,
    branchId: 'br-lahore',
    clinic: { id: 'br-lahore', name: 'Lahore Royal Clinic', city: 'Lahore', region: 'Pakistan' },
  },
];

const ALL_APPOINTMENTS = [
  {
    id: 'apt-seed-1',
    code: 'APT-1024',
    patient: 'Maaz Khan',
    doctor: 'Dr. Sarah Malik',
    treatment: 'Laser Treatment',
    time: '09:30 AM',
    status: 'upcoming',
    branchId: 'br-dubai',
    region: 'UAE',
  },
  {
    id: 'apt-seed-2',
    code: 'APT-1025',
    patient: 'Amina Al Saud',
    doctor: 'Dr. Nora Ahmed',
    treatment: 'Dermatology Consultation',
    time: '10:00 AM',
    status: 'upcoming',
    branchId: 'br-riyadh',
    region: 'KSA',
  },
  {
    id: 'apt-seed-3',
    code: 'APT-1018',
    patient: 'Hassan Almutairi',
    doctor: 'Dr. Yusuf Alharbi',
    treatment: 'Hair Treatment',
    time: '02:30 PM',
    status: 'completed',
    branchId: 'br-riyadh',
    region: 'KSA',
  },
  {
    id: 'apt-seed-4',
    code: 'APT-1011',
    patient: 'Sara Alqahtani',
    doctor: 'Dr. Layla Hassan',
    treatment: 'Laser Treatment',
    time: '04:00 PM',
    status: 'canceled',
    branchId: 'br-riyadh',
    region: 'KSA',
  },
  {
    id: 'apt-seed-5',
    code: 'APT-1030',
    patient: 'Fatima Al Lawati',
    doctor: 'Dr. Hassan Reza',
    treatment: 'Dental Cleaning',
    time: '11:00 AM',
    status: 'upcoming',
    branchId: 'br-muscat',
    region: 'Oman',
  },
  {
    id: 'apt-seed-6',
    code: 'APT-1031',
    patient: 'Sophia Martinez',
    doctor: 'Dr. Adam Keller',
    treatment: 'Laser Treatment',
    time: '01:00 PM',
    status: 'upcoming',
    branchId: 'br-nyc',
    region: 'USA',
  },
  {
    id: 'apt-seed-7',
    code: 'APT-1032',
    patient: 'Sana Iqbal',
    doctor: 'Dr. Priya Shah',
    treatment: 'Dermatology Consultation',
    time: '03:00 PM',
    status: 'completed',
    branchId: 'br-lahore',
    region: 'Pakistan',
  },
  {
    id: 'apt-seed-8',
    code: 'APT-1033',
    patient: 'Omar Khan',
    doctor: 'Dr. Nora Ahmed',
    treatment: 'Laser Hair Removal',
    time: '12:00 PM',
    status: 'upcoming',
    branchId: 'br-dubai',
    region: 'UAE',
  },
];

function filterByRegion(regionHint, { branches, doctors, managers, attention, appointments }) {
  const regionKey = normalizeRegion(regionHint);
  if (!regionKey) {
    return { regionKey: null, branches, doctors, managers, attention, appointments };
  }
  const branchId = REGION_BRANCH[regionKey];
  return {
    regionKey,
    branchId,
    branches: branches.filter((item) => item.id === branchId || item.region === regionKey),
    doctors: doctors.filter((item) => item.branchId === branchId || item.clinic?.region === regionKey),
    managers: managers.filter(
      (item) => item.branchId === branchId || item.clinic?.id === branchId || item.clinic?.region === regionKey
    ),
    attention: attention.filter(
      (item) => item.branchId === branchId || (item.branchId == null && item.region == null)
    ),
    appointments: appointments.filter(
      (item) => item.branchId === branchId || item.region === regionKey
    ),
  };
}

export function createAdminSeedDashboard(regionHint) {
  const filtered = filterByRegion(regionHint, {
    branches: ALL_BRANCHES,
    doctors: ALL_DOCTORS,
    managers: ALL_MANAGERS,
    attention: ALL_ATTENTION,
    appointments: ALL_APPOINTMENTS,
  });
  const regionKey = filtered.regionKey;
  const branches = (filtered.branches.length ? filtered.branches : ALL_BRANCHES).map((branch) => ({
    id: branch.id,
    name: branch.name,
    address: branch.address,
    value: branch.value ?? branch.bookings,
    quota: branch.quota,
    progress: branch.progress,
    city: branch.city,
    region: branch.region,
  }));
  const doctors = (filtered.doctors.length ? filtered.doctors : ALL_DOCTORS).map((doctor) => ({
    ...doctor,
    clinic: doctor.clinic,
    branchName: doctor.clinic?.name || doctor.branchName || null,
  }));
  const managerPreview = (filtered.managers.length ? filtered.managers : ALL_MANAGERS).map((manager) => ({
    id: manager.id,
    name: manager.name,
    email: manager.email,
    appointmentsToday: manager.appointmentsToday,
    clinic: manager.clinic,
  }));
  const attention = filtered.attention.length ? filtered.attention : ALL_ATTENTION.slice(0, 2);

  return {
    region: regionKey || undefined,
    stats: regionKey
      ? buildHomeStats(regionKey)
      : [
          { id: 'appointments', icon: 'calendar-outline', value: '42', label: "Today's Appointments" },
          { id: 'upcoming', icon: 'time-outline', value: '14', label: 'Upcoming Appointments' },
          { id: 'canceled', icon: 'document-text-outline', value: '09', label: 'Canceled Approvals' },
          { id: 'alerts', icon: 'notifications-outline', value: '03', label: 'Clinic Alerts' },
        ],
    attention,
    branches,
    doctors,
    managerPreview,
  };
}

export function createAdminSeedAppointments(regionHint) {
  const filtered = filterByRegion(regionHint, {
    branches: ALL_BRANCHES,
    doctors: ALL_DOCTORS,
    managers: ALL_MANAGERS,
    attention: ALL_ATTENTION,
    appointments: ALL_APPOINTMENTS,
  });
  const items = filtered.appointments.length ? filtered.appointments : ALL_APPOINTMENTS;
  const upcoming = items.filter((item) => item.status === 'upcoming').length;
  const completed = items.filter((item) => item.status === 'completed').length;
  const canceled = items.filter((item) => item.status === 'canceled').length;
  const regionKey = filtered.regionKey;
  const regionStats = regionKey ? REGION_STATS[regionKey] : null;

  return {
    stats: [
      {
        id: 'today',
        icon: 'calendar-outline',
        value: pad2(regionStats?.appointments ?? items.length),
        label: "Today's Appointments",
        change: 32.2,
      },
      {
        id: 'upcoming',
        icon: 'time-outline',
        value: pad2(upcoming || regionStats?.upcoming || 0),
        label: 'Upcoming',
        change: -20.1,
      },
      {
        id: 'completed',
        icon: 'checkmark-circle-outline',
        value: pad2(completed || 12),
        label: 'Completed visits',
        change: -30.2,
      },
      {
        id: 'canceled',
        icon: 'close-circle-outline',
        value: pad2(canceled || regionStats?.canceled || 0),
        label: 'Canceled bookings',
        change: 12.2,
      },
    ],
    items,
  };
}

export function createAdminSeedBranches(regionHint) {
  const filtered = filterByRegion(regionHint, {
    branches: ALL_BRANCHES,
    doctors: ALL_DOCTORS,
    managers: ALL_MANAGERS,
    attention: ALL_ATTENTION,
    appointments: ALL_APPOINTMENTS,
  });
  const items = (filtered.branches.length ? filtered.branches : ALL_BRANCHES).map((branch) => ({
    id: branch.id,
    name: branch.name,
    city: branch.city,
    region: branch.region,
    address: branch.address,
    bookings: branch.bookings ?? branch.value,
    growth: branch.growth ?? 0,
    progress: typeof branch.progress === 'number' && branch.progress <= 1
      ? Number((branch.progress * 100).toFixed(1))
      : branch.progress,
    status: branch.status || 'active',
    bookingsToday: branch.bookingsToday ?? 0,
  }));
  return { items };
}

export function createAdminSeedManagers(regionHint) {
  const filtered = filterByRegion(regionHint, {
    branches: ALL_BRANCHES,
    doctors: ALL_DOCTORS,
    managers: ALL_MANAGERS,
    attention: ALL_ATTENTION,
    appointments: ALL_APPOINTMENTS,
  });
  const items = filtered.managers.length ? filtered.managers : ALL_MANAGERS;
  return {
    stats: {
      total: items.length,
      active: items.filter((item) => item.status === 'active').length,
      invited: 0,
      inactive: 0,
      cards: [
        {
          id: 'total',
          label: 'Total',
          value: pad2(items.length),
          sub: filtered.regionKey ? `${filtered.regionKey} Clinics` : 'All Clinics',
        },
        {
          id: 'active',
          label: 'Active',
          value: pad2(items.filter((item) => item.status === 'active').length),
          sub: 'Of Region',
        },
        { id: 'pending', label: 'Pending', value: '00', sub: '0% Of Total' },
      ],
    },
    items,
  };
}
