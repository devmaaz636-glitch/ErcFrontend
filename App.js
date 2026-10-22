import './global.css';
import { LogBox, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { SessionProvider } from './src/context/SessionContext';
import { ClinicDataProvider } from './src/context/ClinicDataContext';
import { colors } from './src/theme';
import SplashScreen from './src/screens/SplashScreen';
import SignInScreen from './src/screens/SignInScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ForgotPasswordCodeScreen from './src/screens/ForgotPasswordCodeScreen';
import ForgotPasswordNewScreen from './src/screens/ForgotPasswordNewScreen';
import VerifyRegionScreen from './src/screens/VerifyRegionScreen';
import HomeScreen from './src/screens/HomeScreen';
import AppointmentsTabScreen from './src/screens/AppointmentsTabScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import BranchesTabScreen from './src/screens/BranchesTabScreen';
import BranchDetailScreen from './src/screens/BranchDetailScreen';
import ClinicManagersScreen from './src/screens/ClinicManagersScreen';
import ClinicManagerDetailScreen from './src/screens/ClinicManagerDetailScreen';
import ProfileTabScreen from './src/screens/ProfileTabScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SecurityPrivacyScreen from './src/screens/SecurityPrivacyScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

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
                <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'none' }} />
                <Stack.Screen name="AppointmentsTab" component={AppointmentsTabScreen} />
                <Stack.Screen
                  name="AppointmentDetail"
                  component={AppointmentDetailScreen}
                  options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen name="BranchesTab" component={BranchesTabScreen} options={{ animation: 'none' }} />
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
                <Stack.Screen name="ProfileTab" component={ProfileTabScreen} options={{ animation: 'none' }} />
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
              </Stack.Navigator>
            </NavigationContainer>
          </View>
        </ClinicDataProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
