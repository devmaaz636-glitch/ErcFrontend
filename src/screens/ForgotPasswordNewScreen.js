import { useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { authErrorMessage, saveNewPassword } from '../lib/auth';
import { passwordProblem } from '../lib/passwordReset';
import {
  BROWN,
  ErrorText,
  Field,
  ForgotPasswordShell,
  MUTED,
  PrimaryButton,
} from '../components/ForgotPasswordShell';
import { scale as s, fs } from '../utils/responsive';

function SuccessModal({ visible, onSignIn }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSignIn}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(26, 22, 20, 0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: s(24),
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: '#fff',
            borderRadius: 24,
            paddingHorizontal: s(22),
            paddingTop: s(18),
            paddingBottom: s(22),
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onSignIn}
            hitSlop={10}
            style={{ alignSelf: 'flex-end' }}
          >
            <Ionicons name="close" size={s(20)} color={MUTED} />
          </Pressable>

          <Text
            style={{
              textAlign: 'center',
              fontSize: fs(18),
              fontWeight: '700',
              color: BROWN,
              marginTop: s(4),
            }}
          >
            Password Updated
          </Text>

          <View
            style={{
              width: s(72),
              height: s(72),
              borderRadius: s(36),
              backgroundColor: '#22C55E',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginTop: s(22),
              marginBottom: s(14),
            }}
          >
            <Ionicons name="checkmark" size={s(36)} color="#fff" />
          </View>

          <Text style={{ textAlign: 'center', fontSize: fs(12), color: MUTED, marginBottom: s(22) }}>
            Your Password is Updated...
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={{
              height: s(50),
              borderRadius: 999,
              backgroundColor: BROWN,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>Back To Sign In</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ForgotPasswordNewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || '';
  const resetToken = route.params?.resetToken || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const busy = useRef(false);

  function goToSignIn() {
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  async function onSave() {
    if (!email || !resetToken) {
      navigation.replace('ForgotPassword');
      return;
    }
    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setError('');
    try {
      await saveNewPassword(email, password, resetToken);
      setSuccessOpen(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      busy.current = false;
    }
  }

  return (
    <>
      <ForgotPasswordShell onBack={() => navigation.goBack()}>
        <Field
          label="New Password"
          value={password}
          onChangeText={setPassword}
          placeholder="debra.holt@example.com"
          secureTextEntry={!showPassword}
          trailing={
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setShowPassword((current) => !current)}
              style={{ marginLeft: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={s(18)}
                color={MUTED}
              />
            </Pressable>
          }
        />
        <Field
          label="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="debra.holt@example.com"
          secureTextEntry={!showConfirm}
          trailing={
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setShowConfirm((current) => !current)}
              style={{ marginLeft: 8 }}
            >
              <Ionicons
                name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                size={s(18)}
                color={MUTED}
              />
            </Pressable>
          }
        />
        <ErrorText message={error} />
        <PrimaryButton label="Save" onPress={onSave} />
      </ForgotPasswordShell>

      <SuccessModal visible={successOpen} onSignIn={goToSignIn} />
    </>
  );
}
