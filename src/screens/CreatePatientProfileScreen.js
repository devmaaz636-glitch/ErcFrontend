import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { useSession } from '../context/SessionContext';
import { auth } from '../lib/firebase';
import { savePatientProfile } from '../lib/patientPortal';
import { markPatientOnboardingDone, markPatientProfileComplete } from '../lib/patientOnboarding';
import { colors } from '../theme';
import { fs, scale as s } from '../utils/responsive';

const REGIONS = ['UAE', 'KSA', 'Oman', 'Pakistan', 'USA'];
const GENDERS = ['Female', 'Male', 'Prefer not to say'];

function SelectField({ label, value, placeholder, options, open, onToggle, onSelect }) {
  return (
    <View style={{ marginBottom: s(11) }}>
      <Text style={{ fontSize: fs(12), fontWeight: '600', color: colors.ink, marginBottom: s(6) }}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={{
          height: s(42),
          borderRadius: s(12),
          backgroundColor: colors.card,
          paddingHorizontal: s(12),
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#F3EFEA',
        }}
      >
        <Text style={{ flex: 1, fontSize: fs(12), color: value ? colors.ink : colors.placeholder }}>
          {value || placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={s(16)} color={colors.muted} />
      </Pressable>
      {open ? (
        <View
          style={{
            marginTop: s(5),
            borderRadius: s(12),
            backgroundColor: colors.card,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#EFE8E1',
          }}
        >
          {options.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => onSelect(option)}
              style={{
                minHeight: s(40),
                paddingHorizontal: s(12),
                justifyContent: 'center',
                backgroundColor: value === option ? colors.brandSoft : colors.card,
              }}
            >
              <Text style={{ fontSize: fs(12), color: value === option ? colors.brand : colors.ink }}>
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
  const { height } = useWindowDimensions();
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
  const profileSheetHeight = Math.min(Math.max(height * 0.665, 420), 560);

  function onBack() {
    if (regionOpen || genderOpen) {
      setRegionOpen(false);
      setGenderOpen(false);
    }
  }

  async function choosePhoto() {
    try {
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
    } catch {
      setError('Could not open your photos. Please try again.');
    }
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

    const uid = auth.currentUser?.uid || route.params?.uid || null;
    if (!auth.currentUser || !uid) {
      setError('Your sign-in has expired. Please sign in again.');
      return;
    }

    setSaving(true);
    setError('');
    const name = fullName || auth.currentUser.displayName || '';
    const email = auth.currentUser.email || route.params?.email || '';

    try {
      await savePatientProfile({ name, region, gender, phone: phone.trim() });
      await updateUser({
        uid,
        name,
        email,
        role: 'patient',
        region,
        gender,
        phone: phone.trim(),
        photoUrl: photoUrl || null,
      });
      await markPatientProfileComplete(uid);
      await markPatientOnboardingDone(uid);
      navigation.reset({ index: 0, routes: [{ name: 'PatientTabs' }] });
    } catch (saveError) {
      setError(saveError?.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [regionOpen, genderOpen]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.brand }}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Image
        source={require('../../assets/signin-bg.png')}
        contentFit="cover"
        contentPosition="center"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.39 }}
        accessibilityLabel="Enfield Royal Clinics reception"
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.39,
          backgroundColor: 'rgba(191, 130, 79, 0.10)',
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: Math.max(insets.top + s(52), height * 0.12),
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../../assets/signin-logo.png')}
          contentFit="contain"
          accessibilityLabel="Enfield Royal Clinics"
          style={{ width: s(154), height: s(48) }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: profileSheetHeight,
          maxWidth: 560,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderTopLeftRadius: s(24),
            borderTopRightRadius: s(24),
          }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: s(9),
            paddingHorizontal: s(18),
            paddingBottom: Math.max(insets.bottom, s(14)),
          }}
        >
          <View
            style={{
              width: s(42),
              height: s(3),
              borderRadius: s(2),
              backgroundColor: colors.brand,
              alignSelf: 'center',
              marginBottom: s(13),
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(14) }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onBack}
              hitSlop={8}
              style={{ width: s(26), height: s(30), justifyContent: 'center' }}
            >
              <Ionicons name="chevron-back" size={s(20)} color={colors.muted} />
            </Pressable>
            <Text style={{ marginLeft: s(8), fontSize: fs(14), fontWeight: '700', color: colors.ink }}>
              Create Profile
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Upload profile picture"
            onPress={choosePhoto}
            style={{ alignSelf: 'center', alignItems: 'center', marginBottom: s(10) }}
          >
            <View>
              <Image
                source={photoUrl ? { uri: photoUrl } : require('../../assets/userprofile.png')}
                contentFit="cover"
                style={{ width: s(84), height: s(84), borderRadius: s(42) }}
              />
              <View
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: s(25),
                  height: s(25),
                  borderRadius: s(13),
                  backgroundColor: colors.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.card,
                }}
              >
                <Ionicons name="camera" size={s(12)} color={colors.white} />
              </View>
            </View>
            <Text
              style={{
                marginTop: s(5),
                fontSize: fs(12),
                color: colors.ink,
              }}
            >
              Upload Profile
            </Text>
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

          <View style={{ marginBottom: s(12) }}>
            <Text style={{ fontSize: fs(12), fontWeight: '600', color: colors.ink, marginBottom: s(6) }}>
              Phone Number ( Optional )
            </Text>
            <View
              style={{
                height: s(42),
                borderRadius: s(12),
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: '#F3EFEA',
                paddingHorizontal: s(12),
                justifyContent: 'center',
              }}
            >
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Enter your phone number"
                placeholderTextColor={colors.placeholder}
                allowFontScaling={false}
                style={{ fontSize: fs(12), color: colors.ink, paddingVertical: 0 }}
              />
            </View>
          </View>

          {error ? (
            <Text style={{ fontSize: fs(12), color: colors.danger, marginBottom: s(8) }}>{error}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            disabled={saving}
            onPress={onContinue}
            style={{ height: s(44), borderRadius: s(24), overflow: 'hidden' }}
          >
            <LinearGradient
              colors={saving ? [colors.brandLight, colors.brandLight] : ['#C4895C', '#E6A06A']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.white }}>
                {saving ? 'Saving...' : 'Continue'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
