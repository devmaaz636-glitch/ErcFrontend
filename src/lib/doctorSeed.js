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
      treatment: 'Laser Treatment',
      time: '09:30 AM',
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
      treatment: 'Laser Treatment',
      doctor: name,
      status: 'upcoming',
      requestedDate: '2026-11-06',
      requestedTime: '09:30 AM',
      appointmentId: 'ERC-1024',
      branchName,
    },
    {
      id: 'doc-req-2',
      patient: 'Haseeba',
      treatment: 'Laser Hair Removal',
      doctor: name,
      status: 'approved',
      requestedDate: '2026-11-06',
      requestedTime: '11:00 AM',
      appointmentId: 'ERC-1025',
      branchName,
    },
    {
      id: 'doc-req-3',
      patient: 'Unzila',
      treatment: 'Laser Treatment',
      doctor: name,
      status: 'rescheduled',
      requestedDate: '2026-11-07',
      requestedTime: '02:00 PM',
      appointmentId: 'ERC-1026',
      branchName,
    },
    {
      id: 'doc-req-4',
      patient: 'Mahnoor',
      treatment: 'Follow-up Consultation',
      doctor: name,
      status: 'upcoming',
      requestedDate: '2026-11-08',
      requestedTime: '10:15 AM',
      appointmentId: 'ERC-1027',
      branchName,
    },
    {
      id: 'doc-req-5',
      patient: 'Haseeba',
      treatment: 'Laser Treatment',
      doctor: name,
      status: 'approved',
      requestedDate: '2026-11-09',
      requestedTime: '04:30 PM',
      appointmentId: 'ERC-1028',
      branchName,
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
