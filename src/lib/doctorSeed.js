/**
 * Instant doctor-home seed — same design for every doctor; role-based data only.
 * Live APIs can replace this later without changing DoctorHomeScreen layout.
 */

const TODAY_LABEL = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

export function createDoctorHomeSeed({
  name = 'Dr Zeeshan Forward',
  branchName = 'Dubai Branch',
  branchId = 'br-dubai',
} = {}) {
  return {
    doctor: {
      name,
      branchName,
      branchId,
      specialty: 'Laser Specialist',
    },
    stats: [
      { id: 'today', icon: 'calendar-outline', value: '42', label: "Today's Appointments" },
      { id: 'upcoming', icon: 'time-outline', value: '08', label: 'Upcoming Appointments' },
      { id: 'pending', icon: 'calendar-number-outline', value: '09', label: 'Pending Appointments' },
      { id: 'canceled', icon: 'person-outline', value: '03', label: "Today's Cancellations" },
    ],
    nextAppointment: {
      id: 'doc-apt-next',
      patient: 'Mahnoor',
      patientId: 'ERC-1024',
      appointmentId: 'ERC-1024',
      treatment: 'Laser Treatment',
      department: 'Laser',
      time: '09:30 AM',
      requestedTime: '09:30 AM',
      requestedDate: '2026-11-06',
      durationMinutes: 30,
      duration: '30 Min',
      price: 'AED 600',
      doctor: name,
      specialty: 'Laser Specialist',
      branchName,
      phone: '03******34',
      ageGender: '28 Years • Female',
      allergy: 'Penicillin',
      medication: 'Current Medication',
      status: 'upcoming',
    },
    todayAppointments: [
      {
        id: 'doc-apt-1',
        patient: 'Mahnoor',
        treatment: 'Laser Treatment',
        time: '09:30 AM',
        status: 'upcoming',
      },
      {
        id: 'doc-apt-2',
        patient: 'Haseeba',
        treatment: 'Laser Treatment',
        time: '09:30 AM',
        status: 'completed',
      },
      {
        id: 'doc-apt-3',
        patient: 'Unzila',
        treatment: 'Laser Treatment',
        time: '09:30 AM',
        status: 'upcoming',
      },
    ],
    todayLabel: TODAY_LABEL(),
    followUp: {
      id: 'doc-follow-1',
      patient: 'Haseeba',
      treatment: 'Laser Hair Removal',
      progressLabel: '3 of 6 sessions completed.',
      status: 'due',
    },
  };
}

/** Appointments-tab seed — same card shape as clinic manager requests. */
export function createDoctorAppointmentsSeed({
  name = 'Dr Zeeshan Forward',
  branchName = 'Dubai Branch',
} = {}) {
  const items = [
    {
      id: 'doc-req-1',
      patient: 'Mahnoor',
      patientId: 'ERC-1024',
      treatment: 'Laser Treatment',
      department: 'Laser',
      doctor: name,
      specialty: 'Laser Specialist',
      status: 'upcoming',
      requestedDate: '2026-11-06',
      requestedTime: '09:30 AM',
      durationMinutes: 30,
      duration: '30 Min',
      price: 'AED 600',
      appointmentId: 'ERC-1024',
      branchName,
      phone: '03******21',
      ageGender: '26 Years • Female',
      allergy: 'Penicillin',
      medication: 'Current Medication',
    },
    {
      id: 'doc-req-2',
      patient: 'Haseeba',
      patientId: 'ERC-1025',
      treatment: 'Laser Hair Removal',
      department: 'Laser',
      doctor: name,
      specialty: 'Laser Specialist',
      status: 'approved',
      requestedDate: '2026-11-06',
      requestedTime: '11:00 AM',
      durationMinutes: 45,
      duration: '45 Min',
      price: 'AED 850',
      appointmentId: 'ERC-1025',
      branchName,
      phone: '03******88',
      ageGender: '29 Years • Female',
      allergy: 'Penicillin',
      medication: 'Current Medication',
    },
    {
      id: 'doc-req-3',
      patient: 'Unzila',
      patientId: 'ERC-1026',
      treatment: 'Laser Treatment',
      department: 'Laser',
      doctor: name,
      specialty: 'Laser Specialist',
      status: 'rescheduled',
      requestedDate: '2026-11-07',
      requestedTime: '02:00 PM',
      durationMinutes: 30,
      duration: '30 Min',
      price: 'AED 600',
      appointmentId: 'ERC-1026',
      branchName,
      phone: '03******45',
      ageGender: '31 Years • Female',
      allergy: 'Penicillin',
      medication: 'Current Medication',
    },
    {
      id: 'doc-req-4',
      patient: 'Mahnoor',
      patientId: 'ERC-1027',
      treatment: 'Follow-up Consultation',
      department: 'Consultation',
      doctor: name,
      specialty: 'Laser Specialist',
      status: 'upcoming',
      requestedDate: '2026-11-08',
      requestedTime: '10:15 AM',
      durationMinutes: 20,
      duration: '20 Min',
      price: 'AED 250',
      appointmentId: 'ERC-1027',
      branchName,
      phone: '03******21',
      ageGender: '26 Years • Female',
      allergy: 'Penicillin',
      medication: 'Current Medication',
    },
    {
      id: 'doc-req-5',
      patient: 'Haseeba',
      patientId: 'ERC-1028',
      treatment: 'Laser Treatment',
      department: 'Laser',
      doctor: name,
      specialty: 'Laser Specialist',
      status: 'approved',
      requestedDate: '2026-11-09',
      requestedTime: '04:30 PM',
      durationMinutes: 30,
      duration: '30 Min',
      price: 'AED 600',
      appointmentId: 'ERC-1028',
      branchName,
      phone: '03******88',
      ageGender: '29 Years • Female',
      allergy: 'Penicillin',
      medication: 'Current Medication',
    },
  ];

  const counts = { all: items.length, upcoming: 0, approved: 0, rescheduled: 0 };
  for (const item of items) {
    const key = item.status === 'pending' ? 'upcoming' : item.status;
    if (counts[key] != null) counts[key] += 1;
  }

  const stats = [
    { id: 'today', icon: 'calendar-outline', value: '42', label: "Today's Appointments", change: 2.1 },
    { id: 'upcoming', icon: 'time-outline', value: String(counts.upcoming).padStart(2, '0'), label: 'Upcoming Appointments', change: 1.4 },
    { id: 'approved', icon: 'checkmark-circle-outline', value: String(counts.approved).padStart(2, '0'), label: 'Approved Appointments', change: 0.8 },
    { id: 'rescheduled', icon: 'calendar-number-outline', value: String(counts.rescheduled).padStart(2, '0'), label: 'Reschedule Requests', change: -0.5 },
  ];

  return { items, counts, stats };
}
