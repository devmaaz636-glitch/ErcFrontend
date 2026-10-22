import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Text from '../components/AppText';
import UserAvatar from '../components/UserAvatar';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = '#BF824F';
const BROWN_SOFT = '#F6EADD';
const INK = '#1F1B16';
const MUTED = '#8D8680';
const BG = '#FFF8F1';
const FIELD = '#FFFFFF';

// Same key everywhere the profile is read (e.g. ProfileTab) so changes persist.
export const PROFILE_STORAGE_KEY = 'profile:user';

// Fallback region names. Pass `regions` through route params to override.
const REGIONS = ['UAE', 'KSA', 'Oman', 'Pakistan', 'USA'];

const DEFAULT_USER = {
  name: 'Ahsan Jamal',
  email: 'ahsanadmin@gmail.com',
  role: 'Admin',
  region: 'USA',
  photoUrl: null,
};

/* ---------- Text field ---------- */
function Field({ label, value, onChangeText, placeholder, keyboardType, showClear, onClear }) {
  return (
    <View style={{ marginBottom: s(16) }}>
      <Text style={{ fontSize: fs(14), fontWeight: '700', color: INK, marginBottom: s(8) }}>
        {label}
      </Text>
      <View
        style={{
          height: s(52),
          borderRadius: 14,
          backgroundColor: FIELD,
          paddingHorizontal: s(14),
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B0A89F"
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
          allowFontScaling={false}
          style={{ flex: 1, fontSize: fs(14), color: INK, paddingVertical: 0 }}
        />
        {showClear && value ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onClear}>
            <Ionicons name="close-circle" size={s(18)} color="#C4BDB6" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/* ---------- Dropdown field ---------- */
function DropdownField({ label, value, options, open, onToggle, onSelect, placeholder }) {
  return (
    <View style={{ marginBottom: s(16) }}>
      <Text style={{ fontSize: fs(14), fontWeight: '700', color: INK, marginBottom: s(8) }}>
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value || 'not selected'}`}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={{
          height: s(52),
          borderRadius: 14,
          backgroundColor: FIELD,
          paddingHorizontal: s(14),
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: open ? BROWN : 'transparent',
        }}
      >
        <Ionicons name="location-outline" size={s(18)} color={BROWN} />
        <Text
          style={{
            flex: 1,
            marginLeft: s(10),
            fontSize: fs(14),
            color: value ? INK : '#B0A89F',
          }}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={s(18)} color={BROWN} />
      </Pressable>

      {open ? (
        <View
          style={{
            marginTop: s(6),
            borderRadius: 14,
            backgroundColor: FIELD,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#F1E7DD',
          }}
        >
          {options.map((opt, index) => {
            const selected = opt === value;
            return (
              <Pressable
                key={opt}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(opt)}
                style={{
                  height: s(48),
                  paddingHorizontal: s(14),
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: selected ? BROWN_SOFT : FIELD,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: '#F6EFE8',
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: fs(14),
                    fontWeight: selected ? '700' : '500',
                    color: selected ? BROWN : INK,
                  }}
                >
                  {opt}
                </Text>
                {selected ? <Ionicons name="checkmark-circle" size={s(20)} color={BROWN} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/* ---------- Screen ---------- */
export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);

  const regions = route.params?.regions?.length ? route.params.regions : REGIONS;
  const paramUser = route.params?.user;

  // `user` is the current saved profile (defaults < stored < route params).
  const [user, setUser] = useState({ ...DEFAULT_USER, ...(paramUser || {}) });
  const [name, setName] = useState(user.name?.split(' ')[0] || user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [region, setRegion] = useState(user.region || '');
  const [photoUri, setPhotoUri] = useState(user.photoUrl || null);
  const [regionOpen, setRegionOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the previously saved profile once, so edits survive app restarts.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (!raw || !alive) return;
        const merged = { ...DEFAULT_USER, ...JSON.parse(raw), ...(paramUser || {}) };
        setUser(merged);
        setName(merged.name?.split(' ')[0] || merged.name || '');
        setEmail(merged.email || '');
        setRegion(merged.region || '');
        setPhotoUri(merged.photoUrl || null);
      } catch (e) {
        // Ignore: fall back to defaults / route params.
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // stored as a data URI so the image never disappears from cache
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;
    const mime = asset.mimeType || 'image/jpeg';
    setPhotoUri(asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri);
  }

  async function saveChanges() {
    if (saving) return;
    const nextName = name.trim();
    const nextEmail = email.trim();
    const nextRegion = region.trim();

    if (!nextName) {
      Alert.alert('Name required', 'Enter your name.');
      return;
    }
    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      Alert.alert('Email required', 'Enter a valid email address.');
      return;
    }
    if (!nextRegion) {
      Alert.alert('Region required', 'Select your region.');
      return;
    }

    const lastName = (user.name || '').split(' ').slice(1).join(' ');
    const updated = {
      ...user,
      name: nextName.includes(' ') ? nextName : `${nextName} ${lastName}`.trim(),
      email: nextEmail,
      region: nextRegion,
      photoUrl: photoUri,
    };

    try {
      setSaving(true);
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      navigation.navigate('ProfileTab', { user: updated });
    } catch (e) {
      Alert.alert('Could not save', 'Something went wrong while saving your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const AVATAR = s(112);
  const RING = 4;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: topPad,
            paddingHorizontal: s(20),
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            alignItems: 'center',
          }}
        >
          <View style={{ width: '100%', maxWidth: 480 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={() => navigation.goBack()}
                style={{
                  width: s(36),
                  height: s(36),
                  borderRadius: s(18),
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={s(18)} color={INK} />
              </Pressable>

              <Text
                style={{
                  flex: 1,
                  marginLeft: s(12),
                  fontSize: fs(16),
                  fontWeight: '700',
                  color: INK,
                }}
                numberOfLines={1}
              >
                Edit Profile
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                hitSlop={8}
                style={{
                  width: s(36),
                  height: s(36),
                  borderRadius: s(18),
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="notifications-outline" size={s(18)} color={BROWN} />
              </Pressable>
            </View>

            {/* Avatar */}
            <View style={{ alignItems: 'center', marginTop: s(22) }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change photo"
                onPress={pickPhoto}
              >
                <View
                  style={{
                    width: AVATAR + RING * 2 + 6,
                    height: AVATAR + RING * 2 + 6,
                    borderRadius: (AVATAR + RING * 2 + 6) / 2,
                    backgroundColor: '#fff',
                    borderWidth: RING,
                    borderColor: BROWN,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: BROWN,
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 6,
                  }}
                >
                  <View
                    style={{
                      width: AVATAR,
                      height: AVATAR,
                      borderRadius: AVATAR / 2,
                      overflow: 'hidden',
                    }}
                  >
                    <UserAvatar uri={photoUri} size={AVATAR} />
                  </View>
                </View>

                <View
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 2,
                    width: s(34),
                    height: s(34),
                    borderRadius: s(17),
                    backgroundColor: BROWN,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: BG,
                  }}
                >
                  <Ionicons name="camera" size={s(15)} color="#fff" />
                </View>
              </Pressable>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(10) }}>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={pickPhoto}>
                  <Text style={{ fontSize: fs(11), fontWeight: '600', color: BROWN }}>
                    {photoUri ? 'Change Photo' : 'Add Photo'}
                  </Text>
                </Pressable>
                {photoUri ? (
                  <>
                    <Text style={{ fontSize: fs(11), color: MUTED, marginHorizontal: s(8) }}>|</Text>
                    <Pressable
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => setPhotoUri(null)}
                    >
                      <Text style={{ fontSize: fs(11), fontWeight: '600', color: '#E5484D' }}>Remove</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>

              <Text style={{ fontSize: fs(16), fontWeight: '700', color: INK, marginTop: s(12) }}>
                {user.name}
              </Text>
              <Text style={{ fontSize: fs(11), color: MUTED, marginTop: 2 }}>{user.role}</Text>
            </View>

            {/* Fields */}
            <View style={{ marginTop: s(28) }}>
              <Field
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Ahsan"
                showClear
                onClear={() => setName('')}
              />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="debra.holt@example.com"
                keyboardType="email-address"
              />
              <DropdownField
                label="Region"
                value={region}
                options={regions}
                placeholder="Select region"
                open={regionOpen}
                onToggle={() => setRegionOpen((v) => !v)}
                onSelect={(r) => {
                  setRegion(r);
                  setRegionOpen(false);
                }}
              />
            </View>

            {/* Save */}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: saving }}
              disabled={saving}
              onPress={saveChanges}
              style={{
                height: s(52),
                borderRadius: 999,
                backgroundColor: BROWN,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: s(8),
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}