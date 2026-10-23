import { useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authErrorMessage, requestPasswordReset } from '../lib/auth';
import {
  ErrorText,
  Field,
  ForgotPasswordShell,
  PrimaryButton,
} from '../components/ForgotPasswordShell';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const from = route.params?.from || 'signin';
  const headerTitle = route.params?.headerTitle || 'Change Password';
  const showBell = from === 'security';
  const [email, setEmail] = useState(route.params?.email || '');
  const [error, setError] = useState('');
  const busy = useRef(false);

  async function onContinue() {
    const nextEmail = email.trim();
    if (!nextEmail || !EMAIL_PATTERN.test(nextEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setError('');
    try {
      await requestPasswordReset(nextEmail);
      navigation.navigate('ForgotPasswordCode', {
        email: nextEmail,
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
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="debra.holt@example.com"
        keyboardType="email-address"
        showClear
        onClear={() => setEmail('')}
      />
      <ErrorText message={error} />
      <PrimaryButton label="Continue" onPress={onContinue} />
    </ForgotPasswordShell>
  );
}
