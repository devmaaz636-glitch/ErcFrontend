import { Pressable, View } from 'react-native';
import Text from '../AppText';
import { colors } from '../../theme';
import { scale as s, fs } from '../../utils/responsive';

export default function SectionHeader({ title, large, actionLabel = 'See All', onAction }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: s(22),
        marginBottom: s(10),
      }}
    >
      <Text style={{ flex: 1, fontSize: fs(large ? 18 : 16), fontWeight: '700', color: colors.ink }}>
        {title}
      </Text>
      {onAction ? (
        <Pressable hitSlop={10} onPress={onAction}>
          <Text style={{ fontSize: fs(11), color: colors.mutedBrand }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
