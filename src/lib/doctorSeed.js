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
