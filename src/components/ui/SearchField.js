import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { scale as s, fs } from '../../utils/responsive';

export default function SearchField({
  value,
  onChangeText,
  placeholder = 'Search Here',
  showButton = true,
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: Math.max(44, s(46)),
        borderRadius: radius.round,
        backgroundColor: colors.card,
        paddingLeft: s(18),
        paddingRight: showButton ? 6 : s(14),
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedBrand}
        maxFontSizeMultiplier={1.2}
        style={{ flex: 1, fontSize: fs(12), color: colors.ink, paddingVertical: 0 }}
      />
      {showButton ? (
        <View
          style={{
            width: s(34),
            height: s(34),
            borderRadius: s(17),
            backgroundColor: colors.fieldAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="search" size={s(16)} color={colors.brand} />
        </View>
      ) : (
        <Ionicons name="search" size={s(18)} color={colors.desc} />
      )}
    </View>
  );
}
