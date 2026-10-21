import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const BROWN = '#BF824F';
const MUTED = '#8D8680';

const TABS = [
  { key: 'Home',     label: 'Home',     icon: 'home-outline',          activeIcon: 'home',          route: 'Home' },
  { key: 'Appointments', label: 'Appointments', icon: 'calendar-outline',      activeIcon: 'calendar',      route: 'AppointmentsTab' },
//   { key: 'Alerts',   label: 'Alerts',   icon: 'notifications-outline', activeIcon: 'notifications', route: 'AlertsTab' },
  { key: 'Branches', label: 'Branches', icon: 'business-outline',      activeIcon: 'business',      route: 'BranchesTab' },
  { key: 'Profile',  label: 'Profile',  icon: 'person-outline',        activeIcon: 'person',        route: 'ProfileTab' },
];

export default function BottomTabBar({ active }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: Math.max(insets.bottom, 12),
        alignSelf: 'center',
        maxWidth: 440,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            onPress={() => {
              if (tab.route && !isActive) navigation.navigate(tab.route);
            }}
            style={
              isActive
                ? {
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: 44,
                    paddingHorizontal: 18,
                    borderRadius: 22,
                    backgroundColor: BROWN,
                  }
                : { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }
            }
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={isActive ? 18 : 22}
              color={isActive ? '#fff' : MUTED}
            />
            {isActive ? (
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>{tab.label}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}