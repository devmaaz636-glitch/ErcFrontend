import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from '../components/AppText';
import { IconCircleButton, PrimaryButton, StatusBadge } from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { deleteManagerDoctor, fetchManagerDoctor } from '../lib/clinic';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const doctorImage = require('../../assets/doctor.png');

function InfoCell({ icon, label, value }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Ionicons name={icon} size={s(14)} color={colors.brand} />
      <Text style={{ color: colors.desc, fontSize: fs(8, 7), marginTop: 4 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: fs(8, 7), marginTop: 2, textAlign: 'center' }} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

export default function DoctorDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const topPad = useTopPadding(24);
  const { refresh } = useClinicData();
  const [doctor, setDoctor] = useState(route.params?.doctor || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [uploaded, setUploaded] = useState(Boolean(route.params?.showUploadSuccess));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!route.params?.doctorId) return undefined;
    fetchManagerDoctor(route.params.doctorId).then(setDoctor).catch((err) => setError(err.message));
    return undefined;
  }, [route.params?.doctorId]);

  async function confirmDelete() {
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
    return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.danger }}>{error || 'Doctor not found.'}</Text></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: spacing.screen, paddingBottom: s(40) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconCircleButton name="chevron-back" accessibilityLabel="Go back" onPress={() => navigation.goBack()} />
          <View style={{ flex: 1, marginLeft: s(12) }}>
            <Text style={{ color: colors.ink, fontSize: fs(14), fontWeight: '600' }}>Doctor Detail</Text>
            <Text style={{ color: colors.desc, fontSize: fs(8), marginTop: 1 }}>Doctor Detail</Text>
          </View>
          <IconCircleButton name="ellipsis-vertical" color={colors.brand} accessibilityLabel="More options" onPress={() => setMenuOpen((value) => !value)} />
        </View>

        {menuOpen ? (
          <View style={{ position: 'absolute', right: spacing.screen, top: topPad + s(34), zIndex: 2, backgroundColor: colors.card, borderRadius: s(5), width: s(100), shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 }}>
            <Pressable onPress={() => { setMenuOpen(false); navigation.navigate('DoctorForm', { mode: 'edit', doctor }); }} style={{ padding: s(10) }}><Text style={{ color: colors.ink, fontSize: fs(9) }}>Edit</Text></Pressable>
            <Pressable onPress={() => { setMenuOpen(false); setConfirmOpen(true); }} style={{ padding: s(10) }}><Text style={{ color: colors.danger, fontSize: fs(9) }}>Delete</Text></Pressable>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: s(8), padding: s(8), marginTop: s(16) }}>
          <Image source={doctor.photo ? { uri: doctor.photo } : doctorImage} style={{ width: s(52), height: s(58), borderRadius: s(6) }} />
          <View style={{ flex: 1, marginLeft: s(8) }}>
            <Text style={{ color: colors.ink, fontSize: fs(9), fontWeight: '600' }}>{doctor.name}</Text>
            <Text style={{ color: colors.desc, fontSize: fs(8), marginTop: 3 }}>{doctor.specialty}</Text>
            <Text style={{ color: colors.desc, fontSize: fs(7), marginTop: 5 }}>Doctor ID: {doctor.id}</Text>
          </View>
          <StatusBadge status={doctor.status || 'active'} />
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: s(8), padding: s(10), marginTop: s(12) }}>
          <Text style={{ color: colors.ink, fontSize: fs(9), fontWeight: '600' }}>Professional Information</Text>
          <View style={{ flexDirection: 'row', marginTop: s(12) }}>
            <InfoCell icon="medkit-outline" label="Specialty" value={doctor.specialty} />
            <InfoCell icon="business-outline" label="Assigned Branch" value={doctor.clinic?.city || doctor.clinic?.name} />
            <InfoCell icon="call-outline" label="Contact" value={doctor.contact?.phone} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s(18) }}>
          <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600' }}>Availability</Text>
          <StatusBadge status={doctor.availability === 'Available' ? 'active' : 'inactive'} />
        </View>
        <View style={{ backgroundColor: colors.card, borderRadius: s(8), padding: s(10), marginTop: s(10), flexDirection: 'row', flexWrap: 'wrap' }}>
          <View style={{ width: '50%', marginBottom: s(12) }}><Text style={{ color: colors.desc, fontSize: fs(8) }}>Next Available Slot</Text><Text style={{ color: colors.ink, fontSize: fs(8), marginTop: 4 }}>{doctor.schedule?.start || '—'}</Text></View>
          <View style={{ width: '50%', marginBottom: s(12) }}><Text style={{ color: colors.desc, fontSize: fs(8) }}>Remaining Slots</Text><Text style={{ color: colors.ink, fontSize: fs(8), marginTop: 4 }}>{doctor.consults ? `${doctor.consults} Slots` : '—'}</Text></View>
          <View style={{ width: '50%' }}><Text style={{ color: colors.desc, fontSize: fs(8) }}>Working Hours Today</Text><Text style={{ color: colors.ink, fontSize: fs(8), marginTop: 4 }}>{doctor.schedule?.start}–{doctor.schedule?.end}</Text></View>
          <View style={{ width: '50%' }}><Text style={{ color: colors.desc, fontSize: fs(8) }}>Schedule</Text><Text style={{ color: colors.ink, fontSize: fs(8), marginTop: 4 }}>Active hours</Text></View>
        </View>

        <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600', marginTop: s(18) }}>Today's Schedule</Text>
        {['Laser Treatment', 'Laser Treatment', 'Consultation', 'Consultation', 'Consultation'].map((item, index) => (
          <View key={`${item}-${index}`} style={{ backgroundColor: colors.card, borderRadius: s(7), padding: s(10), marginTop: s(10), flexDirection: 'row', justifyContent: 'space-between' }}>
            <View><Text style={{ color: colors.ink, fontSize: fs(9) }}>{item}</Text><Text style={{ color: colors.desc, fontSize: fs(7), marginTop: 3 }}>{doctor.schedule?.start || '09:00 AM'}</Text></View>
            <StatusBadge status="booked" />
          </View>
        ))}
        {error ? <Text style={{ color: colors.danger, fontSize: fs(9), marginTop: s(12), textAlign: 'center' }}>{error}</Text> : null}
      </ScrollView>

      <Modal visible={confirmOpen || deleted || uploaded} transparent animationType="fade" onRequestClose={() => { setConfirmOpen(false); setUploaded(false); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'center', paddingHorizontal: s(16) }}>
          <View style={{ backgroundColor: colors.card, borderRadius: s(8), padding: s(16), alignItems: 'center' }}>
            <Pressable onPress={() => { setConfirmOpen(false); setDeleted(false); setUploaded(false); }} style={{ position: 'absolute', right: s(12), top: s(10) }}><Ionicons name="close" size={s(16)} color={colors.desc} /></Pressable>
            {deleted || uploaded ? <Ionicons name="checkmark-circle" size={s(28)} color={colors.success} /> : <Ionicons name="trash-outline" size={s(25)} color={colors.desc} />}
            <Text style={{ color: colors.brand, fontSize: fs(11), marginTop: s(10) }}>
              {uploaded ? 'Uploaded Successfully' : deleted ? 'Deleted Successfully' : 'Are You Sure ?'}
            </Text>
            <Text style={{ color: colors.desc, fontSize: fs(7), marginTop: 4 }}>
              {uploaded ? 'The Doctor Was Uploaded Successfully' : deleted ? 'The Doctor was deleted successfully' : 'You Want To Delete Doctor'}
            </Text>
            <PrimaryButton
              label={uploaded ? 'Back To Doctors' : deleted ? 'Back To Doctors' : 'Confirm'}
              loading={busy}
              onPress={uploaded ? () => { setUploaded(false); navigation.goBack(); } : deleted ? () => { setDeleted(false); navigation.goBack(); } : confirmDelete}
              style={{ width: '100%', height: s(38), marginTop: s(12) }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
