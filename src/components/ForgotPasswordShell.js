import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

export const BROWN = '#BF824F';
export const INK = '#1A1614';
export const MUTED = '#8D8680';
export const FIELD = '#FFFFFF';
export const BG = '#FFF8F1';
export const FIELD_MUTED = '#F3EFEA';

export function ClearIcon({ onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Clear" hitSlop={8} onPress={onPress}>
      <Ionicons name="close-circle" size={s(18)} color="#C4BDB6" />
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  showClear,
  onClear,
  trailing,
  maxLength,
}) {
  return (
    <View style={{ marginBottom: s(16) }}>
      <Text style={{ fontSize: fs(14), fontWeight: '700', color: INK, marginBottom: s(8) }}>
        {label}
      </Text>
      <View
        style={{
          height: s(52),
          borderRadius: 14,
          backgroundColor: FIELD,
          paddingHorizontal: s(14),
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B0A89F"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          allowFontScaling={false}
          maxLength={maxLength}
          style={{ flex: 1, fontSize: fs(14), color: INK, paddingVertical: 0 }}
        />
        {showClear && value ? <ClearIcon onPress={onClear} /> : null}
        {trailing}
      </View>
    </View>
  );
}

export function ForgotPasswordShell({
  onBack,
  children,
  footer,
  headerTitle = 'Change Password',
  showHero = true,
  showBell = false,
  backgroundColor = BG,
}) {
  const topPad = useTopPadding(16);

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: topPad,
            paddingHorizontal: s(20),
            paddingBottom: s(40),
            flexGrow: 1,
          }}
        >
          <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(28) }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={onBack}
                style={{
                  width: s(36),
                  height: s(36),
                  borderRadius: s(18),
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={s(18)} color={INK} />
              </Pressable>
              <Text
                style={{
                  flex: 1,
                  marginLeft: s(12),
                  fontSize: fs(16),
                  fontWeight: '700',
                  color: INK,
                }}
                numberOfLines={1}
              >
                {headerTitle}
              </Text>
              {showBell ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  hitSlop={8}
                  style={{
                    width: s(36),
                    height: s(36),
                    borderRadius: s(18),
                    backgroundColor: '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="notifications-outline" size={s(18)} color={BROWN} />
                </Pressable>
              ) : null}
            </View>

            {showHero ? (
              <>
                <Text style={{ fontSize: fs(22), fontWeight: '700', color: INK }}>Forgot Password</Text>
                <Text style={{ marginTop: s(8), fontSize: fs(13), lineHeight: 20, color: MUTED }}>
                  Please enter the email address below to verify your account
                </Text>
              </>
            ) : null}

            <View style={{ marginTop: showHero ? s(28) : 0 }}>{children}</View>
            {footer}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function PrimaryButton({ label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        height: s(52),
        borderRadius: 999,
        backgroundColor: BROWN,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: s(8),
      }}
    >
      <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>{label}</Text>
    </Pressable>
  );
}

export function ErrorText({ message }) {
  if (!message) return null;
  return (
    <Text style={{ color: '#B42318', fontSize: fs(12), marginBottom: s(12) }}>{message}</Text>
  );
}
