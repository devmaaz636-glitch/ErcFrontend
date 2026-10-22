/** Canonical main-tab route names (nested under `MainTabs`). */
export const TAB_ROUTES = {
  Home: 'Home',
  Appointments: 'AppointmentsTab',
  Branches: 'BranchesTab',
  Profile: 'ProfileTab',
};

/**
 * Navigate to a main tab from anywhere (stack detail, modal, etc.).
 * Uses nested navigation so the tab bar animates and tab state is kept.
 */
export function navigateToTab(navigation, screen = TAB_ROUTES.Home) {
  const state = navigation.getState?.();
  const routeNames = state?.routeNames || [];

  // Already inside MainTabs — switch tab directly (animated fade).
  if (routeNames.includes(screen)) {
    navigation.navigate(screen);
    return;
  }

  navigation.navigate('MainTabs', { screen });
}
