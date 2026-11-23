import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabBar from '../components/BottomTabBar';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import PatientAppointmentsScreen from '../screens/PatientAppointmentsScreen';
import PatientTreatmentsScreen from '../screens/PatientTreatmentsScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import ProfileTabScreen from '../screens/ProfileTabScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function PatientTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} variant="patient" />}
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
        component={PatientAppointmentsScreen}
        options={{ title: 'Appointments' }}
      />
      <Tab.Screen
        name="TreatmentsTab"
        component={PatientTreatmentsScreen}
        options={{ title: 'Treatments' }}
      />
      <Tab.Screen
        name="AboutTab"
        component={AboutUsScreen}
        options={{ title: 'About Us' }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileTabScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
