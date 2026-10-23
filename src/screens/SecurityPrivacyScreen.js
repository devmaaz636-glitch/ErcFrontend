import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = '#BF824F';
const INK = '#1F1B16';
const MUTED = '#8D8680';
const BG = '#FFF8F1';

export default function SecurityPrivacyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const email = route.params?.email || route.params?.user?.email || '';
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function startChangePassword() {
    navigation.navigate('ForgotPassword', {
      email,
      from: 'security',
      headerTitle: 'Edit Profile',
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
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
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            alignItems: 'center',
          }}
        >
          <View style={{ width: '100%', maxWidth: 480 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={() => navigation.goBack()}
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
                Edit Profile
              </Text>

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
            </View>

            <Text
              style={{
                fontSize: fs(14),
                fontWeight: '700',
                color: INK,
                marginTop: s(28),
                marginBottom: s(8),
              }}
            >
              Password
            </Text>
            <View
              style={{
                height: s(52),
                borderRadius: 14,
                backgroundColor: '#fff',
                paddingHorizontal: s(14),
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="debra.holt@example.com"
                placeholderTextColor="#B0A89F"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                allowFontScaling={false}
                style={{ flex: 1, fontSize: fs(14), color: INK, paddingVertical: 0 }}
              />
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setShowPassword((current) => !current)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={s(18)}
                  color={MUTED}
                />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={startChangePassword}
              style={{
                height: s(52),
                borderRadius: 999,
                backgroundColor: BROWN,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: s(18),
              }}
            >
              <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>
                Change Password
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
