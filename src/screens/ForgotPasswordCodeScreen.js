import { useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authErrorMessage, verifyPasswordResetCode } from '../lib/auth';
import {
  ErrorText,
  Field,
  ForgotPasswordShell,
  PrimaryButton,
} from '../components/ForgotPasswordShell';

export default function ForgotPasswordCodeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || '';
  const from = route.params?.from || 'signin';
  const headerTitle = route.params?.headerTitle || 'Change Password';
  const showBell = from === 'security';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const busy = useRef(false);

  async function onContinue() {
    if (!email) {
      navigation.replace('ForgotPassword', { from, headerTitle });
      return;
    }
    if (!String(code).trim()) {
      setError('Enter the verification code.');
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setError('');
    try {
      const result = await verifyPasswordResetCode(email, code);
      if (!result?.resetToken) {
        throw new Error('Could not verify the code. Try again.');
      }
      navigation.navigate('ForgotPasswordNew', {
        email,
        resetToken: result.resetToken,
        from,
        headerTitle,
      });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      busy.current = false;
    }
  }

  return (
    <ForgotPasswordShell
      onBack={() => navigation.goBack()}
      headerTitle={headerTitle}
      showBell={showBell}
    >
      <Field
        label="Code"
        value={code}
        onChangeText={setCode}
        placeholder="445601"
        keyboardType="number-pad"
        maxLength={6}
        showClear
        onClear={() => setCode('')}
      />
      <ErrorText message={error} />
      <PrimaryButton label="Continue" onPress={onContinue} />
    </ForgotPasswordShell>
  );
}
