import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomTabBar from '../components/BottomTabBar';
import ManagerHomeScreen from '../screens/ManagerHomeScreen';
import AppointmentsTabScreen from '../screens/AppointmentsTabScreen';
import TreatmentsTabScreen from '../screens/TreatmentsTabScreen';
import ManagerPlaceholderScreen from '../screens/ManagerPlaceholderScreen';
import DoctorsTabScreen from '../screens/DoctorsTabScreen';
import ProfileTabScreen from '../screens/ProfileTabScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function ManagerTabs() {
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
      <Tab.Screen name="Home" component={ManagerHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsTabScreen}
        options={{ title: 'Appointments' }}
      />
      <Tab.Screen
        name="TreatmentsTab"
        component={TreatmentsTabScreen}
        options={{ title: 'Treatments' }}
      />
      <Tab.Screen
        name="DoctorsTab"
        component={DoctorsTabScreen}
      />
      <Tab.Screen
        name="MoreTab"
        component={ProfileTabScreen}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
}
