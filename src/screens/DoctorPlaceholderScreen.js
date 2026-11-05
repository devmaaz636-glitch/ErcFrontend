import { View } from 'react-native';
import Text from '../components/AppText';
import { colors } from '../theme';
import { fs, scale as s } from '../utils/responsive';

/** Empty doctor tab — flow filled in later without rewriting navigation. */
export default function DoctorPlaceholderScreen({ route }) {
  const title = route?.params?.title || route?.name?.replace(/Tab$/, '') || 'Coming soon';
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: s(24),
      }}
    >
      <Text style={{ color: colors.ink, fontSize: fs(18), fontWeight: '700', textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ color: colors.desc, fontSize: fs(12), marginTop: s(8), textAlign: 'center' }}>
        This doctor screen will be connected next.
      </Text>
    </View>
  );
}
