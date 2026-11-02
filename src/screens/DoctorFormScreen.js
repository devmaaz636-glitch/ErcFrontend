import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from '../components/AppText';
import SelectScheduleModal, {
  createDefaultWeeklySchedule,
  summarizeWeeklySchedule,
} from '../components/SelectScheduleModal';
import { useClinicData } from '../context/ClinicDataContext';
import { createManagerDoctor, updateManagerDoctor } from '../lib/clinic';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

/** Exact palette from Add New Doctor mock */
const C = {
  bg: '#FFF8F1',
  white: '#FFFFFF',
  ink: '#2B2420',
  label: '#3A322C',
  placeholder: '#B7AFA7',
  muted: '#8D8680',
  brand: '#C8966A',
  imageBg: '#EDEDED',
  imageIcon: '#A9A9A9',
  danger: '#E5484D',
  circleBg: '#FFFFFF',
};

function Field({ label, value, onChangeText, placeholder, keyboardType, editable = true }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        keyboardType={keyboardType}
        editable={editable}
        style={[styles.input, !editable && { color: C.muted }]}
      />
    </View>
  );
}

function CircleBtn({ name, onPress, color = C.ink, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.circleBtn, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={name} size={s(18)} color={color} />
    </Pressable>
  );
}

function firstEnabledSchedule(weekly) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const key of days) {
    if (weekly?.[key]?.enabled) {
      return { start: weekly[key].start, end: weekly[key].end };
    }
  }
  return { start: '09:00 AM', end: '05:00 PM' };
}

export default function DoctorFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { dashboard, refresh } = useClinicData();
  const existing = route.params?.doctor;
  const editing = route.params?.mode === 'edit';
  const clinicName = dashboard?.clinic?.city || dashboard?.clinic?.name || '';

  const [name, setName] = useState(existing?.name || '');
  const [specialty, setSpecialty] = useState(existing?.specialty || '');
  const [phone, setPhone] = useState(existing?.contact?.phone || '');
  const [photo, setPhoto] = useState(existing?.photo || '');
  const [weeklySchedule, setWeeklySchedule] = useState(
    () => existing?.weeklySchedule || createDefaultWeeklySchedule()
  );
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const topPad = useTopPadding(14);
  const insets = useSafeAreaInsets();

  const availabilitySummary = useMemo(
    () => summarizeWeeklySchedule(weeklySchedule),
    [weeklySchedule]
  );

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo permission is required to select a doctor image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]?.uri) setPhoto(result.assets[0].uri);
  }

  async function save() {
    if (!name.trim() || !specialty.trim() || !phone.trim()) {
      setError('Please complete all doctor details.');
      return;
    }
    if (!availabilitySummary) {
      setError('Please select doctor availability.');
      return;
    }
    setBusy(true);
    setError('');
    const hours = firstEnabledSchedule(weeklySchedule);
    const body = {
      name: name.trim(),
      specialty: specialty.trim(),
      photo: photo || null,
      contact: { phone: phone.trim(), email: existing?.contact?.email || '' },
      schedule: hours,
      weeklySchedule,
      availability: 'Available',
      status: 'active',
    };
    try {
      const saved = editing
        ? await updateManagerDoctor(existing.id, body)
        : await createManagerDoctor(body);
      await refresh({ force: true });
      navigation.replace('DoctorDetail', {
        doctorId: saved.id,
        doctor: saved,
        showUploadSuccess: !editing,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Header: back button, left-aligned title, more button on the right */}
        <View style={styles.header}>
          <CircleBtn
            name="chevron-back"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {editing ? 'Edit Doctor' : 'Add New Doctor'}
          </Text>
          <CircleBtn
            name="ellipsis-vertical"
            color={C.brand}
            accessibilityLabel="More options"
          />
        </View>

        <Field label="Doctor Name" value={name} onChangeText={setName} placeholder="Enter here" />
        <Field
          label="Doctor Department"
          value={specialty}
          onChangeText={setSpecialty}
          placeholder="Enter here"
        />

        <View style={styles.field}>
          <Text style={styles.label}>Doctor Image</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select doctor image"
            onPress={pickPhoto}
            style={styles.imageBox}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imageIconWrap}>
                <Ionicons name="image-outline" size={s(40)} color={C.imageIcon} />
                <View style={styles.imagePlus}>
                  <Ionicons name="add" size={s(11)} color={C.imageIcon} />
                </View>
              </View>
            )}
          </Pressable>
        </View>

        <Field
          label="Contact"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter here"
          keyboardType="phone-pad"
        />
        <Field
          label="Branch Name"
          value={clinicName}
          onChangeText={() => {}}
          placeholder="Enter here"
          editable={false}
        />

        {/* Availability: label on the left, button on the right, same line */}
        <View style={styles.availabilityRow}>
          <Text style={styles.label}>Doctor Availability</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select schedule"
            onPress={() => setScheduleOpen(true)}
            style={({ pressed }) => [styles.scheduleBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.scheduleBtnText}>Select Schedule</Text>
          </Pressable>
        </View>
        {availabilitySummary ? (
          <Text style={styles.availabilitySummary} numberOfLines={1}>
            {availabilitySummary}
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.spacer} />

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={save}
          style={({ pressed }) => [styles.saveBtn, (busy || pressed) && { opacity: 0.9 }]}
        >
          {busy ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>

      <SelectScheduleModal
        visible={scheduleOpen}
        initialSchedule={weeklySchedule}
        onClose={() => setScheduleOpen(false)}
        onSave={(next) => {
          setWeeklySchedule(next);
          setScheduleOpen(false);
          setError('');
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: s(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(6),
  },
  circleBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: C.circleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    marginLeft: s(12),
    marginRight: s(10),
    color: C.ink,
    fontSize: fs(15),
    fontWeight: '500',
  },
  field: {
    marginTop: s(14),
  },
  label: {
    color: C.label,
    fontSize: fs(13),
    fontWeight: '600',
  },
  input: {
    marginTop: s(8),
    height: s(40),
    borderRadius: s(8),
    backgroundColor: C.white,
    paddingHorizontal: s(14),
    paddingVertical: 0,
    color: C.ink,
    fontSize: fs(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageBox: {
    marginTop: s(8),
    height: s(150),
    borderRadius: s(8),
    backgroundColor: C.imageBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageIconWrap: {
    width: s(48),
    height: s(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlus: {
    position: 'absolute',
    top: -3,
    right: -8,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.imageIcon,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.imageBg,
  },
  availabilityRow: {
    marginTop: s(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilitySummary: {
    marginTop: s(6),
    fontSize: fs(11),
    color: C.muted,
  },
  scheduleBtn: {
    backgroundColor: C.brand,
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: s(6),
  },
  scheduleBtnText: {
    color: C.white,
    fontSize: fs(10),
    fontWeight: '600',
  },
  error: {
    marginTop: s(12),
    textAlign: 'center',
    color: C.danger,
    fontSize: fs(12),
  },
  // Fixed gap so Save/Cancel sit right under the availability row, as in the mock
  spacer: {
    height: s(20),
  },
  saveBtn: {
    height: s(46),
    borderRadius: s(23),
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: C.white,
    fontSize: fs(14),
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: s(10),
    height: s(46),
    borderRadius: s(23),
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelText: {
    color: C.ink,
    fontSize: fs(13),
    fontWeight: '500',
  },
});