import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';
import { usePatientData } from '../context/PatientDataContext';

const BRAND = '#BF824F';
const TREATMENTS = ['Laser Treatment', 'Hair PRP', 'Dermal Fillers', 'Facelift'];
const DEPARTMENTS = ['Laser', 'Hair', 'Injectables', 'Plastic Surgery'];
const DOCTORS = [
  {
    id: 'dr-ahmed-khan',
    name: 'Dr. Ahmed Khan',
    departments: ['Laser', 'Laser Treatments'],
    specialty: 'Laser Specialist',
    start: '09:00 AM',
    end: '05:00 PM',
    workingDays: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 'dr-sarah-malik',
    name: 'Dr. Sarah Malik',
    departments: ['Laser', 'Laser Treatments'],
    specialty: 'Laser Specialist',
    start: '10:00 AM',
    end: '06:00 PM',
    workingDays: [1, 2, 4, 5, 6],
  },
  {
    id: 'dr-hana-farouk',
    name: 'Dr. Hana Farouk',
    departments: ['Plastic Surgery', 'Facelift'],
    specialty: 'Plastic Surgeon',
    start: '09:30 AM',
    end: '04:30 PM',
    workingDays: [1, 2, 3, 5, 6],
  },
  {
    id: 'dr-maya-quinn',
    name: 'Dr. Maya Quinn',
    departments: ['Injectables', 'Dermal Fillers'],
    specialty: 'Injectables Specialist',
    start: '10:00 AM',
    end: '06:00 PM',
    workingDays: [1, 3, 4, 5, 6],
  },
  {
    id: 'dr-yusuf-alharbi',
    name: 'Dr. Yusuf Alharbi',
    departments: ['Hair', 'Hair PRP'],
    specialty: 'Hair Specialist',
    start: '09:00 AM',
    end: '05:00 PM',
    workingDays: [2, 3, 4, 5, 6],
  },
];

function normalizeDepartment(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('laser')) return 'Laser';
  if (text.includes('hair') || text.includes('prp')) return 'Hair';
  if (text.includes('fill')) return 'Injectables';
  if (text.includes('face') || text.includes('plastic')) return 'Plastic Surgery';
  return String(value || '');
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildCells(year, month) {
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  const mondayFirstOffset = (first.getDay() + 6) % 7;
  const previousCount = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = mondayFirstOffset - 1; i >= 0; i -= 1) {
    cells.push({ day: previousCount - i, muted: true, otherMonth: true, monthDelta: -1 });
  }
  for (let day = 1; day <= count; day += 1) {
    cells.push({ day, muted: false, otherMonth: false, monthDelta: 0 });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay, muted: true, otherMonth: true, monthDelta: 1 });
    nextDay += 1;
  }
  return cells;
}

function formatSelectedDate(value) {
  const [yearValue, monthValue, dayValue] = String(value || '').split('-').map(Number);
  if (!yearValue || !monthValue || !dayValue) return value || '—';
  return new Date(yearValue, monthValue - 1, dayValue).toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function timeToMinutes(value) {
  const match = String(value).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  if (String(match[3]).toUpperCase() === 'PM') hours += 12;
  return hours * 60 + Number(match[2]);
}

function formatTime(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function buildSlots(doctor) {
  if (!doctor) return [];
  const start = timeToMinutes(doctor.start);
  const end = timeToMinutes(doctor.end);
  if (start == null || end == null) return [];
  const slots = [];
  for (let minute = start; minute + 60 <= end; minute += 60) {
    slots.push(`${formatTime(minute)} - ${formatTime(minute + 60)}`);
  }
  return slots;
}

function DetailsField({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }) {
  return (
    <View style={{ marginBottom: s(14) }}>
      <Text allowFontScaling={false} style={{ color: '#171717', fontSize: fs(12), fontWeight: '700', marginBottom: s(8) }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A1A1A1"
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          height: multiline ? s(92) : s(46),
          borderRadius: s(12),
          borderWidth: 1,
          borderColor: '#EFEAE5',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: s(14),
          paddingTop: multiline ? s(12) : 0,
          color: '#171717',
          fontSize: fs(11),
        }}
      />
    </View>
  );
}

function SelectField({ label, value, placeholder, onPress }) {
  return (
    <View style={{ marginBottom: s(16) }}>
      <Text
        allowFontScaling={false}
        style={{ color: '#171717', fontSize: fs(12), fontWeight: '700', marginBottom: s(8) }}
      >
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          height: s(46),
          borderRadius: s(12),
          borderWidth: 1,
          borderColor: '#EFEAE5',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: s(16),
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={{
            flex: 1,
            color: value ? '#171717' : '#A1A1A1',
            fontSize: fs(11),
            fontWeight: value ? '600' : '400',
          }}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={s(16)} color="#A1A1A1" />
      </Pressable>
    </View>
  );
}

function PickerModal({ visible, title, options, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close picker"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(20,20,20,0.32)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: s(22),
            borderTopRightRadius: s(22),
            paddingHorizontal: spacing.screen,
            paddingTop: s(14),
            paddingBottom: s(28),
            maxHeight: '70%',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(10) }}>
            <Text allowFontScaling={false} style={{ flex: 1, color: '#171717', fontSize: fs(16), fontWeight: '700' }}>
              {title}
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={s(20)} color="#777777" />
            </Pressable>
          </View>
          {options.map((option) => {
            const active = selected === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => onSelect(option)}
                style={{
                  height: s(48),
                  borderBottomWidth: 1,
                  borderBottomColor: '#F0ECE8',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ flex: 1, color: active ? BRAND : '#171717', fontSize: fs(12), fontWeight: active ? '700' : '500' }}
                >
                  {option}
                </Text>
                {active ? <Ionicons name="checkmark" size={s(18)} color={BRAND} /> : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function PatientBookAppointmentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useSession();
  const { treatments, doctors, book, fetchAvailability } = usePatientData();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topPad = useTopPadding(20);
  const passedItem = typeof route.params?.treatment === 'object' ? route.params.treatment : null;
  const passedTreatment = passedItem?.title || passedItem?.name || route.params?.treatment || '';
  const passedDepartment = route.params?.department || '';

  const [treatment, setTreatment] = useState(passedTreatment);
  const [department, setDepartment] = useState(passedItem?.department || passedDepartment);
  const domainDoctors = useMemo(() => {
    const normalized = normalizeDepartment(passedDepartment || passedTreatment);
    if (!normalized) return DOCTORS;
    return DOCTORS.filter((item) =>
      item.departments.some((value) => normalizeDepartment(value) === normalizeDepartment(normalized))
    );
  }, [passedDepartment, passedTreatment]);
  const availableDoctors = useMemo(() => {
    const target = normalizeDepartment(department || passedItem?.department || passedTreatment);
    const source = doctors.length ? doctors : domainDoctors;
    return source.filter((item) => normalizeDepartment(item.department) === target);
  }, [department, doctors, domainDoctors, passedItem?.department, passedTreatment]);
  const [doctor, setDoctor] = useState(() => availableDoctors[0] || domainDoctors[0] || null);
  const [treatmentPicker, setTreatmentPicker] = useState(false);
  const [departmentPicker, setDepartmentPicker] = useState(false);
  const [doctorPicker, setDoctorPicker] = useState(false);
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [stage, setStage] = useState('booking');
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [document, setDocument] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildCells(year, month), [year, month]);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    let active = true;
    if (!doctor?.id || !selectedDate) {
      setSlots([]);
      return () => { active = false; };
    }
    fetchAvailability(doctor.id, selectedDate)
      .then((next) => { if (active) { setSlots(next); setSelectedTime(next[0] || ''); } })
      .catch((error) => { if (active) { setSlots([]); setSelectedTime(''); setFormError(error.message); } });
    return () => { active = false; };
  }, [doctor?.id, fetchAvailability, selectedDate]);

  useEffect(() => {
    if (!availableDoctors.length) return;
    if (doctor && availableDoctors.some((item) => item.id === doctor.id)) return;
    setDoctor(availableDoctors[0]);
  }, [availableDoctors, doctor]);

  useEffect(() => {
    if (!doctor) return;
    const [yearValue, monthValue, dayValue] = selectedDate.split('-').map(Number);
    const weekday = new Date(yearValue, monthValue - 1, dayValue).getDay();
    if (doctor.workingDays.includes(weekday)) return;
    for (let day = 1; day <= 31; day += 1) {
      const candidate = new Date(yearValue, monthValue - 1, day);
      if (candidate.getMonth() !== monthValue - 1) break;
      if (doctor.workingDays.includes(candidate.getDay())) {
        setSelectedDate(dateKey(candidate));
        break;
      }
    }
  }, [doctor?.id, selectedDate]);

  function proceed() {
    if (!treatment || !department) {
      setTreatmentPicker(!treatment);
      if (treatment) setDepartmentPicker(true);
      return;
    }
    if (!doctor || !selectedTime) {
      setFormError('Select a doctor and available time slot.');
      return;
    }
    setFormError('');
    setStage('details');
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) setDocument(result.assets?.[0] || null);
  }

  async function confirmAppointment() {
    if (!fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setFormError('Email is required.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Phone number is required.');
      return;
    }
    const selectedTreatment = treatments.find((item) => item.name === treatment || item.title === treatment);
    if (!selectedTreatment || !doctor?.id) {
      setFormError('Please choose an available treatment and doctor.');
      return;
    }
    if (selectedDate < dateKey(new Date())) {
      setFormError('Please choose today or a future date.');
      return;
    }
    setSubmitting(true);
    try {
      const item = await book({
        treatmentId: selectedTreatment.id,
        doctorId: doctor.id,
        date: selectedDate,
        time: selectedTime,
        notes,
        document: document ? { name: document.name, mimeType: document.mimeType } : null,
      });
      setCreatedAppointment(item);
      setFormError('');
      setConfirmed(true);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function finishBooking() {
    setConfirmed(false);
    navigation.reset({ index: 0, routes: [{ name: 'PatientTabs', params: { screen: 'AppointmentsTab' } }] });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F3EF' }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + s(16),
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go back"
              onPress={() => stage === 'details' ? setStage('booking') : navigation.goBack()}
            />
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{ flex: 1, marginLeft: s(12), color: '#171717', fontSize: fs(15), fontWeight: '700' }}
            >
              Book Appointment
            </Text>
            <NotificationBellButton color={BRAND} />
          </View>

          {stage === 'booking' ? (
          <>
          <View style={{ marginTop: s(20) }}>
            <SelectField
              label="Select Treatment"
              value={treatment}
              placeholder="Enter here"
              onPress={() => setTreatmentPicker(true)}
            />
            <SelectField
              label="Select Department"
              value={department}
              placeholder="Enter here"
              onPress={() => setDepartmentPicker(true)}
            />
            <SelectField
              label="Select Doctor"
              value={doctor?.name || ''}
              placeholder="Enter here"
              onPress={() => setDoctorPicker(true)}
            />
          </View>

          <Text allowFontScaling={false} style={{ color: '#171717', fontSize: fs(12), fontWeight: '700', marginBottom: s(8) }}>
            Select Date
          </Text>
          <View
            style={{
              borderRadius: s(12),
              backgroundColor: '#FFFFFF',
              position: 'relative',
              borderWidth: 1,
              borderColor: '#F1ECE7',
              paddingHorizontal: s(12),
              paddingTop: s(10),
              paddingBottom: s(12),
            }}
          >
            <View style={{ height: s(48), flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                hitSlop={8}
                disabled={
                  year < new Date().getFullYear() ||
                  (year === new Date().getFullYear() && month <= new Date().getMonth())
                }
                onPress={() => {
                  const now = new Date();
                  const prev = new Date(year, month - 1, 1);
                  if (
                    prev.getFullYear() < now.getFullYear() ||
                    (prev.getFullYear() === now.getFullYear() && prev.getMonth() < now.getMonth())
                  ) {
                    return;
                  }
                  setCursor(prev);
                }}
                style={{
                  width: s(32),
                  height: s(32),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  marginRight: s(8),
                  opacity:
                    year < new Date().getFullYear() ||
                    (year === new Date().getFullYear() && month <= new Date().getMonth())
                      ? 0.35
                      : 1,
                }}
              >
                <Ionicons name="chevron-back" size={s(15)} color="#777777" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next month"
                hitSlop={8}
                onPress={() => setCursor(new Date(year, month + 1, 1))}
                style={{ width: s(32), height: s(32), alignItems: 'center', justifyContent: 'center', marginRight: s(2) }}
              >
                <Ionicons name="chevron-forward" size={s(15)} color="#777777" />
              </Pressable>
            </View>

            <Text
              allowFontScaling={false}
              style={{
                position: 'absolute',
                left: s(12),
                top: s(22),
                color: '#171717',
                fontSize: fs(20),
                fontWeight: '800',
              }}
            >
              {MONTH_NAMES[month]} {year}
            </Text>

            <View style={{ flexDirection: 'row', marginTop: s(8), marginBottom: s(8) }}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((label) => (
                <Text
                  key={label}
                  allowFontScaling={false}
                  style={{ width: `${100 / 7}%`, textAlign: 'center', color: '#777777', fontSize: fs(9), fontWeight: '700' }}
                >
                  {label}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cells.map((day, index) => {
                const cellMonth = month + day.monthDelta;
                const cellDate = new Date(year, cellMonth, day.day);
                const key = dateKey(cellDate);
                const active = selectedDate === key;
                const weekday = cellDate.getDay();
                const doctorWorking = doctor?.workingDays?.includes(weekday);
                const past = !day.otherMonth && key < dateKey(new Date());
                const disabled = day.muted || !doctorWorking || past;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled }}
                    disabled={disabled}
                    onPress={() => !disabled && setSelectedDate(key)}
                    style={{
                      width: `${100 / 7}%`,
                      height: s(46),
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRightWidth: index % 7 === 6 ? 0 : 1,
                      borderBottomWidth: index >= cells.length - 7 ? 0 : 1,
                      borderColor: '#E5E7EB',
                      backgroundColor: active ? BRAND : day.muted ? '#FFFFFF' : 'transparent',
                      opacity: past && !day.muted ? 0.38 : 1,
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        color: active
                          ? '#FFFFFF'
                          : day.muted || past
                            ? '#B7B7B7'
                            : '#171717',
                        fontSize: fs(12),
                        fontWeight: '500',
                      }}
                    >
                      {day.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text allowFontScaling={false} style={{ marginTop: s(14), color: '#171717', fontSize: fs(12), fontWeight: '700', marginBottom: s(8) }}>
            Select Time
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {slots.map((time, index) => {
              const active = selectedTime === time;
              const slotWidth = width < 360 ? '48.5%' : width < 430 ? '31.5%' : '31.5%';
              return (
                <Pressable
                  key={`${time}-${index}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelectedTime(time)}
                  style={{
                    width: slotWidth,
                    height: s(62),
                    borderRadius: s(12),
                    backgroundColor: active ? BRAND : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: active ? BRAND : '#F1ECE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: s(8),
                    paddingHorizontal: s(4),
                    shadowColor: active ? '#D49A68' : 'transparent',
                    shadowOpacity: active ? 0.12 : 0,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: active ? 2 : 0,
                  }}
                >
                  <Text allowFontScaling={false} style={{ color: active ? '#FFFFFF' : '#777777', fontSize: fs(8), fontWeight: '600', marginBottom: s(2) }}>
                    Mon
                  </Text>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      color: active ? '#FFFFFF' : '#171717',
                      fontSize: width < 360 ? fs(8) : fs(9),
                      lineHeight: fs(12),
                      fontWeight: '700',
                    }}
                  >
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={proceed}
            style={{
              height: s(52),
              borderRadius: 999,
              backgroundColor: '#D79D70',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: s(22),
              marginBottom: s(4),
            }}
          >
            <Text allowFontScaling={false} style={{ color: '#FFFFFF', fontSize: fs(14), fontWeight: '700' }}>
              Proceed
            </Text>
          </Pressable>
          </>
          ) : (
          <View style={{ marginTop: s(20) }}>
            <DetailsField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter here"
            />
            <DetailsField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter here"
              keyboardType="email-address"
            />
            <DetailsField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter here"
              keyboardType="phone-pad"
            />
            <DetailsField
              label="Tell Us About Yourself"
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter here"
              multiline
            />
            <Text allowFontScaling={false} style={{ color: '#171717', fontSize: fs(12), fontWeight: '700', marginBottom: s(8) }}>
              Upload Documents (Optional)
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={pickDocument}
              style={{
                height: s(118),
                borderRadius: s(12),
                borderWidth: 1,
                borderColor: '#EFEAE5',
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="document-text-outline" size={s(34)} color="#8A8A8A" />
              <View
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: s(48),
                  width: s(18),
                  height: s(18),
                  borderRadius: s(9),
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={s(13)} color="#777777" />
              </View>
              <Text allowFontScaling={false} numberOfLines={1} style={{ marginTop: s(6), color: '#777777', fontSize: fs(9) }}>
                {document?.name || 'Upload PDF x45.3'}
              </Text>
            </Pressable>
            {formError ? (
              <Text allowFontScaling={false} style={{ color: colors.danger, fontSize: fs(10), marginTop: s(10), textAlign: 'center' }}>
                {formError}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={confirmAppointment}
              disabled={submitting}
              style={{
                height: s(52),
                borderRadius: 999,
                backgroundColor: '#D79D70',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: s(18),
              }}
            >
              <Text allowFontScaling={false} style={{ color: '#FFFFFF', fontSize: fs(14), fontWeight: '700' }}>
                {submitting ? 'Submitting…' : 'Confirm'}
              </Text>
            </Pressable>
          </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={confirmed} transparent animationType="fade" onRequestClose={() => setConfirmed(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(20,20,20,0.38)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: s(24),
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: s(18),
              backgroundColor: '#FFFFFF',
              paddingBottom: s(16),
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={['#BF824F', '#EFB584']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                minHeight: s(106),
                borderBottomLeftRadius: s(40),
                borderBottomRightRadius: s(40),
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: s(18),
              }}
            >
              <View
                style={{
                  width: s(34),
                  height: s(34),
                  borderRadius: s(17),
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: s(8),
                }}
              >
                <Ionicons name="checkmark" size={s(24)} color="#D99A70" />
              </View>
              <Text allowFontScaling={false} style={{ color: '#FFFFFF', fontSize: fs(14), fontWeight: '700' }}>
                Your Appointment Confirmed
              </Text>
              <Text allowFontScaling={false} style={{ marginTop: s(3), color: '#FFFFFF', fontSize: fs(8) }}>
                The Appointment Has Been Successfully
              </Text>
            </LinearGradient>

            <View style={{ paddingHorizontal: s(18), paddingTop: s(14) }}>
              {[
                ['Treatment', createdAppointment?.treatment || treatment],
                ['Date', createdAppointment?.dateLabel || formatSelectedDate(selectedDate)],
                ['Time', createdAppointment?.time || selectedTime],
                ['Doctor', doctor?.name || '—'],
                ['Branch', user?.branchName || user?.city || 'Selected clinic'],
              ].map(([label, value], index) => (
                <View
                  key={label}
                  style={{
                    minHeight: s(38),
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottomWidth: index === 4 ? 0 : 1,
                    borderBottomColor: '#D6D6D6',
                    borderStyle: 'dashed',
                  }}
                >
                  <Text allowFontScaling={false} style={{ flex: 1, color: '#171717', fontSize: fs(9), fontWeight: '700' }}>
                    {label}
                  </Text>
                  <Text allowFontScaling={false} style={{ color: '#777777', fontSize: fs(9) }}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ paddingHorizontal: s(18), marginTop: s(12) }}>
              <Text allowFontScaling={false} style={{ color: '#171717', fontSize: fs(9), fontWeight: '700', marginBottom: s(4) }}>
                Our Policy
              </Text>
              <Text allowFontScaling={false} style={{ color: '#777777', fontSize: fs(8), lineHeight: fs(12) }}>
                Once The 5-Hour Cancellation Window Has Passed, The Appointment Cannot Be Cancelled Through The App.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={finishBooking}
              style={{
                height: s(44),
                borderRadius: 999,
                backgroundColor: '#D99A70',
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: s(18),
                marginTop: s(14),
              }}
            >
              <Text allowFontScaling={false} style={{ color: '#FFFFFF', fontSize: fs(12), fontWeight: '700' }}>
                View My Appointments
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <PickerModal
        visible={treatmentPicker}
        title="Select Treatment"
        options={treatments.map((item) => item.name)}
        selected={treatment}
        onSelect={(option) => {
          setTreatment(option);
          const next = treatments.find((item) => item.name === option);
          setDepartment(next?.department || '');
          setTreatmentPicker(false);
        }}
        onClose={() => setTreatmentPicker(false)}
      />
      <PickerModal
        visible={departmentPicker}
        title="Select Department"
        options={DEPARTMENTS}
        selected={department}
        onSelect={(option) => {
          setDepartment(option);
          setDepartmentPicker(false);
        }}
        onClose={() => setDepartmentPicker(false)}
      />
      <PickerModal
        visible={doctorPicker}
        title="Select Doctor"
        options={availableDoctors.map((option) => option.name)}
        selected={doctor?.name || ''}
        onSelect={(option) => {
          const next = availableDoctors.find((item) => item.name === option) || null;
          setDoctor(next);
          setDoctorPicker(false);
        }}
        onClose={() => setDoctorPicker(false)}
      />
    </View>
  );
}
