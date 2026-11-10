import { Modal, Pressable, ScrollView, View } from 'react-native';
import Text from './AppText';
import { PrimaryButton } from './ui';
import { colors } from '../theme';
import { fs, scale as s } from '../utils/responsive';

const DEFAULT_ALLERGIES = ['Penicillin', 'Penicillin', 'Penicillin', 'Penicillin', 'Penicillin'];
const DEFAULT_MEDICATIONS = Array.from({ length: 7 }, () => ({
  name: 'Current Medication',
  frequency: 'Weekly',
}));

/**
 * Doctor Appointment Detail — Medical Alerts popup.
 * Labels left / values right; global brand CTA.
 */
export default function MedicalAlertsModal({
  visible,
  onClose,
  allergies = DEFAULT_ALLERGIES,
  medications = DEFAULT_MEDICATIONS,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: s(22),
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: colors.card,
            borderRadius: 18,
            paddingHorizontal: s(16),
            paddingTop: s(18),
            paddingBottom: s(16),
          }}
        >
          <Text style={{ color: colors.ink, fontSize: fs(14), fontWeight: '700' }}>Allergies</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: s(10), paddingBottom: s(4), gap: s(8) }}
          >
            {allergies.map((label, index) => (
              <View
                key={`${label}-${index}`}
                style={{
                  backgroundColor: colors.dangerBg,
                  borderRadius: 999,
                  paddingHorizontal: s(12),
                  paddingVertical: s(6),
                }}
              >
                <Text style={{ color: colors.danger, fontSize: fs(10), fontWeight: '600' }}>
                  {label}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Text
            style={{
              color: colors.ink,
              fontSize: fs(14),
              fontWeight: '700',
              marginTop: s(16),
              marginBottom: s(8),
            }}
          >
            Medications
          </Text>
          {medications.map((row, index) => (
            <View
              key={`${row.name}-${index}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: s(7),
              }}
            >
              <Text style={{ color: colors.desc, fontSize: fs(11), flex: 1, marginRight: s(12) }}>
                {row.name}
              </Text>
              <Text style={{ color: colors.desc, fontSize: fs(11) }}>{row.frequency}</Text>
            </View>
          ))}

          <PrimaryButton
            label="Back To Details"
            onPress={onClose}
            size="sm"
            style={{ marginTop: s(14), width: '100%', alignSelf: 'center' }}
          />
        </View>
      </Pressable>
    </Modal>
  );
}
