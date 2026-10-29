import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from '../components/AppText';
import { IconCircleButton, PrimaryButton } from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { createManagerDoctor, updateManagerDoctor } from '../lib/clinic';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

function Field({ label, value, onChangeText, placeholder, keyboardType, editable = true }) {
  return (
    <View style={{ marginTop: s(14) }}>
      <Text style={{ color: colors.ink, fontSize: fs(9), fontWeight: '500' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType={keyboardType}
        editable={editable}
        style={{
          backgroundColor: colors.card,
          borderRadius: s(7),
          height: s(40),
          paddingHorizontal: s(10),
          marginTop: s(6),
          color: editable ? colors.ink : colors.muted,
          fontSize: fs(9),
        }}
      />
    </View>
  );
}

export default function DoctorFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { dashboard, refresh } = useClinicData();
  const existing = route.params?.doctor;
  const editing = route.params?.mode === 'edit';
  const clinicName = dashboard?.clinic?.city || dashboard?.clinic?.name || 'Assigned clinic';
  const [name, setName] = useState(existing?.name || '');
  const [specialty, setSpecialty] = useState(existing?.specialty || '');
  const [availability, setAvailability] = useState(existing?.availability || 'Available');
  const [phone, setPhone] = useState(existing?.contact?.phone || '');
  const [photo, setPhoto] = useState(existing?.photo || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const topPad = useTopPadding(24);

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
    if (!name.trim() || !specialty.trim() || !availability.trim() || !phone.trim()) {
      setError('Please complete all doctor details.');
      return;
    }
    setBusy(true);
    setError('');
    const body = {
      name: name.trim(),
      specialty: specialty.trim(),
      photo: photo || null,
      contact: { phone: phone.trim(), email: existing?.contact?.email || '' },
      schedule: existing?.schedule || { start: '09:00 AM', end: '05:00 PM' },
      availability: availability.trim(),
      status: 'active',
    };
    try {
      const saved = editing
        ? await updateManagerDoctor(existing.id, body)
        : await createManagerDoctor(body);
      await refresh({ force: true });
      if (editing) {
        navigation.replace('DoctorDetail', { doctorId: saved.id, doctor: saved });
      } else {
        navigation.replace('DoctorDetail', {
          doctorId: saved.id,
          doctor: saved,
          showUploadSuccess: true,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: s(28),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconCircleButton name="chevron-back" accessibilityLabel="Go back" onPress={() => navigation.goBack()} />
          <Text style={{ flex: 1, marginLeft: s(12), color: colors.ink, fontSize: fs(14), fontWeight: '600' }}>
            {editing ? 'Edit Doctor' : 'Add New Doctor'}
          </Text>
          <IconCircleButton name="ellipsis-vertical" color={colors.brand} accessibilityLabel="More options" />
        </View>

        <Field label="Doctor Name" value={name} onChangeText={setName} placeholder="Enter here" />
        <Field label="Doctor Department" value={specialty} onChangeText={setSpecialty} placeholder="Enter here" />

        <Text style={{ color: colors.ink, fontSize: fs(9), marginTop: s(14) }}>Doctor Image</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select doctor image"
          onPress={pickPhoto}
          style={{
            height: s(132),
            borderRadius: s(8),
            backgroundColor: photo ? colors.card : '#EEEEEE',
            marginTop: s(6),
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="image-outline" size={s(36)} color="#A9A9A9" />
              <Ionicons name="add" size={s(18)} color="#A9A9A9" style={{ position: 'absolute' }} />
            </>
          )}
        </Pressable>

        <Field label="Doctor Availability" value={availability} onChangeText={setAvailability} placeholder="Enter here" />
        <Field label="Contact" value={phone} onChangeText={setPhone} placeholder="Enter here" keyboardType="phone-pad" />
        <Field label="Branch Name" value={clinicName} onChangeText={() => {}} placeholder="Assigned clinic" editable={false} />

        {error ? <Text style={{ color: colors.danger, fontSize: fs(9), textAlign: 'center', marginTop: s(12) }}>{error}</Text> : null}
        <PrimaryButton label="Save" loading={busy} onPress={save} style={{ height: s(34), marginTop: s(18) }} />
        <Pressable onPress={() => navigation.goBack()} style={{ height: s(34), borderRadius: s(18), backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginTop: s(10) }}>
          <Text style={{ color: colors.desc, fontSize: fs(9) }}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
