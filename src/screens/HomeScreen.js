import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../lib/firebase';
import { authErrorMessage, signOutUser } from '../lib/auth';
import { firestoreErrorMessage, getUserProfile } from '../lib/users';

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [profileNote, setProfileNote] = useState('');
  const email = auth.currentUser?.email ?? '';

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return undefined;
    }

    let active = true;
    getUserProfile(uid)
      .then((profile) => {
        if (!active) {
          return;
        }
        setProfileNote(profile ? 'Firestore connected' : 'Signed in. No Firestore profile yet.');
      })
      .catch((profileError) => {
        if (active) {
          setProfileNote(firestoreErrorMessage(profileError));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    setError('');
    try {
      await signOutUser();
      navigation.replace('SignIn');
    } catch (signOutError) {
      setError(authErrorMessage(signOutError));
      setSigningOut(false);
    }
  }

  return (
    <View
      className="flex-1 bg-card px-6"
      style={{ paddingTop: insets.top + 28, paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <StatusBar style="dark" />
      <Text className="text-[28px] font-bold text-ink">Welcome</Text>
      <Text className="mt-2 text-[15px] leading-6 text-muted">
        {email ? `Signed in as ${email}` : 'You are signed in.'}
      </Text>
      {profileNote ? (
        <Text className="mt-3 text-[14px] leading-5 text-muted">{profileNote}</Text>
      ) : null}
      {error ? <Text className="mt-4 text-[13px] text-[#B42318]">{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={handleSignOut}
        disabled={signingOut}
        className="mt-8 h-[54px] items-center justify-center rounded-full bg-peach"
        style={{ opacity: signingOut ? 0.7 : 1 }}
      >
        {signingOut ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-[16px] font-semibold text-white">Sign out</Text>
        )}
      </Pressable>
    </View>
  );
}
