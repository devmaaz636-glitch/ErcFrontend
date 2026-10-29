/**
 * Instant clinic-manager home seed — paints ManagerTabs immediately after Get Started.
 * Live /api/manager/* responses replace this as soon as they arrive.
 */
export function createManagerSeedDashboard() {
  return {
    clinic: {
      id: 'br-riyadh',
      name: 'Riyadh Royal Clinic',
      city: 'Riyadh',
      region: 'KSA',
      address: 'King Fahd Rd',
      status: 'active',
    },
    stats: [
      {
        id: 'today',
        icon: 'calendar-outline',
        value: '31',
        label: "Today's Appointments",
        change: 12.4,
      },
      {
        id: 'upcoming',
        icon: 'time-outline',
        value: '14',
        label: 'Upcoming',
        change: -8.2,
      },
      {
        id: 'completed',
        icon: 'checkmark-circle-outline',
        value: '12',
        label: 'Completed Visits',
        change: -3.2,
      },
      {
        id: 'canceled',
        icon: 'close-circle-outline',
        value: '09',
        label: 'Canceled Bookings',
        change: 10.2,
      },
    ],
    appointments: [],
    appointmentRequests: [
      {
        id: 'req-riyadh-1',
        appointmentId: 'APT-2201',
        patient: 'Amina Al Saud',
        treatment: 'Laser Treatment',
        requestedTime: '10:00 AM',
        doctor: 'Dr. Nora Ahmed',
        status: 'pending',
      },
      {
        id: 'req-riyadh-2',
        appointmentId: 'APT-2202',
        patient: 'Hassan Almutairi',
        treatment: 'Hair Treatment',
        requestedTime: '02:30 PM',
        doctor: 'Dr. Yusuf Alharbi',
        status: 'pending',
      },
      {
        id: 'req-riyadh-3',
        appointmentId: 'APT-2203',
        patient: 'Sara Alqahtani',
        treatment: 'Dermatology Consultation',
        requestedTime: '04:00 PM',
        doctor: 'Dr. Layla Hassan',
        status: 'pending',
      },
    ],
    pendingApprovals: 3,
    doctors: [
      {
        id: 'doc-3',
        name: 'Dr. Nora Ahmed',
        specialty: 'Laser Specialist',
        consults: 36,
        score: 88,
        clinic: 'Riyadh Royal Clinic',
      },
      {
        id: 'doc-3b',
        name: 'Dr. Layla Hassan',
        specialty: 'Dermatologist',
        consults: 41,
        score: 91,
        clinic: 'Riyadh Royal Clinic',
      },
      {
        id: 'doc-3c',
        name: 'Dr. Yusuf Alharbi',
        specialty: 'Hair Specialist',
        consults: 33,
        score: 87,
        clinic: 'Riyadh Royal Clinic',
      },
    ],
    treatments: [
      {
        id: 'laser-treatment',
        name: 'Laser Treatment',
        period: new Date().toISOString().slice(0, 7),
        sessions: 12,
        quota: 124,
        progress: 0.1,
        remaining: 112,
        quotaConfigured: true,
      },
      {
        id: 'hair-treatment',
        name: 'Hair Treatment',
        period: new Date().toISOString().slice(0, 7),
        sessions: 8,
        quota: 100,
        progress: 0.08,
        remaining: 92,
        quotaConfigured: true,
      },
      {
        id: 'dermatology-consultation',
        name: 'Dermatology Consultation',
        period: new Date().toISOString().slice(0, 7),
        sessions: 6,
        quota: 80,
        progress: 0.075,
        remaining: 74,
        quotaConfigured: true,
      },
    ],
    doctorsOnRoster: 3,
    managers: [],
    alerts: [],
  };
}

export function createManagerSeedAppointments() {
  return {
    stats: [
      {
        id: 'today',
        icon: 'calendar-outline',
        value: '31',
        label: "Today's Appointments",
        change: 12.4,
      },
      {
        id: 'upcoming',
        icon: 'time-outline',
        value: '14',
        label: 'Upcoming',
        change: -8.2,
      },
      {
        id: 'completed',
        icon: 'checkmark-circle-outline',
        value: '12',
        label: 'Completed Visits',
        change: -3.2,
      },
      {
        id: 'canceled',
        icon: 'close-circle-outline',
        value: '09',
        label: 'Canceled Bookings',
        change: 10.2,
      },
    ],
    items: [],
  };
}

export function createManagerSeedRequests() {
  return {
    items: [
      {
        id: 'req-riyadh-1',
        appointmentId: 'APT-2201',
        patient: 'Amina Al Saud',
        treatment: 'Laser Treatment',
        requestedDate: new Date().toISOString().slice(0, 10),
        requestedTime: '10:00 AM',
        doctor: 'Dr. Nora Ahmed',
        status: 'pending',
      },
      {
        id: 'req-riyadh-2',
        appointmentId: 'APT-2202',
        patient: 'Hassan Almutairi',
        treatment: 'Hair Treatment',
        requestedDate: new Date().toISOString().slice(0, 10),
        requestedTime: '02:30 PM',
        doctor: 'Dr. Yusuf Alharbi',
        status: 'pending',
      },
      {
        id: 'req-riyadh-4',
        appointmentId: 'APT-2204',
        patient: 'Omar Fahad',
        treatment: 'Laser Treatment',
        requestedDate: new Date().toISOString().slice(0, 10),
        requestedTime: '11:00 AM',
        doctor: 'Dr. Nora Ahmed',
        status: 'approved',
      },
      {
        id: 'req-riyadh-5',
        appointmentId: 'APT-2205',
        patient: 'Lina Alharbi',
        treatment: 'Hair Treatment',
        requestedDate: new Date().toISOString().slice(0, 10),
        requestedTime: '01:00 PM',
        doctor: 'Dr. Yusuf Alharbi',
        status: 'rescheduled',
      },
    ],
    counts: { all: 4, pending: 2, approved: 1, rescheduled: 1, rejected: 0 },
  };
}
