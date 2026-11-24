import './global.css';
import { LogBox, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { SessionProvider } from './src/context/SessionContext';
import { ClinicDataProvider } from './src/context/ClinicDataContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { PatientDataProvider } from './src/context/PatientDataContext';
import { colors } from './src/theme';
import MainTabs from './src/navigation/MainTabs';
import ManagerTabs from './src/navigation/ManagerTabs';
import DoctorTabs from './src/navigation/DoctorTabs';
import PatientTabs from './src/navigation/PatientTabs';
import SplashScreen from './src/screens/SplashScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import PatientOnboardingScreen from './src/screens/PatientOnboardingScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ForgotPasswordCodeScreen from './src/screens/ForgotPasswordCodeScreen';
import ForgotPasswordNewScreen from './src/screens/ForgotPasswordNewScreen';
import VerifyRegionScreen from './src/screens/VerifyRegionScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import PatientAppointmentDetailScreen from './src/screens/PatientAppointmentDetailScreen';
import BranchDetailScreen from './src/screens/BranchDetailScreen';
import ClinicManagersScreen from './src/screens/ClinicManagersScreen';
import ClinicManagerDetailScreen from './src/screens/ClinicManagerDetailScreen';
import DoctorDetailScreen from './src/screens/DoctorDetailScreen';
import DoctorConsultationScreen from './src/screens/DoctorConsultationScreen';
import DoctorFormScreen from './src/screens/DoctorFormScreen';
import DoctorReviewHistoryScreen from './src/screens/DoctorReviewHistoryScreen';
import DoctorPreviousVisitDetailScreen from './src/screens/DoctorPreviousVisitDetailScreen';
import DoctorEditScheduleScreen from './src/screens/DoctorEditScheduleScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SecurityPrivacyScreen from './src/screens/SecurityPrivacyScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import NotificationPreferencesScreen from './src/screens/NotificationPreferencesScreen';
import AppointmentRequestDetailScreen from './src/screens/AppointmentRequestDetailScreen';
import TreatmentDetailScreen from './src/screens/TreatmentDetailScreen';
import PatientTreatmentDetailScreen from './src/screens/PatientTreatmentDetailScreen';
import PatientBookAppointmentScreen from './src/screens/PatientBookAppointmentScreen';
import PatientSearchScreen from './src/screens/PatientSearchScreen';
import AddTreatmentScreen from './src/screens/AddTreatmentScreen';
import AboutDetailsScreen from './src/screens/AboutDetailsScreen';
import ManagerPatientsScreen from './src/screens/ManagerPatientsScreen';
import ManagerPatientDetailScreen from './src/screens/ManagerPatientDetailScreen';
import ManagerAlertsScreen from './src/screens/ManagerAlertsScreen';
import InvestigateAlertScreen from './src/screens/InvestigateAlertScreen';
import AlertRequestDetailScreen from './src/screens/AlertRequestDetailScreen';
import ProfileTabScreen from './src/screens/ProfileTabScreen';
import CreatePatientProfileScreen from './src/screens/CreatePatientProfileScreen';

LogBox.ignoreLogs([
  'Splashscreen.setOptions',
  'SafeAreaView has been deprecated',
  'Non-serializable values were found in the navigation state',
  'AsyncStorage has been extracted',
]);
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Custom Manrope faces must load before paint — otherwise Android/iOS text
  // with fontFamily set can render blank (web still falls back).
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.brand }} />
    );
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ClinicDataProvider>
          <NotificationsProvider>
          <PatientDataProvider>
          <View
            className="flex-1 bg-splash"
            style={{ flex: 1, backgroundColor: colors.brand }}
            onLayout={() => {
              ExpoSplashScreen.hideAsync().catch(() => {});
            }}
          >
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  animation: 'fade',
                  contentStyle: { backgroundColor: colors.screen },
                }}
              >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="SignIn" component={SignInScreen} />
                <Stack.Screen
                  name="SignUp"
                  component={SignUpScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="PatientOnboarding"
                  component={PatientOnboardingScreen}
                  options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="CreateProfile"
                  component={CreatePatientProfileScreen}
                  options={{ animation: 'slide_from_right', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="ForgotPassword"
                  component={ForgotPasswordScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="ForgotPasswordCode"
                  component={ForgotPasswordCodeScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="ForgotPasswordNew"
                  component={ForgotPasswordNewScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen name="RegionVerify" component={VerifyRegionScreen} />
                <Stack.Screen
                  name="MainTabs"
                  component={MainTabs}
                  options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="ManagerTabs"
                  component={ManagerTabs}
                  options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="DoctorTabs"
                  component={DoctorTabs}
                  options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="PatientTabs"
                  component={PatientTabs}
                  options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen
                  name="AppointmentDetail"
                  component={AppointmentDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="PatientAppointmentDetail"
                  component={PatientAppointmentDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="AppointmentRequestDetail"
                  component={AppointmentRequestDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="BranchDetail"
                  component={BranchDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="AboutDetails"
                  component={AboutDetailsScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="ClinicManagers"
                  component={ClinicManagersScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="ClinicManagerDetail"
                  component={ClinicManagerDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="DoctorDetail"
                  component={DoctorDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="DoctorConsultation"
                  component={DoctorConsultationScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="DoctorForm"
                  component={DoctorFormScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="DoctorReviewHistory"
                  component={DoctorReviewHistoryScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="DoctorPreviousVisitDetail"
                  component={DoctorPreviousVisitDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="DoctorEditSchedule"
                  component={DoctorEditScheduleScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="EditProfile"
                  component={EditProfileScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="SecurityPrivacy"
                  component={SecurityPrivacyScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="Notifications"
                  component={NotificationsScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="NotificationPreferences"
                  component={NotificationPreferencesScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="TreatmentDetail"
                  component={TreatmentDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="PatientTreatmentDetail"
                  component={PatientTreatmentDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="PatientBookAppointment"
                  component={PatientBookAppointmentScreen}
                  options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                  name="PatientSearch"
                  component={PatientSearchScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="AddTreatment"
                  component={AddTreatmentScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="ManagerPatients"
                  component={ManagerPatientsScreen}
                  options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                  name="ManagerPatientDetail"
                  component={ManagerPatientDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="ManagerAlerts"
                  component={ManagerAlertsScreen}
                  options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                  name="InvestigateAlert"
                  component={InvestigateAlertScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="AlertRequestDetail"
                  component={AlertRequestDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                  name="ManagerProfile"
                  component={ProfileTabScreen}
                  options={{ animation: 'slide_from_bottom' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </View>
          </PatientDataProvider>
          </NotificationsProvider>
        </ClinicDataProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
