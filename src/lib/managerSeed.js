/**
 * Instant clinic-manager home seed — paints ManagerTabs immediately after Get Started.
 * Scoped by branchId so every region / newly assigned manager gets a full home,
 * then live /api/manager/* responses replace this as soon as they arrive.
 */

const PERIOD = () => new Date().toISOString().slice(0, 7);
const TODAY = () => new Date().toISOString().slice(0, 10);

/** Mirrors backend CATEGORY_DOCTOR_PROFILES — 2 doctors per treatment category. */
const CATEGORY_DOCTOR_PROFILES = [
  { category: 'Plastic Surgery', specialty: 'Plastic Surgeon', names: ['Dr. Omar Rashid', 'Dr. Hana Farouk'] },
  { category: 'Cosmetic Injectables', specialty: 'Injectables Specialist', names: ['Dr. Maya Quinn', 'Dr. Felix Navarro'] },
  { category: 'Laser Treatments', specialty: 'Laser Specialist', names: ['Dr. Nora Ahmed', 'Dr. Adam Keller'] },
  { category: 'Skincare', specialty: 'Skincare Specialist', names: ['Dr. Lina Costa', 'Dr. Priya Shah'] },
  { category: 'Dermatologists', specialty: 'Dermatologist', names: ['Dr. Layla Hassan', 'Dr. Ali Khan'] },
  { category: 'Hair Transplant', specialty: 'Hair Specialist', names: ['Dr. Yusuf Alharbi', 'Dr. Sarah Malik'] },
  { category: 'Dental Treatments', specialty: 'Dentist', names: ['Dr. Hassan Reza', 'Dr. Elena Rossi'] },
  { category: 'Weight Loss', specialty: 'Weight Loss Specialist', names: ['Dr. Samir Nabil', 'Dr. Claire Bennett'] },
  { category: 'Gynecology', specialty: 'Gynecologist', names: ['Dr. Amira Saleh', 'Dr. Nadine Brooks'] },
  { category: 'Regenerative', specialty: 'Regenerative Specialist', names: ['Dr. Victor Lang', 'Dr. Iman Qureshi'] },
  { category: 'Physiotherapist', specialty: 'Physiotherapist', names: ['Dr. Tom Hughes', 'Dr. Sofia Mendes'] },
  { category: 'Home Healthcare', specialty: 'Home Care Specialist', names: ['Dr. Grace Miller', 'Dr. Ravi Patel'] },
  { category: 'Intimate Surgery', specialty: 'Intimate Surgery Specialist', names: ['Dr. Camille Dubois', 'Dr. Julian Hart'] },
];

function categorySlug(category) {
  return String(category || 'general')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildCategoryDoctors(branchId) {
  const prefix = String(branchId || 'br-new').replace(/^br-/, '');
  const list = [];
  CATEGORY_DOCTOR_PROFILES.forEach((profile) => {
    profile.names.forEach((name, index) => {
      list.push({
        id: `doc-${prefix}-${categorySlug(profile.category)}-${index + 1}`,
        name,
        specialty: profile.specialty,
        specialtyCategory: profile.category,
        photoKey: 'treatmentdoctor',
        imageKey: 'treatmentdoctor',
        consults: 24 + index * 7,
        score: 86 + index * 3,
        status: 'active',
        availability: 'Available',
      });
    });
  });
  return list;
}

export const MANAGER_CLINIC_CATALOG = {
  'br-riyadh': {
    id: 'br-riyadh',
    name: 'Riyadh Royal Clinic',
    city: 'Riyadh',
    region: 'KSA',
    address: 'King Fahd Rd',
    currency: 'SAR',
    doctors: buildCategoryDoctors('br-riyadh'),
    patients: ['Amina Al Saud', 'Hassan Almutairi', 'Sara Alqahtani', 'Omar Fahad', 'Lina Alharbi'],
  },
  'br-dubai': {
    id: 'br-dubai',
    name: 'Dubai Enfield Royal Clinic',
    city: 'Dubai',
    region: 'UAE',
    address: 'Sheikh Zayed Rd',
    currency: 'AED',
    doctors: buildCategoryDoctors('br-dubai'),
    patients: ['Maaz', 'Sara Ali', 'Omar Khan', 'Layla Hassan', 'Noor Ahmed'],
  },
  'br-muscat': {
    id: 'br-muscat',
    name: 'Muscat Royal Clinic',
    city: 'Muscat',
    region: 'Oman',
    address: 'Qurum',
    currency: 'OMR',
    doctors: buildCategoryDoctors('br-muscat'),
    patients: ['Fatima Al Lawati', 'Said Al Busaidi', 'Maryam Al Hinai'],
  },
  'br-nyc': {
    id: 'br-nyc',
    name: 'New York Royal Clinic',
    city: 'New York',
    region: 'USA',
    address: '5th Avenue',
    currency: 'USD',
    doctors: buildCategoryDoctors('br-nyc'),
    patients: ['Sophia Martinez', 'Daniel Reed', 'Emma Collins'],
  },
  'br-lahore': {
    id: 'br-lahore',
    name: 'Lahore Royal Clinic',
    city: 'Lahore',
    region: 'Pakistan',
    address: 'MM Alam Rd',
    currency: 'PKR',
    doctors: buildCategoryDoctors('br-lahore'),
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
    doctors: buildCategoryDoctors(slug),
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
    photoKey: doctor.photoKey || 'treatmentdoctor',
    imageKey: doctor.imageKey || 'treatmentdoctor',
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

function doctorsForSeedCategory(clinic, category) {
  const matched = (clinic.doctors || []).filter(
    (doctor) =>
      String(doctor.specialtyCategory || '').toLowerCase() === String(category || '').toLowerCase()
  );
  return matched.map((doctor) => ({
    ...doctor,
    specialtyLabel: doctor.specialty,
    photoKey: doctor.photoKey || 'treatmentdoctor',
    imageKey: doctor.imageKey || 'treatmentdoctor',
  }));
}

/** Instant Treatments tab list — replaced by /api/manager/treatments. */
export function createManagerSeedTreatmentList(branchId, regionHint) {
  const clinic = resolveClinic(branchId, regionHint);
  const currency = clinic.currency || 'AED';
  const priceMap = {
    SAR: 800,
    AED: 600,
    OMR: 45,
    USD: 220,
    PKR: 18000,
  };
  const base = priceMap[currency] || priceMap.AED;
  const categories = [
    'All',
    ...CATEGORY_DOCTOR_PROFILES.map((profile) => profile.category),
  ];

  const catalog = [
    { id: 'tx-laser-hair', name: 'Laser Hair Removal', category: 'Laser Treatments', durationMin: 30, factor: 1 },
    { id: 'tx-laser-skin', name: 'Laser Skin Resurfacing', category: 'Laser Treatments', durationMin: 45, factor: 1.4 },
    { id: 'tx-laser-pigment', name: 'Pigmentation Laser', category: 'Laser Treatments', durationMin: 40, factor: 1.2 },
    { id: 'tx-botox', name: 'Botox Session', category: 'Cosmetic Injectables', durationMin: 25, factor: 1.6 },
    { id: 'tx-filler', name: 'Dermal Fillers', category: 'Cosmetic Injectables', durationMin: 35, factor: 2 },
    { id: 'tx-rhino', name: 'Rhinoplasty Consult', category: 'Plastic Surgery', durationMin: 60, factor: 2.4 },
    { id: 'tx-lipo', name: 'Liposuction Review', category: 'Plastic Surgery', durationMin: 50, factor: 2.8 },
    { id: 'tx-facial', name: 'Hydra Facial', category: 'Skincare', durationMin: 40, factor: 0.7 },
    { id: 'tx-peel', name: 'Chemical Peel', category: 'Skincare', durationMin: 30, factor: 0.55 },
    { id: 'tx-derm-consult', name: 'Dermatology Consultation', category: 'Dermatologists', durationMin: 30, factor: 0.8 },
    { id: 'tx-acne', name: 'Acne Treatment Plan', category: 'Dermatologists', durationMin: 35, factor: 0.9 },
    { id: 'tx-hair-fuse', name: 'Hair Transplant Session', category: 'Hair Transplant', durationMin: 120, factor: 6 },
    { id: 'tx-prp-hair', name: 'PRP Hair Therapy', category: 'Hair Transplant', durationMin: 45, factor: 1.5 },
    { id: 'tx-dental-clean', name: 'Dental Cleaning', category: 'Dental Treatments', durationMin: 40, factor: 0.6 },
    { id: 'tx-whitening', name: 'Teeth Whitening', category: 'Dental Treatments', durationMin: 50, factor: 1 },
    { id: 'tx-weight', name: 'Weight Loss Program', category: 'Weight Loss', durationMin: 45, factor: 1.1 },
    { id: 'tx-gyn', name: 'Gynecology Consult', category: 'Gynecology', durationMin: 30, factor: 0.85 },
    { id: 'tx-stem', name: 'Stem Cell Therapy', category: 'Regenerative', durationMin: 60, factor: 3.5 },
    { id: 'tx-physio', name: 'Physiotherapy Session', category: 'Physiotherapist', durationMin: 45, factor: 0.5 },
    { id: 'tx-home', name: 'Home Care Visit', category: 'Home Healthcare', durationMin: 60, factor: 0.65 },
    { id: 'tx-intimate', name: 'Intimate Surgery Consult', category: 'Intimate Surgery', durationMin: 40, factor: 2 },
  ];

  return {
    categories,
    departments: categories.filter((label) => label !== 'All'),
    currency,
    region: clinic.region,
    items: catalog.map((row) => {
      const price = Math.round(base * row.factor);
      const doctors = doctorsForSeedCategory(clinic, row.category);
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        department: row.category,
        departmentLabel: row.category.split(/\s+/)[0],
        duration: `${row.durationMin} Minutes`,
        durationMin: row.durationMin,
        durationLabel: `${row.durationMin} min`,
        price,
        currency,
        priceLabel: `${currency} ${Number(price).toLocaleString()}`,
        unit: 'Per Session',
        session: 'Per Session',
        sessions: 12,
        description: `${row.name} with assigned ${row.category} specialists.`,
        status: 'active',
        doctorIds: doctors.map((doctor) => doctor.id),
        doctors,
      };
    }),
  };
}
