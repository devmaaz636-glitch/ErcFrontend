/**
 * Instant clinic-manager home seed — paints ManagerTabs immediately after Get Started.
 * Scoped by branchId so every region / newly assigned manager gets a full home,
 * then live /api/manager/* responses replace this as soon as they arrive.
 */

const PERIOD = () => new Date().toISOString().slice(0, 7);
const TODAY = () => new Date().toISOString().slice(0, 10);

export const MANAGER_CLINIC_CATALOG = {
  'br-riyadh': {
    id: 'br-riyadh',
    name: 'Riyadh Royal Clinic',
    city: 'Riyadh',
    region: 'KSA',
    address: 'King Fahd Rd',
    currency: 'SAR',
    doctors: [
      { id: 'doc-3', name: 'Dr. Nora Ahmed', specialty: 'Laser Specialist', consults: 36, score: 88 },
      { id: 'doc-3b', name: 'Dr. Layla Hassan', specialty: 'Dermatologist', consults: 41, score: 91 },
      { id: 'doc-3c', name: 'Dr. Yusuf Alharbi', specialty: 'Hair Specialist', consults: 33, score: 87 },
    ],
    patients: ['Amina Al Saud', 'Hassan Almutairi', 'Sara Alqahtani', 'Omar Fahad', 'Lina Alharbi'],
  },
  'br-dubai': {
    id: 'br-dubai',
    name: 'Dubai Enfield Royal Clinic',
    city: 'Dubai',
    region: 'UAE',
    address: 'Sheikh Zayed Rd',
    currency: 'AED',
    doctors: [
      { id: 'doc-1', name: 'Dr. Ali Khan', specialty: 'Dermatologist', consults: 48, score: 94 },
      { id: 'doc-2', name: 'Dr. Sarah Malik', specialty: 'Hair Specialist', consults: 42, score: 92 },
    ],
    patients: ['Maaz', 'Sara Ali', 'Omar Khan', 'Layla Hassan', 'Noor Ahmed'],
  },
  'br-muscat': {
    id: 'br-muscat',
    name: 'Muscat Royal Clinic',
    city: 'Muscat',
    region: 'Oman',
    address: 'Qurum',
    currency: 'OMR',
    doctors: [
      { id: 'doc-4', name: 'Dr. Hassan Reza', specialty: 'Dentist', consults: 29, score: 85 },
    ],
    patients: ['Fatima Al Lawati', 'Said Al Busaidi', 'Maryam Al Hinai'],
  },
  'br-nyc': {
    id: 'br-nyc',
    name: 'New York Royal Clinic',
    city: 'New York',
    region: 'USA',
    address: '5th Avenue',
    currency: 'USD',
    doctors: [
      { id: 'doc-nyc-1', name: 'Dr. Emily Carter', specialty: 'Dermatologist', consults: 38, score: 90 },
      { id: 'doc-nyc-2', name: 'Dr. Michael Brooks', specialty: 'Laser Specialist', consults: 31, score: 87 },
    ],
    patients: ['Sophia Martinez', 'Daniel Reed', 'Emma Collins'],
  },
  'br-lahore': {
    id: 'br-lahore',
    name: 'Lahore Royal Clinic',
    city: 'Lahore',
    region: 'Pakistan',
    address: 'MM Alam Rd',
    currency: 'PKR',
    doctors: [
      { id: 'doc-pk-1', name: 'Dr. Ayesha Malik', specialty: 'Dermatologist', consults: 34, score: 89 },
      { id: 'doc-pk-2', name: 'Dr. Bilal Ahmed', specialty: 'Hair Specialist', consults: 28, score: 86 },
    ],
    patients: ['Sana Iqbal', 'Usman Raza', 'Hira Khan'],
  },
};

const DEFAULT_STATS = [
  { id: 'today', icon: 'calendar-outline', value: '31', label: "Today's Appointments", change: 12.4 },
  { id: 'upcoming', icon: 'time-outline', value: '14', label: 'Upcoming', change: -8.2 },
  { id: 'completed', icon: 'checkmark-circle-outline', value: '12', label: 'Completed Visits', change: -3.2 },
  { id: 'canceled', icon: 'close-circle-outline', value: '09', label: 'Canceled Bookings', change: 10.2 },
];

const DEFAULT_TREATMENTS = [
  { id: 'laser-treatment', name: 'Laser Treatment', sessions: 12, quota: 124 },
  { id: 'hair-treatment', name: 'Hair Treatment', sessions: 8, quota: 100 },
  { id: 'dermatology-consultation', name: 'Dermatology Consultation', sessions: 6, quota: 80 },
];

function resolveClinic(branchId, regionHint) {
  const id = String(branchId || '').trim();
  if (MANAGER_CLINIC_CATALOG[id]) return MANAGER_CLINIC_CATALOG[id];

  const region = String(regionHint || '').trim();
  const byRegion = Object.values(MANAGER_CLINIC_CATALOG).find(
    (clinic) =>
      clinic.region.toLowerCase() === region.toLowerCase() ||
      clinic.city.toLowerCase() === region.toLowerCase()
  );
  if (byRegion) return byRegion;

  // Brand-new clinic / unknown branch — still paint a full professional home.
  const slug = id || 'br-new';
  return {
    id: slug,
    name: region ? `${region} Royal Clinic` : 'Enfield Royal Clinic',
    city: region || 'Clinic',
    region: region || 'Region',
    address: 'Main Campus',
    currency: 'AED',
    doctors: [
      {
        id: `${slug}-doc-1`,
        name: 'Dr. Assigned Specialist',
        specialty: 'Dermatologist',
        consults: 24,
        score: 88,
      },
      {
        id: `${slug}-doc-2`,
        name: 'Dr. Clinic Lead',
        specialty: 'Laser Specialist',
        consults: 20,
        score: 86,
      },
    ],
    patients: ['New Patient A', 'New Patient B', 'New Patient C'],
  };
}

export function resolveManagerClinic(branchId, regionHint) {
  return resolveClinic(branchId, regionHint);
}

export function createManagerSeedDashboard(branchId, regionHint) {
  const clinic = resolveClinic(branchId, regionHint);
  const period = PERIOD();
  const doctors = clinic.doctors.map((doctor) => ({
    ...doctor,
    clinic: clinic.name,
  }));
  const patients = clinic.patients || ['Patient One', 'Patient Two', 'Patient Three'];

  return {
    clinic: {
      id: clinic.id,
      name: clinic.name,
      city: clinic.city,
      region: clinic.region,
      address: clinic.address,
      status: 'active',
    },
    stats: DEFAULT_STATS.map((item) => ({ ...item })),
    appointments: [],
    appointmentRequests: patients.slice(0, 3).map((patient, index) => ({
      id: `req-${clinic.id}-${index + 1}`,
      appointmentId: `APT-${clinic.id}-${2200 + index}`,
      patient,
      treatment: DEFAULT_TREATMENTS[index % DEFAULT_TREATMENTS.length].name,
      requestedTime: ['10:00 AM', '02:30 PM', '04:00 PM'][index % 3],
      doctor: doctors[index % doctors.length]?.name || 'Assigned Doctor',
      status: 'pending',
    })),
    pendingApprovals: Math.min(3, patients.length),
    doctors,
    treatments: DEFAULT_TREATMENTS.map((item) => ({
      ...item,
      period,
      progress: item.quota ? item.sessions / item.quota : 0,
      remaining: Math.max(0, item.quota - item.sessions),
      quotaConfigured: true,
    })),
    doctorsOnRoster: doctors.length,
    managers: [],
    alerts: [],
  };
}

export function createManagerSeedAppointments(branchId, regionHint) {
  const dashboard = createManagerSeedDashboard(branchId, regionHint);
  return {
    stats: dashboard.stats.map((item) => ({ ...item })),
    items: [],
  };
}

export function createManagerSeedRequests(branchId, regionHint) {
  const clinic = resolveClinic(branchId, regionHint);
  const doctors = clinic.doctors;
  const patients = clinic.patients || ['Patient One', 'Patient Two', 'Patient Three', 'Patient Four'];
  const today = TODAY();
  const items = [
    {
      id: `req-${clinic.id}-1`,
      appointmentId: `APT-${clinic.id}-2201`,
      patient: patients[0],
      treatment: 'Laser Treatment',
      requestedDate: today,
      requestedTime: '10:00 AM',
      doctor: doctors[0]?.name || 'Assigned Doctor',
      status: 'pending',
    },
    {
      id: `req-${clinic.id}-2`,
      appointmentId: `APT-${clinic.id}-2202`,
      patient: patients[1] || patients[0],
      treatment: 'Hair Treatment',
      requestedDate: today,
      requestedTime: '02:30 PM',
      doctor: doctors[1]?.name || doctors[0]?.name || 'Assigned Doctor',
      status: 'pending',
    },
    {
      id: `req-${clinic.id}-3`,
      appointmentId: `APT-${clinic.id}-2203`,
      patient: patients[2] || patients[0],
      treatment: 'Laser Treatment',
      requestedDate: today,
      requestedTime: '11:00 AM',
      doctor: doctors[0]?.name || 'Assigned Doctor',
      status: 'approved',
    },
    {
      id: `req-${clinic.id}-4`,
      appointmentId: `APT-${clinic.id}-2204`,
      patient: patients[3] || patients[0],
      treatment: 'Hair Treatment',
      requestedDate: today,
      requestedTime: '01:00 PM',
      doctor: doctors[1]?.name || doctors[0]?.name || 'Assigned Doctor',
      status: 'rescheduled',
    },
  ];
  return {
    items,
    counts: { all: items.length, pending: 2, approved: 1, rescheduled: 1, rejected: 0 },
  };
}

/** Instant Treatments tab list — replaced by /api/manager/treatments. */
export function createManagerSeedTreatmentList(branchId, regionHint) {
  const clinic = resolveClinic(branchId, regionHint);
  const currency = clinic.currency || 'AED';
  const prices = {
    SAR: [800, 1200, 350],
    AED: [600, 900, 280],
    OMR: [45, 70, 25],
    USD: [220, 320, 180],
    PKR: [18000, 25000, 6500],
  };
  const list = prices[currency] || prices.AED;
  const categories = [
    'All',
    'Plastic Surgery',
    'Cosmetic Injectables',
    'Laser Treatments',
    'Skincare',
    'Dermatologists',
    'Hair Transplant',
    'Dental Treatments',
    'Weight Loss',
    'Gynecology',
    'Regenerative',
    'Physiotherapist',
    'Home Healthcare',
    'Intimate Surgery',
  ];

  return {
    categories,
    departments: categories.filter((label) => label !== 'All'),
    currency,
    region: clinic.region,
    items: [
      {
        id: 'laser-treatment',
        name: 'Laser Treatment',
        category: 'Laser Treatments',
        department: 'Laser Treatments',
        duration: '45 Minutes',
        durationMin: 45,
        price: list[0],
        currency,
        priceLabel: `${currency} ${Number(list[0]).toLocaleString()}`,
        unit: 'Per Session',
        session: 'Per Session',
        sessions: 12,
        description: 'Targeted laser session for skin rejuvenation.',
        status: 'active',
      },
      {
        id: 'hair-treatment',
        name: 'Hair Treatment',
        category: 'Hair Transplant',
        department: 'Hair Transplant',
        duration: '60 Minutes',
        durationMin: 60,
        price: list[1],
        currency,
        priceLabel: `${currency} ${Number(list[1]).toLocaleString()}`,
        unit: 'Per Session',
        session: 'Per Session',
        sessions: 8,
        description: 'Hair restoration consultation and treatment plan.',
        status: 'active',
      },
      {
        id: 'dermatology-consultation',
        name: 'Dermatology Consultation',
        category: 'Dermatologists',
        department: 'Dermatologists',
        duration: '30 Minutes',
        durationMin: 30,
        price: list[2],
        currency,
        priceLabel: `${currency} ${Number(list[2]).toLocaleString()}`,
        unit: 'Per Session',
        session: 'Per Session',
        sessions: 6,
        description: 'Specialist dermatology review and care plan.',
        status: 'active',
      },
    ],
  };
}
