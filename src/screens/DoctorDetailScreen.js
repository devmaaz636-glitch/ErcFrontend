import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from '../components/AppText';
import { IconCircleButton, PrimaryButton, StatusBadge } from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { useSession } from '../context/SessionContext';
import {
  deleteManagerDoctor,
  fetchClinicDoctor,
  fetchManagerDoctor,
} from '../lib/clinic';
import { doctorPhotoSource } from '../lib/doctorMedia';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

// First value that is not null / undefined / empty string
function pick(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return undefined;
}

// Merge newer data over older data without letting empty values wipe good ones
function mergeDoctor(prev, next) {
  const out = { ...(prev || {}) };
  Object.keys(next || {}).forEach((key) => {
    const value = next[key];
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value) && value.length === 0 && Array.isArray(out[key]) && out[key].length) return;
    out[key] = value;
  });
  return out;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function normalizeTreatments(doctor, extraTreatment) {
  const raw = [
    ...(Array.isArray(doctor?.treatments) ? doctor.treatments : []),
    ...(Array.isArray(doctor?.treatmentList) ? doctor.treatmentList : []),
    ...(Array.isArray(doctor?.treatmentNames) ? doctor.treatmentNames : []),
    ...(Array.isArray(doctor?.services) ? doctor.services : []),
  ];
  if (extraTreatment) raw.push(extraTreatment);

  const seen = new Set();
  const list = [];
  raw.forEach((entry, index) => {
    const name =
      typeof entry === 'string' ? entry : pick(entry?.name, entry?.title, entry?.treatment);
    if (!name) return;
    const key = String(name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push({
      id: String(pick(entry?.id, entry?._id) ?? `t-${index}`),
      name: String(name),
      sub:
        typeof entry === 'string'
          ? ''
          : pick(entry?.departmentLabel, entry?.department, entry?.category, '') || '',
    });
  });
  return list;
}

function InfoCell({ icon, label, value }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Ionicons name={icon} size={s(14)} color={colors.brand} />
      <Text style={{ color: colors.desc, fontSize: fs(8, 7), marginTop: 4 }}>{label}</Text>
      <Text
        style={{ color: colors.ink, fontSize: fs(8, 7), marginTop: 2, textAlign: 'center' }}
        numberOfLines={2}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

export default function DoctorDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const topPad = useTopPadding(24);
  const { refresh } = useClinicData();
  const { user } = useSession();
  const isManager =
    user?.role === 'clinic_manager' ||
    user?.role === 'clinicmanager' ||
    user?.role === 'manager';
  const sourceTreatment = route.params?.treatment || null;
  const [doctor, setDoctor] = useState(route.params?.doctor || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [uploaded, setUploaded] = useState(Boolean(route.params?.showUploadSuccess));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Keep local state in sync when navigating to a different doctor from Treatment Detail
  useEffect(() => {
    if (route.params?.doctor) {
      setDoctor((prev) => {
        if (prev?.id && route.params.doctor?.id && String(prev.id) === String(route.params.doctor.id)) {
          return mergeDoctor(prev, route.params.doctor);
        }
        return route.params.doctor;
      });
      setError('');
    }
  }, [route.params?.doctor, route.params?.doctorId]);

  useEffect(() => {
    const id = route.params?.doctorId;
    if (!id) return undefined;
    let active = true;

    const primary = isManager ? fetchManagerDoctor : fetchClinicDoctor;
    const secondary = isManager ? fetchClinicDoctor : null;

    primary(id)
      .catch((err) => {
        if (secondary) return secondary(id);
        throw err;
      })
      .then((item) => {
        if (active && item) setDoctor((prev) => mergeDoctor(prev, item));
      })
      .catch((err) => {
        if (active && !route.params?.doctor) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [route.params?.doctorId, isManager]);

  const treatments = useMemo(
    () => normalizeTreatments(doctor, sourceTreatment),
    [doctor, sourceTreatment],
  );

  async function confirmDelete() {
    if (!isManager) return;
    setBusy(true);
    setError('');
    try {
      await deleteManagerDoctor(doctor.id);
      await refresh({ force: true });
      setConfirmOpen(false);
      setDeleted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!doctor) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: error ? colors.danger : colors.desc }}>
          {error || 'Loading doctor…'}
        </Text>
      </View>
    );
  }

  const assignedBranch =
    pick(
      doctor.branchName,
      doctor.branch,
      typeof doctor.clinic === 'string' ? doctor.clinic : undefined,
      doctor.clinic?.name,
      doctor.clinic?.city,
    ) || '—';

  const photoSource = doctorPhotoSource(doctor, { preferTreatmentAsset: true });

  const joinedDate = formatDate(
    pick(doctor.joinedAt, doctor.joiningDate, doctor.joinDate, doctor.createdAt, doctor.date),
  );

  const phone = pick(doctor.contact?.phone, doctor.phone, doctor.mobile);
  const email = pick(doctor.contact?.email, doctor.email);
  const specialty = pick(doctor.specialty, doctor.specialtyLabel);
  const workingDays = Array.isArray(doctor.workingDays) ? doctor.workingDays : [];
  const todayAppointments = Array.isArray(doctor.todayAppointments) ? doctor.todayAppointments : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: s(40),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconCircleButton
            name="chevron-back"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
          />
          <View style={{ flex: 1, marginLeft: s(12) }}>
            <Text style={{ color: colors.ink, fontSize: fs(14), fontWeight: '600' }}>
              Doctor Detail
            </Text>
          </View>
          {isManager ? (
            <IconCircleButton
              name="ellipsis-vertical"
              color={colors.brand}
              accessibilityLabel="More options"
              onPress={() => setMenuOpen((value) => !value)}
            />
          ) : (
            <View style={{ width: s(36) }} />
          )}
        </View>

        {menuOpen && isManager ? (
          <View
            style={{
              position: 'absolute',
              right: spacing.screen,
              top: topPad + s(34),
              zIndex: 2,
              backgroundColor: colors.card,
              borderRadius: s(5),
              width: s(100),
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('DoctorForm', { mode: 'edit', doctor });
              }}
              style={{ padding: s(10) }}
            >
              <Text style={{ color: colors.ink, fontSize: fs(9) }}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
              style={{ padding: s(10) }}
            >
              <Text style={{ color: colors.danger, fontSize: fs(9) }}>Delete</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Profile card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: s(8),
            padding: s(10),
            marginTop: s(20),
          }}
        >
          <Image
            source={photoSource}
            style={{ width: s(64), height: s(72), borderRadius: s(8), backgroundColor: '#E8D5C4' }}
            resizeMode="cover"
          />
          <View style={{ flex: 1, marginLeft: s(10) }}>
            <Text style={{ color: colors.ink, fontSize: fs(11), fontWeight: '700' }}>
              {doctor.name}
            </Text>
            <Text style={{ color: colors.desc, fontSize: fs(9), marginTop: 3 }}>
              {specialty || 'Specialist'}
            </Text>
            <Text style={{ color: colors.desc, fontSize: fs(8), marginTop: 5 }}>
              Doctor ID: {doctor.id}
            </Text>
          </View>
          <StatusBadge status={doctor.status || 'active'} />
        </View>

        {/* Professional information */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: s(8),
            padding: s(12),
            marginTop: s(16),
          }}
        >
          <Text style={{ color: colors.ink, fontSize: fs(10), fontWeight: '600' }}>
            Professional Information
          </Text>
          <View style={{ flexDirection: 'row', marginTop: s(14) }}>
            <InfoCell icon="medkit-outline" label="Specialty" value={specialty} />
            <InfoCell icon="business-outline" label="Assigned Branch" value={assignedBranch} />
            <InfoCell icon="calendar-outline" label="Joined Date" value={joinedDate} />
          </View>
          <View style={{ flexDirection: 'row', marginTop: s(16) }}>
            <InfoCell icon="call-outline" label="Contact" value={phone} />
            <InfoCell icon="mail-outline" label="Email" value={email} />
            <InfoCell
              icon="people-outline"
              label="Consults / Patients"
              value={doctor.consults != null ? String(doctor.consults) : undefined}
            />
          </View>
        </View>

        {/* Treatments provided */}
        <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600', marginTop: s(22) }}>
          Treatments Provided
        </Text>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: s(8),
            padding: s(10),
            marginTop: s(10),
          }}
        >
          {treatments.length ? (
            treatments.map((treatment, index) => (
              <View
                key={treatment.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: s(9),
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: '#F1E7DD',
                }}
              >
                <View
                  style={{
                    width: s(26),
                    height: s(26),
                    borderRadius: s(13),
                    backgroundColor: '#F3E6DA',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: s(10),
                  }}
                >
                  <Ionicons name="sparkles-outline" size={s(13)} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink, fontSize: fs(10), fontWeight: '600' }}>
                    {treatment.name}
                  </Text>
                  {treatment.sub ? (
                    <Text style={{ color: colors.desc, fontSize: fs(8), marginTop: 2 }}>
                      {treatment.sub}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.desc, fontSize: fs(10), textAlign: 'center' }}>
              No treatments assigned yet
            </Text>
          )}
        </View>

        {/* Availability */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: s(22),
          }}
        >
          <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600' }}>
            Availability
          </Text>
          <StatusBadge status={doctor.availability === 'Available' ? 'active' : 'inactive'} />
        </View>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: s(8),
            padding: s(12),
            marginTop: s(10),
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}
        >
          <View style={{ width: '50%', marginBottom: s(14) }}>
            <Text style={{ color: colors.desc, fontSize: fs(8) }}>Next Available Slot</Text>
            <Text style={{ color: colors.ink, fontSize: fs(9), marginTop: 4 }}>
              {doctor.todayHours?.working === false
                ? 'Off today'
                : doctor.schedule?.start || doctor.todayHours?.start || '—'}
            </Text>
          </View>
          <View style={{ width: '50%', marginBottom: s(14) }}>
            <Text style={{ color: colors.desc, fontSize: fs(8) }}>Working Hours Today</Text>
            <Text style={{ color: colors.ink, fontSize: fs(9), marginTop: 4 }}>
              {doctor.todayHours?.working === false
                ? 'Not working today'
                : `${doctor.schedule?.start || doctor.todayHours?.start || '—'}–${
                    doctor.schedule?.end || doctor.todayHours?.end || '—'
                  }`}
            </Text>
          </View>
          <View style={{ width: '50%' }}>
            <Text style={{ color: colors.desc, fontSize: fs(8) }}>Working Days</Text>
            <Text style={{ color: colors.ink, fontSize: fs(9), marginTop: 4 }}>
              {workingDays.length ? `${workingDays.length} days / week` : '—'}
            </Text>
          </View>
        </View>

        {/* Working hours */}
        <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600', marginTop: s(22) }}>
          Working Hours
        </Text>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: s(8),
            padding: s(10),
            marginTop: s(10),
          }}
        >
          {workingDays.length ? (
            workingDays.map((day) => (
              <View
                key={day.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: s(8),
                  borderBottomWidth: 1,
                  borderBottomColor: '#F1E7DD',
                }}
              >
                <Text style={{ flex: 1, color: colors.ink, fontSize: fs(10), fontWeight: '600' }}>
                  {day.label}
                </Text>
                <Text style={{ color: colors.desc, fontSize: fs(10) }}>
                  {day.start} – {day.end}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.desc, fontSize: fs(10), textAlign: 'center' }}>
              No working hours set
            </Text>
          )}
        </View>

        {/* Today's schedule */}
        <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600', marginTop: s(22) }}>
          Today's Schedule
        </Text>
        {todayAppointments.length ? (
          todayAppointments.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.card,
                borderRadius: s(7),
                padding: s(10),
                marginTop: s(10),
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1, marginRight: s(8) }}>
                <Text style={{ color: colors.ink, fontSize: fs(9) }}>{item.treatment}</Text>
                <Text style={{ color: colors.desc, fontSize: fs(8), marginTop: 3 }}>
                  {item.patient} · {item.time}
                </Text>
              </View>
              <StatusBadge status={item.status === 'completed' ? 'completed' : 'booked'} />
            </View>
          ))
        ) : (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: s(7),
              padding: s(12),
              marginTop: s(10),
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.desc, fontSize: fs(10) }}>
              No appointments scheduled today
            </Text>
          </View>
        )}

        {error ? (
          <Text
            style={{
              color: colors.danger,
              fontSize: fs(9),
              marginTop: s(12),
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <Modal
        visible={confirmOpen || deleted || uploaded}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setConfirmOpen(false);
          setUploaded(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.38)',
            justifyContent: 'center',
            paddingHorizontal: s(16),
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: s(8),
              padding: s(16),
              alignItems: 'center',
            }}
          >
            <Pressable
              onPress={() => {
                setConfirmOpen(false);
                setDeleted(false);
                setUploaded(false);
              }}
              style={{ position: 'absolute', right: s(12), top: s(10) }}
            >
              <Ionicons name="close" size={s(16)} color={colors.desc} />
            </Pressable>
            {deleted || uploaded ? (
              <Ionicons name="checkmark-circle" size={s(28)} color={colors.success} />
            ) : (
              <Ionicons name="trash-outline" size={s(25)} color={colors.desc} />
            )}
            <Text style={{ color: colors.brand, fontSize: fs(11), marginTop: s(10) }}>
              {uploaded ? 'Uploaded Successfully' : deleted ? 'Deleted Successfully' : 'Are You Sure ?'}
            </Text>
            <Text style={{ color: colors.desc, fontSize: fs(7), marginTop: 4 }}>
              {uploaded
                ? 'The Doctor Was Uploaded Successfully'
                : deleted
                  ? 'The Doctor was deleted successfully'
                  : 'You Want To Delete Doctor'}
            </Text>
            <PrimaryButton
              label={uploaded || deleted ? 'Back To Doctors' : 'Confirm'}
              loading={busy}
              onPress={
                uploaded
                  ? () => {
                      setUploaded(false);
                      navigation.goBack();
                    }
                  : deleted
                    ? () => {
                        setDeleted(false);
                        navigation.goBack();
                      }
                    : confirmDelete
              }
              style={{ width: '100%', height: s(38), marginTop: s(12) }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}