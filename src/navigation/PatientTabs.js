import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabBar from '../components/BottomTabBar';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import PatientPlaceholderScreen from '../screens/PatientPlaceholderScreen';
import ProfileTabScreen from '../screens/ProfileTabScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function PatientTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        freezeOnBlur: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Home" component={PatientHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name="AppointmentsTab"
        component={PatientPlaceholderScreen}
        options={{ title: 'Appointments' }}
      />
      <Tab.Screen
        name="TreatmentsTab"
        component={PatientPlaceholderScreen}
        options={{ title: 'Treatments' }}
      />
      <Tab.Screen
        name="AboutTab"
        component={PatientPlaceholderScreen}
        options={{ title: 'About Us' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileTabScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
