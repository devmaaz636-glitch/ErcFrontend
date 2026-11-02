import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import BottomTabBar from '../components/BottomTabBar';
import MoreMenuDrawer from '../components/MoreMenuDrawer';
import ManagerHomeScreen from '../screens/ManagerHomeScreen';
import AppointmentsTabScreen from '../screens/AppointmentsTabScreen';
import TreatmentsTabScreen from '../screens/TreatmentsTabScreen';
import DoctorsTabScreen from '../screens/DoctorsTabScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

function ManagerTabBar({ moreOpen, onMorePress, ...props }) {
  return <BottomTabBar {...props} moreOpen={moreOpen} onMorePress={onMorePress} />;
}

function ManagerTabsInner() {
  const navigation = useNavigation();
  const [moreOpen, setMoreOpen] = useState(false);

  const openMore = useCallback(() => setMoreOpen(true), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  const onSelect = useCallback(
    (route) => {
      setMoreOpen(false);
      navigation.navigate(route);
    },
    [navigation]
  );

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => (
          <ManagerTabBar {...props} moreOpen={moreOpen} onMorePress={openMore} />
        )}
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
        <Tab.Screen name="DoctorsTab" component={DoctorsTabScreen} />
        <Tab.Screen
          name="MoreTab"
          component={HomePassthrough}
          options={{ title: 'More' }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              openMore();
            },
          }}
        />
      </Tab.Navigator>

      <MoreMenuDrawer visible={moreOpen} onClose={closeMore} onSelect={onSelect} />
    </View>
  );
}

/** Placeholder route so More stays in the tab list; content never replaces the active screen. */
function HomePassthrough() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

export default function ManagerTabs() {
  return <ManagerTabsInner />;
}
