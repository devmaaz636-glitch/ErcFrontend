/**
 * Normalize appointment / visit payloads for doctor detail screens + PDF.
 * Prefers live item fields; fills only when a value is missing.
 */

function pick(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
}

export function formatAppointmentDate(value) {
  const raw = pick(value);
  if (!raw) return '';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function endTimeFromStart(time = '', minutes = 60) {
  const match = String(time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time || '';
  let hour = Number(match[1]);
  const mins = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const total = hour * 60 + mins + Number(minutes || 60);
  const endHour24 = Math.floor(total / 60) % 24;
  const endMin = total % 60;
  const endPeriod = endHour24 >= 12 ? 'PM' : 'AM';
  let endHour = endHour24 % 12;
  if (endHour === 0) endHour = 12;
  return `${endHour}:${String(endMin).padStart(2, '0')} ${endPeriod}`;
}

function departmentFromTreatment(treatment = '') {
  const text = String(treatment).toLowerCase();
  if (text.includes('hair')) return 'Laser';
  if (text.includes('laser')) return 'Laser';
  if (text.includes('derma')) return 'Dermatology';
  if (text.includes('dental')) return 'Dental';
  if (text.includes('consult')) return 'Consultation';
  return 'General';
}

function normalizePatientId(value) {
  const raw = pick(value);
  if (!raw) return '';
  if (/^(PT|ERC)-/i.test(raw)) return raw;
  const digits = raw.replace(/\D/g, '');
  return digits ? `PT-${digits}` : raw;
}

function normalizeRequestId(value) {
  const raw = pick(value);
  if (!raw) return '';
  if (/^(APT|ERC)-/i.test(raw)) return raw;
  const digits = raw.replace(/\D/g, '');
  return digits ? `APT-${digits}` : raw;
}

function durationLabel(item = {}, treatment = '') {
  if (item.duration) return String(item.duration);
  if (item.durationMinutes) return `${item.durationMinutes} Min`;
  if (String(treatment).toLowerCase().includes('consult')) return '20 Min';
  return '30 Min';
}

function priceLabel(item = {}) {
  if (item.price) return String(item.price);
  if (item.amount != null) {
    const currency = item.currency || 'AED';
    return `${currency} ${item.amount}`;
  }
  return '';
}

function buildPreviousVisits(item = {}, treatment = '', department = '') {
  if (Array.isArray(item.previousVisits) && item.previousVisits.length) {
    return item.previousVisits;
  }
  const duration = durationLabel(item, treatment);
  const meta = `${department || 'Laser'} • ${duration.replace(/Min/i, 'Minutes')}`;
  const sessions = item.sessionsLabel || '6 Session';
  const left = item.sessionsLeftLabel || '2 Session Left';
  return [1, 2, 3].map((index) => ({
    id: `${pick(item.id, 'visit')}-pv-${index}`,
    title: treatment,
    treatment,
    meta,
    department,
    duration,
    price: priceLabel(item),
    sessions,
    left,
  }));
}

/**
 * Merge appointment card + optional visit row + session user into one detail model.
 */
export function buildDoctorAppointmentDetail({
  item = {},
  visit = {},
  user = {},
} = {}) {
  const source = { ...item, ...visit };
  const treatment = pick(visit.title, visit.treatment, item.treatment, 'Treatment');
  const department = pick(
    visit.department,
    item.department,
    departmentFromTreatment(treatment)
  );
  const start = pick(item.requestedTime, item.time, visit.requestedTime, visit.time);
  const durationMinutes = Number(item.durationMinutes || visit.durationMinutes || 60);
  const end = pick(item.endTime, visit.endTime, endTimeFromStart(start, durationMinutes));
  const dateRaw = pick(item.requestedDate, item.date, visit.requestedDate, visit.date);
  const doctorName = pick(item.doctor, visit.doctor, user.name, 'Doctor');
  const branch = pick(
    item.branchName,
    item.clinic,
    item.branch,
    visit.branchName,
    user.branchName,
    'Branch'
  );
  const patientId = normalizePatientId(
    pick(item.patientId, item.appointmentId, item.code, visit.patientId, visit.appointmentId)
  );
  const requestId = normalizeRequestId(
    pick(item.appointmentId, item.code, item.id, visit.appointmentId, visit.id, patientId)
  );
  const duration = durationLabel({ ...item, ...visit }, treatment);
  const price = priceLabel({ ...item, ...visit }) || 'AED 600';

  return {
    title: 'Appointment Details',
    statusLabel: (() => {
      const raw = pick(item.statusLabel, source.status, 'Confirmed').toLowerCase();
      if (raw === 'upcoming' || raw === 'pending' || raw === 'approved') return 'Confirmed';
      if (raw === 'rescheduled' || raw === 'reschedule') return 'Reschedule';
      if (raw === 'completed') return 'Completed';
      if (raw === 'canceled' || raw === 'cancelled') return 'Canceled';
      return pick(item.statusLabel, 'Confirmed');
    })(),
    patient: pick(item.patient, visit.patient, 'Patient'),
    patientId: patientId || 'PT-0000',
    requestId: requestId || 'APT-0000',
    phone: pick(item.phone, visit.phone, '—'),
    ageGender: pick(item.ageGender, visit.ageGender, '—'),
    treatment,
    department,
    duration,
    price,
    doctorName,
    doctorSpecialty: pick(
      item.specialty,
      item.doctorSpecialty,
      visit.specialty,
      user.specialty,
      department === 'Laser' ? 'Laser Specialist' : 'Specialist'
    ),
    dateLabel: formatAppointmentDate(dateRaw) || '—',
    dateRaw,
    time: start || '—',
    timeRange: start ? (end && end !== start ? `${start} - ${end}` : start) : '—',
    branch,
    allergy: pick(item.allergy, visit.allergy, 'Penicillin'),
    medication: pick(item.medication, visit.medication, 'Current Medication'),
    allergies: Array.isArray(item.allergies) ? item.allergies : null,
    medications: Array.isArray(item.medications) ? item.medications : null,
    documentName: pick(item.documentName, `${treatment || 'Appointment'} Details.Pdf`),
    previousVisits: buildPreviousVisits(item, treatment, department),
    // Keep originals for navigation / PDF naming
    raw: source,
  };
}
