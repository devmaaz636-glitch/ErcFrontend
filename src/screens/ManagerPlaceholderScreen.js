import { View } from 'react-native';
import Text from '../components/AppText';
import { colors } from '../theme';

export default function ManagerPlaceholderScreen({ route }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700' }}>
        {route.params?.title || 'Coming soon'}
      </Text>
      <Text style={{ color: colors.desc, marginTop: 8 }}>This manager screen is being prepared.</Text>
    </View>
  );
}
