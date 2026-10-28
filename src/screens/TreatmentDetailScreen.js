import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { clinicErrorMessage, fetchManagerTreatment } from '../lib/clinic';
import { colors, spacing, managerDashboard as theme } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const treatmentImage = require('../../assets/treatmentimage.png');

function InfoRow({ label, value, last = false }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: s(10),
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors.secondaryText, fontSize: fs(10) }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: fs(11), fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

export default function TreatmentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const topPad = useTopPadding(16);
  const seed = route.params?.treatment || null;
  const treatmentId = route.params?.treatmentId || seed?.id;
  const [item, setItem] = useState(seed);
  const [error, setError] = useState('');

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
  }, [treatmentId, seed]);

  const active = String(item?.status || 'active').toLowerCase() === 'active';
  const imageSource = item?.imageUri ? { uri: item.imageUri } : treatmentImage;

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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: theme.colors.text }}>
                Treatment Details
              </Text>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          {error ? (
            <Text style={{ color: colors.danger, fontSize: fs(11), marginTop: s(16), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          {item ? (
            <>
              <View
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: s(16),
                  padding: s(16),
                  marginTop: s(20),
                  alignItems: 'center',
                }}
              >
                <Image
                  source={imageSource}
                  contentFit="cover"
                  style={{
                    width: s(88),
                    height: s(88),
                    borderRadius: s(44),
                    backgroundColor: colors.brandSoft,
                  }}
                />
                <Text
                  style={{
                    marginTop: s(14),
                    fontSize: fs(16),
                    fontWeight: '700',
                    color: theme.colors.text,
                    textAlign: 'center',
                  }}
                >
                  {item.name}
                </Text>
                {item.description ? (
                  <Text
                    style={{
                      marginTop: s(8),
                      fontSize: fs(11),
                      color: theme.colors.secondaryText,
                      textAlign: 'center',
                      lineHeight: fs(16),
                      paddingHorizontal: s(8),
                    }}
                  >
                    {item.description}
                  </Text>
                ) : null}
                <View
                  style={{
                    marginTop: s(8),
                    backgroundColor: active ? colors.successBg : colors.warningBg,
                    borderRadius: s(8),
                    paddingHorizontal: s(10),
                    paddingVertical: s(4),
                  }}
                >
                  <Text
                    style={{
                      color: active ? colors.success : colors.brand,
                      fontSize: fs(9),
                      fontWeight: '700',
                    }}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: s(16),
                  paddingHorizontal: s(16),
                  paddingVertical: s(6),
                  marginTop: s(14),
                }}
              >
                <InfoRow label="Category" value={item.category || '—'} />
                <InfoRow label="Duration" value={item.duration || '—'} />
                <InfoRow
                  label="Price"
                  value={item.priceLabel || `${item.currency || ''} ${item.price ?? '—'}`}
                />
                <InfoRow label="Billing" value={item.unit || 'Per Session'} />
                <InfoRow label="Region" value={item.region || '—'} last />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.goBack()}
                style={{
                  height: s(44),
                  borderRadius: 999,
                  backgroundColor: theme.colors.brandButton || colors.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: s(22),
                }}
              >
                <Text style={{ color: '#fff', fontSize: fs(12), fontWeight: '600' }}>Back to Treatments</Text>
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
    </View>
  );
}
