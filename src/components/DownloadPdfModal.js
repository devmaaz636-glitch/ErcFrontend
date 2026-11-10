import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { PrimaryButton } from './ui';
import { colors } from '../theme';
import { fs, scale as s } from '../utils/responsive';

/**
 * Stylish confirm modal before saving an appointment PDF to the device.
 */
export default function DownloadPdfModal({
  visible,
  onClose,
  onDownload,
  loading = false,
  fileName = 'Appointment Details.Pdf',
  subtitle = 'Save this appointment record to your device.',
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        onPress={loading ? undefined : onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(31, 27, 22, 0.48)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: s(24),
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: colors.card,
            borderRadius: 22,
            paddingHorizontal: s(18),
            paddingTop: s(22),
            paddingBottom: s(18),
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: s(64),
              height: s(64),
              borderRadius: s(32),
              backgroundColor: colors.brandSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: s(14),
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.brand} size="large" />
            ) : (
              <Ionicons name="document-text-outline" size={s(28)} color={colors.brand} />
            )}
          </View>

          <Text
            style={{
              color: colors.ink,
              fontSize: fs(16),
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            Download PDF
          </Text>
          <Text
            style={{
              color: colors.desc,
              fontSize: fs(11),
              textAlign: 'center',
              marginTop: s(6),
              lineHeight: fs(16),
            }}
          >
            {subtitle}
          </Text>

          <View
            style={{
              width: '100%',
              marginTop: s(16),
              marginBottom: s(6),
              backgroundColor: colors.background,
              borderRadius: 14,
              paddingVertical: s(12),
              paddingHorizontal: s(12),
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: s(36),
                height: s(40),
                borderRadius: 6,
                backgroundColor: colors.dangerBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: s(10),
              }}
            >
              <Text style={{ color: colors.danger, fontSize: fs(8), fontWeight: '700' }}>PDF</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600' }} numberOfLines={1}>
                {fileName}
              </Text>
              <Text style={{ color: colors.desc, fontSize: fs(9), marginTop: 2 }}>
                Includes patient, doctor, treatment & schedule
              </Text>
            </View>
          </View>

          <PrimaryButton
            label={loading ? 'Downloading…' : 'Download To Device'}
            onPress={onDownload}
            loading={loading}
            disabled={loading}
            size="sm"
            style={{ marginTop: s(12), width: '100%' }}
          />

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={onClose}
            hitSlop={8}
            style={{ marginTop: s(12), paddingVertical: s(6) }}
          >
            <Text style={{ color: colors.desc, fontSize: fs(12), fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
