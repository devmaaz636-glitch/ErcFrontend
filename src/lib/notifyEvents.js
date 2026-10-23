import { publishNotificationEvent } from './notifications';

/**
 * Domain → notification bridge.
 * Fire-and-forget after successful actions (profile, password, bookings).
 * Delivery respects Redis prefs: alerts[type] + channels (inApp / email / push).
 */

const remindedAppointments = new Set();

async function safePublish(payload) {
  try {
    return await publishNotificationEvent(payload);
  } catch {
    return null;
  }
}

function changedFields(before = {}, after = {}) {
  const fields = [];
  if ((before.name || '') !== (after.name || '')) fields.push('name');
  if ((before.email || '') !== (after.email || '')) fields.push('email');
  if ((before.region || '') !== (after.region || '')) fields.push('region');
  if ((before.photoUrl || null) !== (after.photoUrl || null)) fields.push('photo');
  return fields;
}

/** After Edit Profile save (name / email / region / photo). */
export async function notifyProfileUpdated(before, after) {
  const fields = changedFields(before, after);
  if (!fields.length) return null;

  const label = fields
    .map((f) => {
      if (f === 'photo') return 'profile photo';
      return f;
    })
    .join(', ');

  return safePublish({
    type: 'profileChanges',
    title: 'Profile updated',
    body: `Your ${label} ${fields.length === 1 ? 'was' : 'were'} updated successfully.`,
    meta: { fields },
  });
}

/** After password change / reset confirm. */
export async function notifyPasswordChanged({ fromSecurity } = {}) {
  return safePublish({
    type: 'passwordChanges',
    title: 'Password changed',
    body: fromSecurity
      ? 'Your account password was changed from Security & Privacy.'
      : 'Your account password was reset successfully. If this was not you, contact support.',
    meta: { fromSecurity: Boolean(fromSecurity) },
  });
}

/** Appointment / booking activity (upcoming reminder, status, etc.). */
export async function notifyBookingUpdate({
  code,
  title,
  status,
  clinic,
  onceKey,
} = {}) {
  const key = onceKey || code || title;
  if (key) {
    if (remindedAppointments.has(key)) return null;
    remindedAppointments.add(key);
  }

  const statusLabel = status ? String(status) : 'updated';
  return safePublish({
    type: 'bookingUpdates',
    title: title ? `Booking: ${title}` : 'Booking update',
    body: [
      code ? `${code}` : null,
      clinic ? clinic : null,
      `Status: ${statusLabel}`,
    ]
      .filter(Boolean)
      .join(' · '),
    meta: { code, status, clinic },
  });
}
