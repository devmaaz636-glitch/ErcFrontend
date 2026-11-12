import { StatusBar } from 'expo-status-bar';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { NotificationBellButton } from '../components/ui';
import { useSession, roleLabel } from '../context/SessionContext';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

export default function PatientHomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user } = useSession();

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
                Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </Text>
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 3 }}>
                {roleLabel(user?.role) || 'Patient'} · Book and track your care
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
            <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink }}>
              Welcome to Enfield Royal Clinics
            </Text>
            <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8, lineHeight: 16 }}>
              Your patient account is ready. Appointments, treatments, and booking flows will
              appear here next.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
