import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabBar from '../components/BottomTabBar';
import HomeScreen from '../screens/HomeScreen';
import AppointmentsTabScreen from '../screens/AppointmentsTabScreen';
import BranchesTabScreen from '../screens/BranchesTabScreen';
import ProfileTabScreen from '../screens/ProfileTabScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Soft cross-fade between tabs (iOS + Android).
        animation: 'fade',
        freezeOnBlur: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsTabScreen}
        options={{ title: 'Appointments' }}
      />
      <Tab.Screen name="BranchesTab" component={BranchesTabScreen} options={{ title: 'Branches' }} />
      <Tab.Screen name="ProfileTab" component={ProfileTabScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
