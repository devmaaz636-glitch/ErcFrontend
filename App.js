import './global.css';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import SplashScreen from './src/screens/SplashScreen';
import SignInScreen from './src/screens/SignInScreen';
import VerifyRegionScreen from './src/screens/VerifyRegionScreen';
import HomeScreen from './src/screens/HomeScreen';
import RevenueTabScreen from './src/screens/RevenueTabScreen';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <View
        className="flex-1 bg-splash"
        style={{ flex: 1, backgroundColor: '#BF824F' }}
        onLayout={() => {
          ExpoSplashScreen.hideAsync().catch(() => {});
        }}
      >
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#F7F3EE' },
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="RegionVerify" component={VerifyRegionScreen} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'none' }} />
            <Stack.Screen name="RevenueTab" component={RevenueTabScreen} options={{ animation: 'none' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}