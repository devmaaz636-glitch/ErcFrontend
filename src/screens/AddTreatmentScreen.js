import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton } from '../components/ui';
import {
  clinicErrorMessage,
  createManagerTreatment,
  updateManagerTreatment,
} from '../lib/clinic';
import { colors, spacing, managerDashboard as theme } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const DEFAULT_DEPARTMENTS = [
  'Plastic Surgery',
  'Cosmetic Injectables',
  'Laser Treatments',
  'Skincare',
  'Dermatologists',
  'Hair Transplant',
  'Dental Treatments',
  'Weight Loss',
  'Gynecology',
  'Regenerative',
  'Physiotherapist',
  'Home Healthcare',
  'Intimate Surgery',
];

const DURATION_OPTIONS = [
  { label: '15 To 30 Min', minutes: 30 },
  { label: '30 To 45 Min', minutes: 45 },
  { label: '45 To 1 Hour', minutes: 60 },
];

const SESSION_OPTIONS = ['1 Session', '2 Session', '3 Session'];

function matchDurationOption(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  return (
    DURATION_OPTIONS.find((item) => item.label.toLowerCase() === raw) ||
    DURATION_OPTIONS.find((item) => raw.includes(String(item.minutes))) ||
    null
  );
}

function FieldLabel({ children }) {
  return (
    <Text
      style={{
        color: theme.colors.text,
        fontSize: fs(12),
        fontWeight: '600',
        marginBottom: s(8),
      }}
    >
      {children}
    </Text>
  );
}

function RoundedInput({
  value,
  onChangeText,
  placeholder = 'Enter here',
  keyboardType = 'default',
  editable = true,
  onPress,
  showChevron = false,
}) {
  const input = (
    <View
      pointerEvents={onPress ? 'none' : 'auto'}
      style={{
        height: s(48),
        borderRadius: s(14),
        backgroundColor: theme.colors.card,
        paddingHorizontal: s(18),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.tertiaryText}
        keyboardType={keyboardType}
        editable={editable && !onPress}
        style={{
          flex: 1,
          fontSize: fs(12),
          color: theme.colors.text,
          paddingVertical: 0,
        }}
      />
      {showChevron || onPress ? (
        <Ionicons name="chevron-down" size={s(16)} color={theme.colors.tertiaryText} />
      ) : null}
    </View>
  );

  if (!onPress) return input;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {input}
    </Pressable>
  );
}

function OptionsDropdown({ open, options, value, onSelect }) {
  if (!open) return null;
  return (
    <View
      style={{
        marginTop: s(8),
        backgroundColor: theme.colors.card,
        borderRadius: s(16),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {options.map((item, index) => {
        const label = typeof item === 'string' ? item : item.label;
        const selected = value === label;
        return (
          <Pressable
            key={label}
            onPress={() => onSelect(item)}
            style={{
              paddingHorizontal: s(16),
              paddingVertical: s(13),
              backgroundColor: selected ? colors.brandSoft : theme.colors.card,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                fontSize: fs(13),
                fontWeight: selected ? '700' : '500',
                color: colors.heading || theme.colors.text,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AddTreatmentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const topPad = useTopPadding(14);
  const departments = route.params?.departments?.length
    ? route.params.departments
    : DEFAULT_DEPARTMENTS;
  const currency = route.params?.currency || 'AED';
  const editing = route.params?.mode === 'edit' && route.params?.treatment?.id;
  const seed = editing ? route.params.treatment : null;

  const [name, setName] = useState(seed?.name || '');
  const [description, setDescription] = useState(seed?.description || '');
  const [department, setDepartment] = useState(seed?.department || seed?.category || '');
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [price, setPrice] = useState(
    seed?.price != null && Number.isFinite(Number(seed.price)) ? String(seed.price) : ''
  );
  const [duration, setDuration] = useState(() => matchDurationOption(seed?.duration)?.label || '');
  const [durationMin, setDurationMin] = useState(
    () => matchDurationOption(seed?.duration)?.minutes || seed?.durationMin || null
  );
  const [session, setSession] = useState(() => {
    const raw = seed?.session || seed?.unit || '';
    const matched = SESSION_OPTIONS.find((item) => item === raw);
    if (matched) return matched;
    const count = Number(String(raw).match(/(\d+)/)?.[1] || seed?.sessions || 0);
    return count >= 1 && count <= 3 ? `${count} Session` : '';
  });
  const [durationOpen, setDurationOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [imageUri, setImageUri] = useState(seed?.imageUri || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSave = useMemo(() => {
    return Boolean(
      name.trim() &&
        department.trim() &&
        String(price).trim() &&
        String(duration).trim() &&
        String(session).trim()
    );
  }, [name, department, price, duration, session]);

  async function pickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo access to upload a treatment image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Could not open gallery', 'Try again in a moment.');
    }
  }

  async function onSave() {
    if (saving) return;
    if (!name.trim()) {
      setError('Enter a treatment name.');
      return;
    }
    if (!department.trim()) {
      setError('Select a treatment department.');
      return;
    }
    const priceNumber = Number(String(price).replace(/,/g, '').trim());
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError('Enter a valid treatment price.');
      return;
    }
    if (!String(duration).trim()) {
      setError('Select treatment duration.');
      return;
    }
    if (!String(session).trim()) {
      setError('Select treatment session.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const matchedDuration = matchDurationOption(duration);
      const minutes = durationMin || matchedDuration?.minutes || 30;
      const sessionCount = Number(String(session).match(/(\d+)/)?.[1] || 1);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        department: department.trim(),
        category: department.trim(),
        price: priceNumber,
        duration: String(duration).trim(),
        durationMin: minutes,
        session: String(session).trim(),
        unit: String(session).trim(),
        sessions: sessionCount,
        imageUri: imageUri || null,
      };
      const saved = editing
        ? await updateManagerTreatment(seed.id, payload)
        : await createManagerTreatment(payload);

      if (editing) {
        navigation.navigate({
          name: 'TreatmentDetail',
          params: { treatmentId: saved.id, treatment: saved, refreshedAt: Date.now() },
          merge: true,
        });
      } else {
        navigation.navigate({
          name: 'ManagerTabs',
          params: {
            screen: 'TreatmentsTab',
            params: { newlyCreated: saved, refreshedAt: Date.now() },
          },
          merge: true,
        });
      }
    } catch (err) {
      setError(clinicErrorMessage(err) || 'Could not save treatment.');
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    if (saving) return;
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.page }}>
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
            paddingHorizontal: spacing.screen,
            paddingBottom: s(36),
            alignItems: 'center',
          }}
        >
          <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconCircleButton
                name="chevron-back"
                accessibilityLabel="Go back"
                onPress={onCancel}
              />
              <Text
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: fs(15),
                  fontWeight: '600',
                  color: theme.colors.text,
                }}
              >
                {editing ? 'Edit Treatment' : 'Add New Treatment'}
              </Text>
              <IconCircleButton
                name="ellipsis-vertical"
                accessibilityLabel="More options"
                onPress={() => {}}
              />
            </View>

            <View style={{ marginTop: s(22) }}>
              <FieldLabel>Treatment Name</FieldLabel>
              <RoundedInput value={name} onChangeText={setName} />
            </View>

            <View style={{ marginTop: s(16) }}>
              <FieldLabel>Treatment Description</FieldLabel>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter a short description"
                placeholderTextColor={theme.colors.tertiaryText}
                multiline
                textAlignVertical="top"
                style={{
                  minHeight: s(88),
                  borderRadius: s(20),
                  backgroundColor: theme.colors.card,
                  paddingHorizontal: s(18),
                  paddingTop: s(14),
                  paddingBottom: s(14),
                  fontSize: fs(12),
                  color: theme.colors.text,
                  lineHeight: fs(18),
                }}
              />
            </View>

            <View style={{ marginTop: s(16) }}>
              <FieldLabel>Treatment Department</FieldLabel>
              <RoundedInput
                value={department}
                placeholder="Enter here"
                editable={false}
                showChevron
                onPress={() => {
                  setDepartmentOpen((open) => !open);
                  setDurationOpen(false);
                  setSessionOpen(false);
                }}
              />
              <OptionsDropdown
                open={departmentOpen}
                options={departments}
                value={department}
                onSelect={(item) => {
                  setDepartment(item);
                  setDepartmentOpen(false);
                }}
              />
            </View>

            <View style={{ marginTop: s(16) }}>
              <FieldLabel>Treatment Image</FieldLabel>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Upload treatment image"
                onPress={pickImage}
                style={{
                  height: s(140),
                  borderRadius: s(18),
                  backgroundColor: '#EFE7DF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: s(44),
                        height: s(44),
                        borderRadius: s(12),
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="image-outline" size={s(20)} color={theme.colors.tertiaryText} />
                      <View
                        style={{
                          position: 'absolute',
                          right: -2,
                          top: -2,
                          width: s(16),
                          height: s(16),
                          borderRadius: s(8),
                          backgroundColor: theme.colors.card,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="add" size={s(12)} color={theme.colors.tertiaryText} />
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            </View>

            <View style={{ marginTop: s(16) }}>
              <FieldLabel>Treatment Price</FieldLabel>
              <RoundedInput
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder={`Enter here (${currency})`}
              />
            </View>

            <View style={{ marginTop: s(16) }}>
              <FieldLabel>Treatment Duration</FieldLabel>
              <RoundedInput
                value={duration}
                placeholder="Enter here"
                editable={false}
                showChevron
                onPress={() => {
                  setDurationOpen((open) => !open);
                  setDepartmentOpen(false);
                  setSessionOpen(false);
                }}
              />
              <OptionsDropdown
                open={durationOpen}
                options={DURATION_OPTIONS}
                value={duration}
                onSelect={(item) => {
                  setDuration(item.label);
                  setDurationMin(item.minutes);
                  setDurationOpen(false);
                }}
              />
            </View>

            <View style={{ marginTop: s(16) }}>
              <FieldLabel>Treatment Session</FieldLabel>
              <RoundedInput
                value={session}
                placeholder="Enter here"
                editable={false}
                showChevron
                onPress={() => {
                  setSessionOpen((open) => !open);
                  setDepartmentOpen(false);
                  setDurationOpen(false);
                }}
              />
              <OptionsDropdown
                open={sessionOpen}
                options={SESSION_OPTIONS}
                value={session}
                onSelect={(item) => {
                  setSession(item);
                  setSessionOpen(false);
                }}
              />
            </View>

            {error ? (
              <Text
                style={{
                  marginTop: s(14),
                  color: colors.danger,
                  fontSize: fs(11),
                  textAlign: 'center',
                }}
              >
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={saving || !canSave}
              onPress={onSave}
              style={{
                height: s(48),
                borderRadius: 999,
                backgroundColor: theme.colors.brandButton || colors.brand,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: s(28),
                opacity: saving || !canSave ? 0.7 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: fs(14), fontWeight: '600' }}>Save</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={onCancel}
              style={{
                height: s(48),
                borderRadius: 999,
                backgroundColor: theme.colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: s(12),
              }}
            >
              <Text style={{ color: theme.colors.secondaryText, fontSize: fs(14), fontWeight: '500' }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
