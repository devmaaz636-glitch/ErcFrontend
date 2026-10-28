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
}) {
  const input = (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.tertiaryText}
      keyboardType={keyboardType}
      editable={editable && !onPress}
      pointerEvents={onPress ? 'none' : 'auto'}
      style={{
        height: s(48),
        borderRadius: 999,
        backgroundColor: theme.colors.card,
        paddingHorizontal: s(18),
        fontSize: fs(12),
        color: theme.colors.text,
      }}
    />
  );

  if (!onPress) return input;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {input}
    </Pressable>
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
  const [duration, setDuration] = useState(seed?.duration || '');
  const [session, setSession] = useState(seed?.session || seed?.unit || '');
  const [imageUri, setImageUri] = useState(seed?.imageUri || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSave = useMemo(() => {
    return Boolean(name.trim() && department.trim() && String(price).trim() && String(duration).trim());
  }, [name, department, price, duration]);

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
      setError('Enter treatment duration (e.g. 30 Minutes).');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        department: department.trim(),
        category: department.trim(),
        price: priceNumber,
        duration: String(duration).trim(),
        session: String(session).trim() || 'Per Session',
        unit: String(session).trim() || 'Per Session',
        sessions: Number(String(session).match(/(\d+)/)?.[1] || 12),
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
                onPress={() => setDepartmentOpen((open) => !open)}
              />
              {departmentOpen ? (
                <View
                  style={{
                    marginTop: s(8),
                    backgroundColor: theme.colors.card,
                    borderRadius: s(16),
                    overflow: 'hidden',
                  }}
                >
                  {departments.map((item, index) => {
                    const selected = department === item;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setDepartment(item);
                          setDepartmentOpen(false);
                        }}
                        style={{
                          paddingHorizontal: s(16),
                          paddingVertical: s(12),
                          backgroundColor: selected ? colors.brandSoft : theme.colors.card,
                          borderTopWidth: index === 0 ? 0 : 1,
                          borderTopColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: fs(12),
                            fontWeight: selected ? '700' : '500',
                            color: theme.colors.text,
                          }}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
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
                onChangeText={setDuration}
                placeholder="e.g. 30 Minutes"
              />
            </View>

            <View style={{ marginTop: s(16) }}>
              <FieldLabel>Treatment Session</FieldLabel>
              <RoundedInput
                value={session}
                onChangeText={setSession}
                placeholder="e.g. Per Session"
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
