import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from '../components/AppText';
import SelectScheduleModal, {
  WEEK_DAYS,
  createDefaultWeeklySchedule,
  summarizeWeeklySchedule,
} from '../components/SelectScheduleModal';
import { useClinicData } from '../context/ClinicDataContext';
import { createManagerDoctor, updateManagerDoctor } from '../lib/clinic';
import { useTopPadding } from '../utils/responsive';

/**
 * The mock is 189 units wide. Every size below is measured in those units and
 * scaled to the real screen width, so spacing keeps the same proportions on
 * every device (width is capped so tablets don't blow up).
 */
const W = Math.min(Dimensions.get('window').width, 430);
const u = (n) => PixelRatio.roundToNearestPixel((W / 189) * n);

/** Palette matched to the Add New Doctor mock */
const C = {
  bg: '#FFF8F1',
  white: '#FFFFFF',
  ink: '#2B2420',
  label: '#2B2420',
  placeholder: '#B7AFA7',
  muted: '#8D8680',
  brand: '#BF824F', // exact brand color
  brandLight: '#D3A57A', // gradient start for Save
  imageBg: '#E9E9E9',
  imageIcon: '#8F8F8F',
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
      <Ionicons name={name} size={u(7)} color={color} />
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

  // Days currently enabled, in week order, used to render the live schedule list
  const enabledDays = useMemo(
    () => WEEK_DAYS.filter((day) => weeklySchedule?.[day.key]?.enabled),
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
                <Ionicons name="image-outline" size={u(24)} color={C.imageIcon} />
                <View style={styles.imagePlus}>
                  <Ionicons name="add" size={u(5)} color={C.imageIcon} />
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
            style={({ pressed }) => [styles.scheduleWrap, pressed && { opacity: 0.88 }]}
          >
            <LinearGradient
              colors={[C.brandLight, C.brand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scheduleBtn}
            >
              <Text style={styles.scheduleBtnText}>Select Schedule</Text>
            </LinearGradient>
          </Pressable>
        </View>
        {enabledDays.length ? (
          <View style={styles.scheduleList}>
            {enabledDays.map((day) => (
              <View key={day.key} style={styles.scheduleItem}>
                <Text style={styles.scheduleDay}>{day.label.slice(0, 3)}</Text>
                <Text style={styles.scheduleTime}>
                  {weeklySchedule[day.key].start} – {weeklySchedule[day.key].end}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.spacer} />

        <View style={styles.actions}>
          {/* Save button with gradient */}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={save}
            style={({ pressed }) => [styles.saveWrap, (busy || pressed) && { opacity: 0.9 }]}
          >
            <LinearGradient
              colors={[C.brandLight, C.brand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtn}
            >
              {busy ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Fixed gap between Save and Cancel */}
          <View style={styles.buttonGap} />

          {/* Cancel button: same width and centering as Save */}
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.cancelWrap, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <SelectScheduleModal
        visible={scheduleOpen}
        initialSchedule={weeklySchedule}
        onClose={() => setScheduleOpen(false)}
        onChange={(next) => {
          setWeeklySchedule(next); // live: reflects on this screen as the user selects
          setError('');
        }}
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
  screen: { flex: 1, backgroundColor: C.bg },
  content: { flexGrow: 1, paddingHorizontal: u(12) }, // inputs sit 12 units from each edge

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: u(13) },
  circleBtn: {
    width: u(13),
    height: u(13),
    borderRadius: u(6.5),
    backgroundColor: C.circleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    marginLeft: u(9),
    marginRight: u(8),
    color: C.ink,
    fontSize: u(6.3),
    fontWeight: '500',
  },

  field: { marginTop: u(7) },
  label: { color: C.label, fontSize: u(6.2), fontWeight: '600' },
  input: {
    marginTop: u(3.5),
    height: u(20),
    borderRadius: u(3),
    backgroundColor: C.white,
    paddingHorizontal: u(5),
    paddingVertical: 0,
    color: C.ink,
    fontSize: u(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  imageBox: {
    marginTop: u(3.5),
    height: u(86),
    borderRadius: u(3),
    backgroundColor: C.imageBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imageIconWrap: {
    width: u(26),
    height: u(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlus: {
    position: 'absolute',
    top: u(-1),
    right: u(-1),
    width: u(8),
    height: u(8),
    borderRadius: u(4),
    borderWidth: 1.5,
    borderColor: C.imageIcon,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.imageBg,
  },

  availabilityRow: {
    marginTop: u(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: u(4),
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: u(3),
    paddingHorizontal: u(4),
    paddingVertical: u(2),
    marginRight: u(4),
    marginBottom: u(3),
  },
  scheduleDay: { color: C.brand, fontSize: u(4), fontWeight: '700', marginRight: u(2) },
  scheduleTime: { color: C.ink, fontSize: u(3.8) },
  scheduleWrap: {
    borderRadius: u(3),
    overflow: 'hidden',
  },
  scheduleBtn: {
    backgroundColor: C.brand,
    borderRadius: u(3),
    paddingHorizontal: u(7),
    paddingVertical: u(3.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleBtnText: { color: C.white, fontSize: u(3.4), fontWeight: '600', textAlign: 'center' },

  error: { marginTop: u(4), textAlign: 'center', color: C.danger, fontSize: u(4.5) },
  spacer: { height: u(9) }, // availability row -> Save

  // Save/Cancel are 3 units wider on each side than the inputs (9 vs 12 units from the edge)
  actions: { alignSelf: 'stretch', marginHorizontal: -u(3) },

  saveWrap: {
    alignSelf: 'stretch',
    borderRadius: u(8),
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtn: {
    alignSelf: 'stretch',
    height: u(16),
    borderRadius: u(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: C.white, fontSize: u(5.2), fontWeight: '600', textAlign: 'center' },

  buttonGap: { height: u(6) }, // Save -> Cancel
  cancelWrap: {
    alignSelf: 'stretch',
  },
  cancelBtn: {
    alignSelf: 'stretch',
    height: u(16),
    borderRadius: u(8),
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelText: { color: C.ink, fontSize: u(5), fontWeight: '500', textAlign: 'center' },
});