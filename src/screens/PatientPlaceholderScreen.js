import { StatusBar } from 'expo-status-bar';
import { ScrollView, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { NotificationBellButton } from '../components/ui';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const COPY = {
  AppointmentsTab: {
    title: 'Appointments',
    body: 'Your upcoming and past appointments will appear here.',
  },
  TreatmentsTab: {
    title: 'Treatments',
    body: 'Browse clinic treatments and request bookings from this tab.',
  },
  AboutTab: {
    title: 'About Us',
    body: 'Learn about Enfield Royal Clinics, branches, and care standards.',
  },
};

export default function PatientPlaceholderScreen() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const meta = COPY[route.name] || {
    title: route.name,
    body: 'Patient content for this tab will be designed next.',
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + spacing.tabBarClearance,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink }}>
                {meta.title}
              </Text>
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 3 }}>
                Patient workspace
              </Text>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          <View
            style={{
              marginTop: s(22),
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: s(16),
            }}
          >
            <Text style={{ fontSize: fs(13), color: colors.desc, lineHeight: 18 }}>{meta.body}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
