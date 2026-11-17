import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './AppText';
import { getPatientClinic, listPatientClinics, PATIENT_CLINIC_CATALOG } from '../lib/patientClinic';
import { colors, shadows } from '../theme';
import { fs, scale as s } from '../utils/responsive';

const BRAND = '#BF824F';
const EASE = Easing.out(Easing.cubic);

const REGION_META = {
  UAE: { flag: '🇦🇪', label: 'United Arab Emirates', hint: 'Dubai & Abu Dhabi clinics' },
  KSA: { flag: '🇸🇦', label: 'Saudi Arabia', hint: 'Riyadh clinic' },
  Oman: { flag: '🇴🇲', label: 'Oman', hint: 'Muscat clinic' },
  Pakistan: { flag: '🇵🇰', label: 'Pakistan', hint: 'Islamabad clinic' },
  USA: { flag: '🇺🇸', label: 'United States', hint: 'FL, TX & NJ clinics' },
};

const REGION_ORDER = ['UAE', 'KSA', 'Oman', 'Pakistan', 'USA'];

function StepDots({ step }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(8) }}>
      {[0, 1].map((index) => (
        <View
          key={index}
          style={{
            width: index === step ? s(16) : s(6),
            height: s(6),
            borderRadius: 999,
            marginRight: s(5),
            backgroundColor: index === step ? BRAND : '#E5DDD4',
          }}
        />
      ))}
      <Text style={{ marginLeft: s(4), fontSize: fs(10), color: colors.desc }}>
        Step {step + 1} of 2
      </Text>
    </View>
  );
}

export default function PatientRegionPickerModal({ visible, user, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const current = useMemo(() => getPatientClinic(user), [user]);
  const [step, setStep] = useState(0); // 0 = location, 1 = clinic
  const [selectedRegion, setSelectedRegion] = useState(null);

  const regions = useMemo(
    () =>
      REGION_ORDER.map((region) => ({
        region,
        meta: REGION_META[region],
        count: PATIENT_CLINIC_CATALOG.filter((item) => item.region === region).length,
      })),
    []
  );

  const clinics = useMemo(
    () => (selectedRegion ? listPatientClinics(selectedRegion) : []),
    [selectedRegion]
  );

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 260 : 180,
      easing: EASE,
    });
    if (visible) {
      setStep(0);
      setSelectedRegion(current?.region || null);
    }
  }, [visible, progress, current?.region]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.45,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 36 }],
    opacity: 0.35 + progress.value * 0.65,
  }));

  function handleClose() {
    setStep(0);
    onClose?.();
  }

  function handlePickRegion(region) {
    setSelectedRegion(region);
    setStep(1);
  }

  function handlePickClinic(clinic) {
    onSelect?.(clinic);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#1A1410',
            },
            backdropStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} accessibilityLabel="Dismiss" />
        </Animated.View>

        <Animated.View
          style={[
            {
              marginHorizontal: s(14),
              marginBottom: Math.max(insets.bottom, s(14)),
              backgroundColor: colors.card,
              borderRadius: 24,
              maxHeight: '78%',
              overflow: 'hidden',
              ...shadows.tabBar,
            },
            sheetStyle,
          ]}
        >
          <View style={{ alignItems: 'center', paddingTop: s(10), paddingBottom: s(4) }}>
            <View
              style={{
                width: s(40),
                height: s(4),
                borderRadius: 999,
                backgroundColor: '#E5DDD4',
              }}
            />
          </View>

          <View
            style={{
              paddingHorizontal: s(16),
              paddingBottom: s(10),
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            {step === 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to locations"
                onPress={() => setStep(0)}
                hitSlop={8}
                style={{
                  width: s(32),
                  height: s(32),
                  borderRadius: s(16),
                  backgroundColor: colors.brandSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: s(10),
                  marginTop: 2,
                }}
              >
                <Ionicons name="chevron-back" size={s(16)} color={BRAND} />
              </Pressable>
            ) : null}

            <View style={{ flex: 1, paddingRight: s(8) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }}>
                {step === 0 ? 'Select your location' : 'Choose your clinic'}
              </Text>
              <Text style={{ marginTop: 4, fontSize: fs(11), color: colors.desc }}>
                {step === 0
                  ? 'Pick your region first — then we’ll show nearby clinics'
                  : `${REGION_META[selectedRegion]?.flag || ''} ${REGION_META[selectedRegion]?.label || selectedRegion} clinics`}
              </Text>
              <StepDots step={step} />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={handleClose}
              hitSlop={8}
              style={{
                width: s(32),
                height: s(32),
                borderRadius: s(16),
                backgroundColor: colors.brandSoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              <Ionicons name="close" size={s(16)} color={BRAND} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: s(14), paddingBottom: s(18) }}
          >
            {step === 0 ? (
              <Animated.View key="regions" entering={FadeInRight.duration(180)} exiting={FadeOutLeft.duration(120)}>
                {regions.map((item) => {
                  const active = (selectedRegion || current?.region) === item.region;
                  return (
                    <Pressable
                      key={item.region}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => handlePickRegion(item.region)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: active ? colors.brandSoft : colors.background,
                        borderRadius: 16,
                        padding: s(14),
                        marginBottom: s(10),
                        borderWidth: 1,
                        borderColor: active ? 'rgba(191,130,79,0.35)' : 'rgba(26,20,16,0.05)',
                      }}
                    >
                      <View
                        style={{
                          width: s(42),
                          height: s(42),
                          borderRadius: s(21),
                          backgroundColor: colors.card,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: fs(20) }}>{item.meta.flag}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
                        <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
                          {item.region}
                        </Text>
                        <Text style={{ marginTop: 3, fontSize: fs(11), color: colors.desc }}>
                          {item.meta.label}
                        </Text>
                        <Text style={{ marginTop: 2, fontSize: fs(10), color: colors.muted }}>
                          {item.count} clinic{item.count === 1 ? '' : 's'} · {item.meta.hint}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={s(16)} color={BRAND} />
                    </Pressable>
                  );
                })}
              </Animated.View>
            ) : (
              <Animated.View key="clinics" entering={FadeInRight.duration(180)} exiting={FadeOutLeft.duration(120)}>
                {clinics.map((clinic) => {
                  const checked = current?.id === clinic.id;
                  return (
                    <Pressable
                      key={clinic.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: checked }}
                      onPress={() => handlePickClinic(clinic)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: checked ? colors.brandSoft : colors.background,
                        borderRadius: 16,
                        padding: s(14),
                        marginBottom: s(10),
                        borderWidth: 1,
                        borderColor: checked ? 'rgba(191,130,79,0.35)' : 'rgba(26,20,16,0.05)',
                      }}
                    >
                      <View
                        style={{
                          width: s(42),
                          height: s(42),
                          borderRadius: s(21),
                          backgroundColor: checked ? '#F6E6D6' : colors.card,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name="business-outline"
                          size={s(18)}
                          color={checked ? BRAND : colors.muted}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
                        <Text
                          style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }}
                          numberOfLines={2}
                        >
                          {clinic.name}
                        </Text>
                        <Text
                          style={{ marginTop: 4, fontSize: fs(11), color: colors.desc }}
                          numberOfLines={2}
                        >
                          {clinic.address}
                        </Text>
                        <Text style={{ marginTop: 4, fontSize: fs(10), color: colors.muted }} numberOfLines={1}>
                          {clinic.phone}
                          {clinic.email ? ` · ${clinic.email}` : ''}
                        </Text>
                        <Text style={{ marginTop: 3, fontSize: fs(10), color: BRAND, fontWeight: '600' }}>
                          {clinic.city}
                        </Text>
                      </View>
                      {checked ? (
                        <Ionicons name="checkmark-circle" size={s(22)} color={BRAND} />
                      ) : (
                        <View
                          style={{
                            width: s(20),
                            height: s(20),
                            borderRadius: s(10),
                            borderWidth: 1.5,
                            borderColor: '#D8CFC5',
                          }}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
