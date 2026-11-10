import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabBar from '../components/BottomTabBar';
import AppointmentsTabScreen from '../screens/AppointmentsTabScreen';
import DoctorHomeScreen from '../screens/DoctorHomeScreen';
import DoctorPatientsScreen from '../screens/DoctorPatientsScreen';
import DoctorScheduleScreen from '../screens/DoctorScheduleScreen';
import ProfileTabScreen from '../screens/ProfileTabScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function DoctorTabs() {
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
      <Tab.Screen name="Home" component={DoctorHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsTabScreen}
        options={{ title: 'Appointments' }}
      />
      <Tab.Screen name="PatientsTab" component={DoctorPatientsScreen} options={{ title: 'Patients' }} />
      <Tab.Screen name="ScheduleTab" component={DoctorScheduleScreen} options={{ title: 'Schedule' }} />
      <Tab.Screen name="ProfileTab" component={ProfileTabScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
