import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { auth } from '../lib/firebase';
import { saveSignedInUser } from '../lib/users';
import { markPatientOnboardingDone, markPatientProfileComplete } from '../lib/patientOnboarding';
import { colors, spacing } from '../theme';
import { fs, scale as s } from '../utils/responsive';

const REGIONS = ['UAE', 'KSA', 'Oman', 'Pakistan', 'USA'];
const GENDERS = ['Female', 'Male', 'Prefer not to say'];

function SelectField({ label, value, placeholder, options, open, onToggle, onSelect }) {
  return (
    <View style={{ marginBottom: s(16) }}>
      <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink, marginBottom: s(8) }}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        onPress={onToggle}
        style={{
          height: s(52),
          borderRadius: s(14),
          backgroundColor: colors.field,
          paddingHorizontal: s(14),
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ flex: 1, fontSize: fs(14), color: value ? colors.ink : colors.placeholder }}>
          {value || placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={s(16)} color={colors.muted} />
      </Pressable>
      {open ? (
        <View
          style={{
            marginTop: s(6),
            borderRadius: s(14),
            backgroundColor: colors.field,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.fieldAlt,
          }}
        >
          {options.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => onSelect(option)}
              style={{
                minHeight: s(44),
                paddingHorizontal: s(14),
                justifyContent: 'center',
                backgroundColor: value === option ? colors.brandSoft : colors.card,
              }}
            >
              <Text style={{ fontSize: fs(13), color: value === option ? colors.brand : colors.ink }}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function CreatePatientProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { updateUser } = useSession();
  const [region, setRegion] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [regionOpen, setRegionOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fullName = String(route.params?.fullName || auth.currentUser?.displayName || '').trim();

  async function onBack() {
    if (regionOpen || genderOpen) {
      setRegionOpen(false);
      setGenderOpen(false);
      return;
    }
    return;
  }

  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access to upload your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) setPhotoUrl(result.assets[0]?.uri || '');
  }

  async function onContinue() {
    if (!region) {
      setError('Select your region.');
      return;
    }
    if (!gender) {
      setError('Select your gender.');
      return;
    }
    if (saving) return;

    setSaving(true);
    setError('');
    const uid = auth.currentUser?.uid || route.params?.uid || null;
    const name = fullName || auth.currentUser?.displayName || '';
    const email = auth.currentUser?.email || route.params?.email || '';

    await updateUser({
      uid,
      name,
      email,
      role: 'patient',
      region,
      gender,
      phone: phone.trim(),
      photoUrl: photoUrl || null,
    }).catch(() => {});

    if (auth.currentUser) {
      await saveSignedInUser(auth.currentUser, {
        name,
        role: 'patient',
        region,
        gender,
        phone: phone.trim(),
        photoUrl: photoUrl || null,
      }).catch(() => {});
    }

    await markPatientProfileComplete(uid).catch(() => {});
    await markPatientOnboardingDone(uid).catch(() => {});
    navigation.reset({ index: 0, routes: [{ name: 'PatientTabs' }] });
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (regionOpen || genderOpen) {
        setRegionOpen(false);
        setGenderOpen(false);
        return true;
      }
      return true;
    });
    return () => subscription.remove();
  }, [regionOpen, genderOpen]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + s(24),
          paddingBottom: Math.max(insets.bottom, s(18)),
          paddingHorizontal: spacing.screen,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', maxWidth: spacing.maxContent, alignSelf: 'center' }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: s(24),
              paddingHorizontal: s(24),
              paddingTop: s(12),
              paddingBottom: s(24),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(18) }}>
              <IconCircleButton
                name="chevron-back"
                accessibilityLabel="Go back"
                onPress={onBack}
              />
              <Text
                style={{ flex: 1, marginLeft: s(12), fontSize: fs(16), fontWeight: '700', color: colors.ink }}
              >
                Create Profile
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upload profile picture"
              onPress={choosePhoto}
              style={{ alignSelf: 'center', marginBottom: s(18) }}
            >
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  contentFit="cover"
                  style={{ width: s(94), height: s(94), borderRadius: s(47) }}
                />
              ) : (
                <View
                  style={{
                    width: s(94),
                    height: s(94),
                    borderRadius: s(47),
                    backgroundColor: '#1F1B16',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="person" size={s(38)} color={colors.white} />
                </View>
              )}
              <View
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: s(28),
                  height: s(28),
                  borderRadius: s(14),
                  backgroundColor: colors.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.card,
                }}
              >
                <Ionicons name="camera" size={s(13)} color={colors.white} />
              </View>
            </Pressable>

            <SelectField
              label="Region"
              value={region}
              placeholder="Select Your Region"
              options={REGIONS}
              open={regionOpen}
              onToggle={() => {
                setRegionOpen((value) => !value);
                setGenderOpen(false);
              }}
              onSelect={(value) => {
                setRegion(value);
                setRegionOpen(false);
                setError('');
              }}
            />

            <SelectField
              label="Gender"
              value={gender}
              placeholder="Select Your Gender"
              options={GENDERS}
              open={genderOpen}
              onToggle={() => {
                setGenderOpen((value) => !value);
                setRegionOpen(false);
              }}
              onSelect={(value) => {
                setGender(value);
                setGenderOpen(false);
                setError('');
              }}
            />

            <View style={{ marginBottom: s(16) }}>
              <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink, marginBottom: s(8) }}>
                Phone Number ( Optional )
              </Text>
              <View
                style={{
                  height: s(52),
                  borderRadius: s(14),
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.field,
                  paddingHorizontal: s(14),
                  justifyContent: 'center',
                }}
              >
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+92-XXX-XXXXXXX"
                  placeholderTextColor={colors.placeholder}
                  allowFontScaling={false}
                  style={{ fontSize: fs(14), color: colors.ink, paddingVertical: 0 }}
                />
              </View>
            </View>

            {error ? (
              <Text style={{ fontSize: fs(12), color: colors.danger, marginBottom: s(10) }}>{error}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue"
              disabled={saving}
              onPress={onContinue}
              style={{
                height: s(54),
                borderRadius: s(27),
                backgroundColor: saving ? colors.brandLight : colors.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.white }}>
                {saving ? 'Saving...' : 'Continue'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}
