import './global.css';
import { LogBox, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { SessionProvider } from './src/context/SessionContext';
import { ClinicDataProvider } from './src/context/ClinicDataContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { colors } from './src/theme';
import MainTabs from './src/navigation/MainTabs';
import ManagerTabs from './src/navigation/ManagerTabs';
import SplashScreen from './src/screens/SplashScreen';
import SignInScreen from './src/screens/SignInScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ForgotPasswordCodeScreen from './src/screens/ForgotPasswordCodeScreen';
import ForgotPasswordNewScreen from './src/screens/ForgotPasswordNewScreen';
import VerifyRegionScreen from './src/screens/VerifyRegionScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import BranchDetailScreen from './src/screens/BranchDetailScreen';
import ClinicManagersScreen from './src/screens/ClinicManagersScreen';
import ClinicManagerDetailScreen from './src/screens/ClinicManagerDetailScreen';
import DoctorDetailScreen from './src/screens/DoctorDetailScreen';
import DoctorFormScreen from './src/screens/DoctorFormScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SecurityPrivacyScreen from './src/screens/SecurityPrivacyScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import NotificationPreferencesScreen from './src/screens/NotificationPreferencesScreen';
import AppointmentRequestDetailScreen from './src/screens/AppointmentRequestDetailScreen';
import TreatmentDetailScreen from './src/screens/TreatmentDetailScreen';
import AddTreatmentScreen from './src/screens/AddTreatmentScreen';

LogBox.ignoreLogs([
  'Splashscreen.setOptions',
  'SafeAreaView has been deprecated',
  'Non-serializable values were found in the navigation state',
  'AsyncStorage has been extracted',
]);

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ClinicDataProvider>
          <NotificationsProvider>
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
                  name="AppointmentDetail"
                  component={AppointmentDetailScreen}
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
                  name="DoctorForm"
                  component={DoctorFormScreen}
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
                  name="AddTreatment"
                  component={AddTreatmentScreen}
                  options={{ animation: 'slide_from_right' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </View>
          </NotificationsProvider>
        </ClinicDataProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
