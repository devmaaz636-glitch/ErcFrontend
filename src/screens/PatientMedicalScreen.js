import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { StateNotice, cardStyle } from '../components/doctor/DoctorUI';
import { IconCircleButton, PrimaryButton } from '../components/ui';
import { fetchPatientMedical, savePatientMedical } from '../lib/patientPortal';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const inputStyle = [
  cardStyle,
  { marginTop: s(8), minHeight: s(110), textAlignVertical: 'top', color: colors.ink, fontSize: fs(13) },
];

const lines = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean);

/** The patient's own allergies and medications; their doctor can see and correct them. */
export default function PatientMedicalScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(20);
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const apply = (record) => {
    setAllergies((record.allergies || []).join('\n'));
    setMedications(
      (record.medications || [])
        .map((item) => (item.frequency ? `${item.name} - ${item.frequency}` : item.name))
        .join('\n')
    );
    setUpdatedBy(record.updatedBy && record.updatedBy !== 'patient' ? record.updatedBy : '');
  };

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    fetchPatientMedical()
      .then(apply)
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      apply(
        await savePatientMedical({
          allergies: lines(allergies),
          medications: lines(medications).map((line) => {
            const [name, ...rest] = line.split(' - ');
            return { name, frequency: rest.join(' - ') };
          }),
        })
      );
      setMessage('Saved.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + s(28),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton name="chevron-back" accessibilityLabel="Go back" onPress={() => navigation.goBack()} />
            <Text style={{ flex: 1, marginLeft: s(12), fontSize: fs(16), fontWeight: '700', color: colors.ink }}>
              Medical Information
            </Text>
          </View>

          <StateNotice loading={loading} error={loadError} onRetry={load} />

          {!loading && !loadError ? (
            <>
              {updatedBy ? (
                <Text style={{ marginTop: s(14), fontSize: fs(11), color: colors.desc }}>
                  Last updated by {updatedBy}.
                </Text>
              ) : null}
              <Text style={{ marginTop: s(18), fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
                Allergies
              </Text>
              <TextInput
                value={allergies}
                onChangeText={setAllergies}
                multiline
                placeholder="One per line, e.g. Penicillin"
                placeholderTextColor={colors.muted}
                style={inputStyle}
              />
              <Text style={{ marginTop: s(18), fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
                Current medications
              </Text>
              <TextInput
                value={medications}
                onChangeText={setMedications}
                multiline
                placeholder="One per line, e.g. Cetirizine - Daily"
                placeholderTextColor={colors.muted}
                style={inputStyle}
              />
              {message ? (
                <Text style={{ marginTop: s(10), fontSize: fs(12), color: colors.desc, textAlign: 'center' }}>
                  {message}
                </Text>
              ) : null}
              <PrimaryButton label="Save" loading={saving} onPress={save} style={{ marginTop: s(16), width: '100%' }} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
