import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
  deleteManagerTreatment,
  fetchManagerDoctors,
  fetchManagerTreatment,
  updateManagerTreatment,
} from '../lib/clinic';
import { colors, spacing, managerDashboard as theme } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const treatmentDetailImage = require('../../assets/treatmentdetail.png');
const treatmentDoctorImage = require('../../assets/treatmentdocotor.png');

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

function SectionHeader({ title, onEdit }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: s(12),
      }}
    >
      <Text style={{ color: theme.colors.text, fontSize: fs(13), fontWeight: '700', flex: 1 }}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${title}`}
        hitSlop={8}
        onPress={onEdit}
        style={{
          width: s(28),
          height: s(28),
          borderRadius: s(8),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="create-outline" size={s(15)} color={theme.colors.tertiaryText} />
      </Pressable>
    </View>
  );
}

function InfoTile({ icon, value, label }) {
  return (
    <View
      style={{
        width: '48.5%',
        backgroundColor: theme.colors.card,
        borderRadius: s(14),
        paddingVertical: s(16),
        paddingHorizontal: s(10),
        marginBottom: s(10),
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: s(36),
          height: s(36),
          borderRadius: s(18),
          backgroundColor: '#F3E6DA',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: s(10),
        }}
      >
        <Ionicons name={icon} size={s(17)} color={theme.colors.brandButton || colors.brand} />
      </View>
      <Text
        style={{ color: theme.colors.text, fontSize: fs(13), fontWeight: '700', textAlign: 'center' }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={{
          color: theme.colors.secondaryText,
          fontSize: fs(9),
          marginTop: 4,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function DoctorCard({ doctor }) {
  return (
    <View
      style={{
        width: '48.5%',
        backgroundColor: theme.colors.card,
        borderRadius: s(14),
        paddingTop: s(16),
        paddingBottom: s(14),
        paddingHorizontal: s(10),
        alignItems: 'center',
      }}
    >
      <Image
        source={treatmentDoctorImage}
        contentFit="cover"
        style={{
          width: s(72),
          height: s(72),
          borderRadius: s(36),
          backgroundColor: '#E8D5C4',
        }}
      />
      <Text
        style={{
          marginTop: s(10),
          color: theme.colors.text,
          fontSize: fs(11),
          fontWeight: '700',
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {doctor.name}
      </Text>
      <Text
        style={{
          marginTop: 3,
          color: theme.colors.secondaryText,
          fontSize: fs(9),
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {doctor.specialtyLabel || doctor.specialty || 'Specialist'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View details for ${doctor.name}`}
        onPress={() => {}}
        style={{
          marginTop: s(12),
          height: s(30),
          minWidth: s(96),
          paddingHorizontal: s(14),
          borderRadius: 999,
          backgroundColor: theme.colors.brandButton || colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: fs(9), fontWeight: '600' }}>View Details</Text>
      </Pressable>
    </View>
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

function ModalShell({ visible, title, onClose, children, footer }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(26, 22, 20, 0.35)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View
            style={{
              backgroundColor: theme.colors.page,
              borderTopLeftRadius: s(22),
              borderTopRightRadius: s(22),
              paddingHorizontal: spacing.screen,
              paddingTop: s(16),
              paddingBottom: s(24),
              maxHeight: '88%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(14) }}>
              <Text
                style={{
                  flex: 1,
                  fontSize: fs(15),
                  fontWeight: '700',
                  color: theme.colors.text,
                }}
              >
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                hitSlop={10}
              >
                <Ionicons name="close" size={s(20)} color={theme.colors.tertiaryText} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: s(8) }}
            >
              {children}
            </ScrollView>
            {footer}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RoundedField({
  value,
  onChangeText,
  placeholder = 'Enter here',
  keyboardType = 'default',
  multiline = false,
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.tertiaryText}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={{
        minHeight: multiline ? s(84) : s(46),
        borderRadius: multiline ? s(18) : 999,
        backgroundColor: theme.colors.card,
        paddingHorizontal: s(16),
        paddingVertical: multiline ? s(12) : 0,
        fontSize: fs(12),
        color: theme.colors.text,
      }}
    />
  );
}

function ConfirmDeleteModal({ visible, busy, onClose, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 22, 20, 0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: s(28),
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: '#fff',
            borderRadius: s(22),
            paddingHorizontal: s(22),
            paddingTop: s(16),
            paddingBottom: s(22),
            alignItems: 'center',
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={10}
            style={{ alignSelf: 'flex-end' }}
          >
            <Ionicons name="close" size={s(18)} color={theme.colors.tertiaryText} />
          </Pressable>
          <Ionicons
            name="trash-outline"
            size={s(36)}
            color={theme.colors.brandButton || colors.brand}
            style={{ marginTop: s(4) }}
          />
          <Text
            style={{
              marginTop: s(14),
              fontSize: fs(18),
              fontWeight: '700',
              color: theme.colors.brandButton || colors.brand,
            }}
          >
            Are You Sure?
          </Text>
          <Text
            style={{
              marginTop: s(8),
              fontSize: fs(11),
              color: theme.colors.secondaryText,
              textAlign: 'center',
            }}
          >
            Do you want to delete this?
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={onConfirm}
            style={{
              marginTop: s(20),
              height: s(44),
              minWidth: s(140),
              paddingHorizontal: s(28),
              borderRadius: 999,
              backgroundColor: theme.colors.brandButton || colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: fs(13), fontWeight: '600' }}>Confirm</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function DeletedSuccessModal({ visible, onDone }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 22, 20, 0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: s(28),
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: '#fff',
            borderRadius: s(22),
            paddingHorizontal: s(22),
            paddingTop: s(16),
            paddingBottom: s(22),
            alignItems: 'center',
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onDone}
            hitSlop={10}
            style={{ alignSelf: 'flex-end' }}
          >
            <Ionicons name="close" size={s(18)} color={theme.colors.tertiaryText} />
          </Pressable>
          <View
            style={{
              width: s(64),
              height: s(64),
              borderRadius: s(32),
              backgroundColor: '#22C55E',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: s(6),
            }}
          >
            <Ionicons name="checkmark" size={s(34)} color="#fff" />
          </View>
          <Text
            style={{
              marginTop: s(16),
              fontSize: fs(18),
              fontWeight: '700',
              color: theme.colors.brandButton || colors.brand,
              textAlign: 'center',
            }}
          >
            Deleted Successfully
          </Text>
          <Text
            style={{
              marginTop: s(8),
              fontSize: fs(11),
              color: theme.colors.secondaryText,
              textAlign: 'center',
            }}
          >
            Treatment Deleted Successfully
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onDone}
            style={{
              marginTop: s(20),
              height: s(44),
              minWidth: s(180),
              paddingHorizontal: s(22),
              borderRadius: 999,
              backgroundColor: theme.colors.brandButton || colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: fs(13), fontWeight: '600' }}>
              Back To Treatments
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ModalActions({ busy, onCancel, onSave, saveLabel = 'Save' }) {
  return (
    <View style={{ marginTop: s(12) }}>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onSave}
        style={{
          height: s(46),
          borderRadius: 999,
          backgroundColor: theme.colors.brandButton || colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: fs(13), fontWeight: '600' }}>{saveLabel}</Text>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onCancel}
        style={{
          height: s(46),
          borderRadius: 999,
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: '#E8E0D8',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: s(10),
        }}
      >
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(13), fontWeight: '500' }}>
          Cancel
        </Text>
      </Pressable>
    </View>
  );
}

export default function TreatmentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const topPad = useTopPadding(14);
  const seed = route.params?.treatment || null;
  const treatmentId = route.params?.treatmentId || seed?.id;
  const departments = route.params?.departments?.length
    ? route.params.departments
    : DEFAULT_DEPARTMENTS;

  const [item, setItem] = useState(seed);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletedOk, setDeletedOk] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [infoOpen, setInfoOpen] = useState(false);
  const [doctorsOpen, setDoctorsOpen] = useState(false);
  const [basicOpen, setBasicOpen] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const [sectionError, setSectionError] = useState('');

  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [sessions, setSessions] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentPickerOpen, setDepartmentPickerOpen] = useState(false);

  const [doctorOptions, setDoctorOptions] = useState([]);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState([]);

  const [basicName, setBasicName] = useState('');
  const [basicDescription, setBasicDescription] = useState('');

  useEffect(() => {
    if (route.params?.treatment) setItem(route.params.treatment);
  }, [route.params?.treatment, route.params?.refreshedAt]);

  useEffect(() => {
    if (!treatmentId) return undefined;
    let alive = true;
    fetchManagerTreatment(treatmentId)
      .then((next) => {
        if (alive && next) setItem(next);
      })
      .catch((err) => {
        if (alive && !seed) setError(clinicErrorMessage(err));
      });
    return () => {
      alive = false;
    };
  }, [treatmentId, seed, route.params?.refreshedAt]);

  useEffect(() => {
    let alive = true;
    fetchManagerDoctors()
      .then((data) => {
        if (!alive) return;
        setDoctorOptions(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (alive) setDoctorOptions([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const active = String(item?.status || 'active').toLowerCase() === 'active';
  const imageSource = item?.imageUri ? { uri: item.imageUri } : treatmentDetailImage;
  const doctors = useMemo(() => {
    const list = Array.isArray(item?.doctors) ? [...item.doctors] : [];
    const specialty = item?.departmentLabel
      ? `${item.departmentLabel} Treatment`
      : 'Laser Treatment';
    while (list.length < 2) {
      const index = list.length + 1;
      list.push({
        id: `local-doc-${index}`,
        name: 'Dr. Ahmed Khan',
        specialty,
        specialtyLabel: specialty,
      });
    }
    return list.slice(0, 2).map((doctor, index) => ({
      ...doctor,
      id: doctor.id || `local-doc-${index + 1}`,
      specialtyLabel:
        doctor.specialtyLabel ||
        (item?.departmentLabel ? `${item.departmentLabel} Treatment` : doctor.specialty),
    }));
  }, [item]);

  const departmentTitle =
    item?.departmentTitle ||
    `${String(item?.departmentLabel || item?.category || 'Treatment').split(/\s+/)[0]} Department`;

  function openInfoEditor() {
    setMenuOpen(false);
    setSectionError('');
    setPrice(item?.price != null ? String(item.price) : '');
    setDuration(item?.duration || item?.durationLabel || '');
    setSessions(item?.sessions != null ? String(item.sessions) : '12');
    setDepartment(item?.department || item?.category || '');
    setDepartmentPickerOpen(false);
    setInfoOpen(true);
  }

  function openDoctorsEditor() {
    setMenuOpen(false);
    setSectionError('');
    const currentIds = (item?.doctors || [])
      .map((doctor) => doctor.id)
      .filter((id) => id && !String(id).startsWith('local-doc') && !String(id).startsWith('doc-fallback'));
    const fallbackIds = (doctorOptions || []).slice(0, 2).map((doctor) => doctor.id);
    setSelectedDoctorIds((currentIds.length ? currentIds : fallbackIds).slice(0, 2));
    setDoctorsOpen(true);
  }

  function openBasicEditor() {
    setMenuOpen(false);
    setSectionError('');
    setBasicName(item?.name || '');
    setBasicDescription(item?.description || '');
    setBasicOpen(true);
  }

  function toggleDoctor(id) {
    setSelectedDoctorIds((prev) => {
      if (prev.includes(id)) return prev.filter((value) => value !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  async function saveInfo() {
    if (!item?.id || savingSection) return;
    const priceNumber = Number(String(price).replace(/,/g, '').trim());
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setSectionError('Enter a valid price.');
      return;
    }
    if (!String(duration).trim()) {
      setSectionError('Enter treatment duration.');
      return;
    }
    if (!String(department).trim()) {
      setSectionError('Select a department.');
      return;
    }
    setSavingSection(true);
    setSectionError('');
    try {
      const saved = await updateManagerTreatment(item.id, {
        name: item.name,
        description: item.description || '',
        price: priceNumber,
        duration: String(duration).trim(),
        sessions: Number(String(sessions).replace(/,/g, '').trim()) || 12,
        department: department.trim(),
        category: department.trim(),
        session: item.session || item.unit || 'Per Session',
        doctorIds: item.doctorIds || undefined,
        imageUri: item.imageUri || null,
      });
      setItem(saved);
      setInfoOpen(false);
    } catch (err) {
      setSectionError(clinicErrorMessage(err) || 'Could not save treatment information.');
    } finally {
      setSavingSection(false);
    }
  }

  async function saveDoctors() {
    if (!item?.id || savingSection) return;
    if (selectedDoctorIds.length < 1) {
      setSectionError('Select at least one doctor.');
      return;
    }
    setSavingSection(true);
    setSectionError('');
    try {
      const saved = await updateManagerTreatment(item.id, {
        name: item.name,
        description: item.description || '',
        price: item.price,
        duration: item.duration,
        sessions: item.sessions,
        department: item.department || item.category,
        category: item.category || item.department,
        session: item.session || item.unit || 'Per Session',
        doctorIds: selectedDoctorIds.slice(0, 2),
        imageUri: item.imageUri || null,
      });
      setItem(saved);
      setDoctorsOpen(false);
    } catch (err) {
      setSectionError(clinicErrorMessage(err) || 'Could not save doctors.');
    } finally {
      setSavingSection(false);
    }
  }

  async function saveBasic() {
    if (!item?.id || savingSection) return;
    if (!basicName.trim()) {
      setSectionError('Enter a treatment name.');
      return;
    }
    setSavingSection(true);
    setSectionError('');
    try {
      const saved = await updateManagerTreatment(item.id, {
        name: basicName.trim(),
        description: basicDescription.trim(),
        price: item.price,
        duration: item.duration,
        sessions: item.sessions,
        department: item.department || item.category,
        category: item.category || item.department,
        session: item.session || item.unit || 'Per Session',
        doctorIds: item.doctorIds || undefined,
        imageUri: item.imageUri || null,
      });
      setItem(saved);
      setBasicOpen(false);
    } catch (err) {
      setSectionError(clinicErrorMessage(err) || 'Could not save treatment.');
    } finally {
      setSavingSection(false);
    }
  }

  async function onConfirmDelete() {
    if (!item?.id || deleting) return;
    setDeleting(true);
    setError('');
    try {
      await deleteManagerTreatment(item.id);
      setConfirmDelete(false);
      setDeletedOk(true);
    } catch (err) {
      setConfirmDelete(false);
      setError(clinicErrorMessage(err) || 'Could not delete treatment.');
    } finally {
      setDeleting(false);
    }
  }

  function backToTreatments() {
    setDeletedOk(false);
    navigation.navigate({
      name: 'ManagerTabs',
      params: {
        screen: 'TreatmentsTab',
        params: { refreshedAt: Date.now() },
      },
      merge: true,
    });
  }

  function onCancel() {
    navigation.goBack();
  }

  function onSave() {
    navigation.goBack();
  }

  const doctorPickerList = doctorOptions.length
    ? doctorOptions
    : doctors.filter((doctor) => !String(doctor.id).startsWith('local-doc'));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.page }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: s(40),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 20 }}>
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
              Treatment Detail
            </Text>
            <View style={{ position: 'relative' }}>
              <IconCircleButton
                name="ellipsis-vertical"
                accessibilityLabel="More options"
                onPress={() => setMenuOpen((open) => !open)}
              />
              {menuOpen ? (
                <View
                  style={{
                    position: 'absolute',
                    top: s(42),
                    right: 0,
                    width: s(120),
                    backgroundColor: theme.colors.card,
                    borderRadius: s(12),
                    paddingVertical: s(6),
                    shadowColor: '#000',
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                    zIndex: 30,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={openBasicEditor}
                    style={{ paddingHorizontal: s(16), paddingVertical: s(10) }}
                  >
                    <Text style={{ fontSize: fs(12), fontWeight: '600', color: theme.colors.text }}>
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                    style={{ paddingHorizontal: s(16), paddingVertical: s(10) }}
                  >
                    <Text style={{ fontSize: fs(12), fontWeight: '600', color: colors.danger }}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          {error ? (
            <Text style={{ color: colors.danger, fontSize: fs(11), marginTop: s(16), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          {item ? (
            <>
              <Pressable onPress={() => menuOpen && setMenuOpen(false)}>
                <View
                  style={{
                    marginTop: s(18),
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, paddingRight: s(12) }}>
                    <Text style={{ fontSize: fs(18), fontWeight: '700', color: theme.colors.text }}>
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        marginTop: s(4),
                        fontSize: fs(11),
                        color: theme.colors.secondaryText,
                      }}
                    >
                      {departmentTitle}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: active ? '#E7F6EC' : colors.warningBg,
                      borderRadius: 999,
                      paddingHorizontal: s(12),
                      paddingVertical: s(6),
                      marginTop: s(2),
                    }}
                  >
                    <Text
                      style={{
                        color: active ? '#2F9E5B' : colors.brand,
                        fontSize: fs(10),
                        fontWeight: '700',
                      }}
                    >
                      {active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <Image
                  source={imageSource}
                  contentFit="cover"
                  style={{
                    width: '100%',
                    height: s(168),
                    borderRadius: s(16),
                    marginTop: s(14),
                    backgroundColor: '#EFE7DF',
                  }}
                />

                {item.description ? (
                  <Text
                    style={{
                      marginTop: s(12),
                      color: theme.colors.secondaryText,
                      fontSize: fs(11),
                      lineHeight: fs(16),
                    }}
                  >
                    {item.description}
                  </Text>
                ) : null}

                <View style={{ marginTop: s(18) }}>
                  <SectionHeader title="Treatment Information" onEdit={openInfoEditor} />
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                    }}
                  >
                    <InfoTile
                      icon="cash-outline"
                      value={item.priceLabel || `${item.currency || 'AED'} ${item.price ?? '—'}`}
                      label="Price per Session"
                    />
                    <InfoTile
                      icon="time-outline"
                      value={item.durationLabel || `${item.durationMin || 30} min`}
                      label="Duration"
                    />
                    <InfoTile
                      icon="people-outline"
                      value={String(item.sessions ?? 12)}
                      label="Sessions"
                    />
                    <InfoTile
                      icon="business-outline"
                      value={item.departmentLabel || String(item.category || '—').split(/\s+/)[0]}
                      label="Department"
                    />
                  </View>
                </View>

                <View style={{ marginTop: s(14) }}>
                  <SectionHeader title="Doctors Providing This Treatment" onEdit={openDoctorsEditor} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {doctors.map((doctor) => (
                      <DoctorCard key={doctor.id} doctor={doctor} />
                    ))}
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={onSave}
                  style={{
                    height: s(48),
                    borderRadius: 999,
                    backgroundColor: theme.colors.brandButton || colors.brand,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: s(26),
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: fs(14), fontWeight: '600' }}>Save Changes</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={onCancel}
                  style={{
                    height: s(48),
                    borderRadius: 999,
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: '#E8E0D8',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: s(12),
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.brandButton || colors.brand,
                      fontSize: fs(14),
                      fontWeight: '500',
                    }}
                  >
                    Cancel Changes
                  </Text>
                </Pressable>
              </Pressable>
            </>
          ) : (
            <View style={{ alignItems: 'center', marginTop: s(40) }}>
              <Ionicons name="sparkles-outline" size={s(28)} color={colors.muted} />
              <Text style={{ color: colors.desc, fontSize: fs(11), marginTop: 8 }}>Loading treatment…</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <ModalShell
        visible={infoOpen}
        title="Edit Treatment Information"
        onClose={() => !savingSection && setInfoOpen(false)}
        footer={
          <ModalActions
            busy={savingSection}
            onCancel={() => setInfoOpen(false)}
            onSave={saveInfo}
            saveLabel="Save Information"
          />
        }
      >
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(11), marginBottom: s(14) }}>
          Update only the treatment details shown in this section.
        </Text>
        <FieldLabel>Price ({item?.currency || 'AED'})</FieldLabel>
        <RoundedField value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="e.g. 500" />
        <View style={{ height: s(14) }} />
        <FieldLabel>Duration</FieldLabel>
        <RoundedField value={duration} onChangeText={setDuration} placeholder="e.g. 30 Minutes" />
        <View style={{ height: s(14) }} />
        <FieldLabel>Sessions</FieldLabel>
        <RoundedField value={sessions} onChangeText={setSessions} keyboardType="number-pad" placeholder="e.g. 12" />
        <View style={{ height: s(14) }} />
        <FieldLabel>Department</FieldLabel>
        <Pressable
          accessibilityRole="button"
          onPress={() => setDepartmentPickerOpen((open) => !open)}
          style={{
            minHeight: s(46),
            borderRadius: 999,
            backgroundColor: theme.colors.card,
            paddingHorizontal: s(16),
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: fs(12), color: department ? theme.colors.text : theme.colors.tertiaryText }}>
            {department || 'Select department'}
          </Text>
        </Pressable>
        {departmentPickerOpen ? (
          <View
            style={{
              marginTop: s(8),
              backgroundColor: theme.colors.card,
              borderRadius: s(14),
              overflow: 'hidden',
            }}
          >
            {departments.map((label, index) => {
              const selected = department === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => {
                    setDepartment(label);
                    setDepartmentPickerOpen(false);
                  }}
                  style={{
                    paddingHorizontal: s(14),
                    paddingVertical: s(12),
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: theme.colors.border,
                    backgroundColor: selected ? colors.brandSoft : theme.colors.card,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fs(12),
                      fontWeight: selected ? '700' : '500',
                      color: theme.colors.text,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {sectionError && infoOpen ? (
          <Text style={{ color: colors.danger, fontSize: fs(11), marginTop: s(12), textAlign: 'center' }}>
            {sectionError}
          </Text>
        ) : null}
      </ModalShell>

      <ModalShell
        visible={doctorsOpen}
        title="Edit Doctors"
        onClose={() => !savingSection && setDoctorsOpen(false)}
        footer={
          <ModalActions
            busy={savingSection}
            onCancel={() => setDoctorsOpen(false)}
            onSave={saveDoctors}
            saveLabel="Save Doctors"
          />
        }
      >
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(11), marginBottom: s(14) }}>
          Choose up to 2 doctors who provide this treatment.
        </Text>
        {(doctorPickerList.length ? doctorPickerList : doctors).map((doctor) => {
          const selected = selectedDoctorIds.includes(doctor.id);
          return (
            <Pressable
              key={doctor.id}
              accessibilityRole="button"
              onPress={() => toggleDoctor(doctor.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.card,
                borderRadius: s(14),
                padding: s(12),
                marginBottom: s(10),
                borderWidth: selected ? 1.5 : 1,
                borderColor: selected ? theme.colors.brandButton || colors.brand : theme.colors.border,
              }}
            >
              <Image
                source={treatmentDoctorImage}
                contentFit="cover"
                style={{
                  width: s(44),
                  height: s(44),
                  borderRadius: s(22),
                  backgroundColor: '#E8D5C4',
                  marginRight: s(12),
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(12), fontWeight: '700', color: theme.colors.text }}>
                  {doctor.name}
                </Text>
                <Text style={{ fontSize: fs(10), color: theme.colors.secondaryText, marginTop: 2 }}>
                  {doctor.specialty || doctor.specialtyLabel || 'Specialist'}
                </Text>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={s(20)}
                color={selected ? theme.colors.brandButton || colors.brand : theme.colors.tertiaryText}
              />
            </Pressable>
          );
        })}
        {sectionError && doctorsOpen ? (
          <Text style={{ color: colors.danger, fontSize: fs(11), marginTop: s(4), textAlign: 'center' }}>
            {sectionError}
          </Text>
        ) : null}
      </ModalShell>

      <ModalShell
        visible={basicOpen}
        title="Edit Treatment"
        onClose={() => !savingSection && setBasicOpen(false)}
        footer={
          <ModalActions
            busy={savingSection}
            onCancel={() => setBasicOpen(false)}
            onSave={saveBasic}
            saveLabel="Save"
          />
        }
      >
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(11), marginBottom: s(14) }}>
          Update the treatment name and short description.
        </Text>
        <FieldLabel>Treatment Name</FieldLabel>
        <RoundedField value={basicName} onChangeText={setBasicName} placeholder="Treatment name" />
        <View style={{ height: s(14) }} />
        <FieldLabel>Treatment Description</FieldLabel>
        <RoundedField
          value={basicDescription}
          onChangeText={setBasicDescription}
          placeholder="Short description"
          multiline
        />
        {sectionError && basicOpen ? (
          <Text style={{ color: colors.danger, fontSize: fs(11), marginTop: s(12), textAlign: 'center' }}>
            {sectionError}
          </Text>
        ) : null}
      </ModalShell>

      <ConfirmDeleteModal
        visible={confirmDelete}
        busy={deleting}
        onClose={() => !deleting && setConfirmDelete(false)}
        onConfirm={onConfirmDelete}
      />
      <DeletedSuccessModal visible={deletedOk} onDone={backToTreatments} />
    </View>
  );
}
