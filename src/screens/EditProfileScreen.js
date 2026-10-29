import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
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
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { scale as s, fs, useTopPadding } from '../utils/responsive';
import { PROFILE_STORAGE_KEY } from '../lib/profileStorage';
import { roleLabel, useSession } from '../context/SessionContext';
import { useClinicData } from '../context/ClinicDataContext';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { notifyProfileUpdated } from '../lib/notifyEvents';
import { colors } from '../theme';

const BROWN = colors.brand;
const BROWN_SOFT = colors.brandField;
const INK = colors.ink;
const MUTED = colors.muted;
const BG = colors.background;
const FIELD = colors.card;

export { PROFILE_STORAGE_KEY };

// Fallback region names. Pass `regions` through route params to override.
const REGIONS = ['UAE', 'KSA', 'Oman', 'Pakistan', 'USA'];

const DEFAULT_USER = {
  name: '',
  email: '',
  role: 'Regional Admin',
  region: '',
  photoUrl: null,
};

const EMAIL_LOCKED_TITLE = 'Email cannot be changed';
const EMAIL_LOCKED_MESSAGE =
  'Please contact the developer to change your email address. It can only be updated from the web application.';
const POPUP_DURATION_MS = 10000;

/* ---------- Text field ---------- */
function Field({ label, value, onChangeText, placeholder, keyboardType, showClear, onClear, editable = true }) {
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
          editable={editable}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
          allowFontScaling={false}
          style={{ flex: 1, fontSize: fs(14), color: editable ? INK : MUTED, paddingVertical: 0 }}
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

/* ---------- Locked (read-only) email field ---------- */
function LockedEmailField({ label, value, onPress }) {
  return (
    <View style={{ marginBottom: s(16) }}>
      <Text style={{ fontSize: fs(14), fontWeight: '700', color: INK, marginBottom: s(8) }}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value || 'not set'}. Cannot be edited`}
        onPress={onPress}
        style={{
          height: s(52),
          borderRadius: 14,
          backgroundColor: FIELD,
          paddingHorizontal: s(14),
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text
          style={{ flex: 1, fontSize: fs(14), color: MUTED }}
          numberOfLines={1}
        >
          {value || '—'}
        </Text>
        <Ionicons name="lock-closed-outline" size={s(18)} color={MUTED} />
      </Pressable>
    </View>
  );
}

/* ---------- Info popup (auto-hides) ---------- */
function InfoPopup({ title, message, anim, progress, top, onClose }) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: s(16),
        zIndex: 50,
      }}
    >
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#F1E7DD',
          shadowColor: BROWN,
          shadowOpacity: 0.22,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
          ],
        }}
      >
        <View style={{ flexDirection: 'row', padding: s(14), alignItems: 'flex-start' }}>
          <View
            style={{
              width: s(38),
              height: s(38),
              borderRadius: s(19),
              backgroundColor: BROWN_SOFT,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="lock-closed" size={s(18)} color={BROWN} />
          </View>

          <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
            <Text style={{ fontSize: fs(14), fontWeight: '700', color: INK }}>{title}</Text>
            <Text style={{ fontSize: fs(12), color: MUTED, marginTop: 3, lineHeight: fs(17) }}>
              {message}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss message"
            hitSlop={10}
            onPress={onClose}
          >
            <Ionicons name="close" size={s(18)} color={MUTED} />
          </Pressable>
        </View>

        {/* Countdown bar: empties over the 10 seconds */}
        <View style={{ height: 3, backgroundColor: BROWN_SOFT }}>
          <Animated.View
            style={{
              height: 3,
              backgroundColor: BROWN,
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] }),
            }}
          />
        </View>
      </Animated.View>
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
  const { user: sessionUserRaw, displayRegion, updateUser } = useSession();
  const { dashboard } = useClinicData();
  const sessionUser = sessionUserRaw ?? {};
  const isManager = sessionUser.role === 'clinic_manager';

  const regions = route.params?.regions?.length ? route.params.regions : REGIONS;
  // Session is source of truth; route params only fill gaps on first open.
  const seed = {
    ...DEFAULT_USER,
    ...(route.params?.user || {}),
    ...sessionUser,
    region: sessionUser.region || displayRegion || route.params?.user?.region || '',
  };

  const [user, setUser] = useState(seed);
  const [name, setName] = useState(seed.name?.split(' ')[0] || seed.name || '');
  const [region, setRegion] = useState(seed.region || '');
  const [photoUri, setPhotoUri] = useState(seed.photoUrl || null);
  const [regionOpen, setRegionOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Email is read-only. It always comes from the session (or the stored profile as a fallback).
  const email = user.email || '';

  // Popup shown when the admin taps the locked email field. Auto-hides after 10 seconds.
  const [popupVisible, setPopupVisible] = useState(false);
  const popupAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  function hideEmailPopup() {
    clearTimeout(hideTimer.current);
    progressAnim.stopAnimation();
    Animated.timing(popupAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) setPopupVisible(false);
    });
  }

  function showEmailLockedMessage() {
    clearTimeout(hideTimer.current);
    setPopupVisible(true);
    Animated.timing(popupAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: POPUP_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    hideTimer.current = setTimeout(hideEmailPopup, POPUP_DURATION_MS);
  }

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // One-time hydrate from storage so region/name persist across iOS + Android restarts.
  // Do not re-run on session changes — that would wipe in-progress edits.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (!alive) return;
        const stored = raw ? JSON.parse(raw) : {};
        const sameUserCache = stored.uid === sessionUser.uid;
        const merged = {
          ...DEFAULT_USER,
          ...sessionUser,
          name: sameUserCache ? stored.name || sessionUser.name || '' : sessionUser.name || '',
          email: sessionUser.email || '',
          role: sessionUser.role,
          region: sessionUser.region || displayRegion || '',
          photoUrl: sameUserCache ? stored.photoUrl || sessionUser.photoUrl || null : sessionUser.photoUrl || null,
        };
        setUser(merged);
        setName(merged.name?.split(' ')[0] || merged.name || '');
        setRegion(merged.region || '');
        setPhotoUri(merged.photoUrl || null);
      } catch {
        /* fall back to session seed */
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
    const nextRegion = region.trim();

    if (!nextName) {
      Alert.alert('Name required', 'Enter your name.');
      return;
    }
    if (!isManager && !nextRegion) {
      Alert.alert('Region required', 'Select your region.');
      return;
    }

    const lastName = (user.name || '').split(' ').slice(1).join(' ');
    const updated = {
      ...user,
      name: nextName.includes(' ') ? nextName : `${nextName} ${lastName}`.trim(),
      email, // never changed from the app
      region: isManager ? user.region : nextRegion,
      photoUrl: photoUri,
    };

    try {
      setSaving(true);
      const before = { ...user };
      await updateUser(updated);
      setUser(updated);
      // Email + in-app (and push if enabled) — does not block navigation.
      notifyProfileUpdated(before, updated).catch(() => {});
      // Pop back so Profile reuses the same tab instance and shows fresh session state.
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigateToTab(navigation, TAB_ROUTES.Profile);
      }
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
              <IconCircleButton
                name="chevron-back"
                color={INK}
                accessibilityLabel="Go back"
                onPress={() => navigation.goBack()}
              />

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

              <NotificationBellButton color={BROWN} />
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
              <Text style={{ fontSize: fs(11), color: MUTED, marginTop: 2 }}>{roleLabel(user.role)}</Text>
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
              <LockedEmailField
                label="Email"
                value={email}
                onPress={showEmailLockedMessage}
              />
              {isManager ? (
                <Field
                  label="Assigned Branch"
                  value={dashboard?.clinic?.name || dashboard?.clinic?.city || 'Assigned clinic'}
                  onChangeText={() => {}}
                  editable={false}
                />
              ) : (
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
              )}
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

      {popupVisible ? (
        <InfoPopup
          title={EMAIL_LOCKED_TITLE}
          message={EMAIL_LOCKED_MESSAGE}
          anim={popupAnim}
          progress={progressAnim}
          top={Math.max(insets.top, 12) + s(8)}
          onClose={hideEmailPopup}
        />
      ) : null}
    </View>
  );
}