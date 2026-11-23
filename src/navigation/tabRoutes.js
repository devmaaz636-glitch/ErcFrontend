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

  // Patient / doctor / manager tab shells.
  if (routeNames.includes('Home') || routeNames.includes('AppointmentsTab')) {
    navigation.navigate(screen);
    return;
  }

  navigation.navigate('MainTabs', { screen });
}

/** Open a root-stack screen from inside any tab (works on iOS, Android, and web). */
export function navigateRoot(navigation, screen, params) {
  let nav = navigation;
  // Walk up to the root stack so tab screens can open detail routes.
  while (nav?.getParent?.()) {
    const parent = nav.getParent();
    const names = parent?.getState?.()?.routeNames || [];
    if (names.includes(screen)) {
      parent.navigate(screen, params);
      return;
    }
    nav = parent;
  }
  navigation.navigate(screen, params);
}
