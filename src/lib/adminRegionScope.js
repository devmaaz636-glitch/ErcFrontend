/**
 * Admin region scoping — same home/tab design for every region; only the data changes.
 * Filtering is synchronous so the first globe/header switch never paints a mixed UI.
 */

import {
  createAdminSeedAppointments,
  createAdminSeedBranches,
  createAdminSeedDashboard,
  createAdminSeedManagers,
} from './adminSeed';

export const ADMIN_REGION_BRANCH = {
  UAE: 'br-dubai',
  KSA: 'br-riyadh',
  Oman: 'br-muscat',
  USA: 'br-nyc',
  Pakistan: 'br-lahore',
};

const REGION_ALIASES = {
  uae: 'UAE',
  'united arab emirates': 'UAE',
  dubai: 'UAE',
  ksa: 'KSA',
  'saudi arabia': 'KSA',
  riyadh: 'KSA',
  oman: 'Oman',
  om: 'Oman',
  muscat: 'Oman',
  usa: 'USA',
  us: 'USA',
  'united states': 'USA',
  'new york': 'USA',
  nyc: 'USA',
  pakistan: 'Pakistan',
  pk: 'Pakistan',
  lahore: 'Pakistan',
};

export function normalizeAdminRegionKey(label) {
  const raw = String(label || '').trim().toLowerCase();
  if (!raw) return 'UAE';
  if (REGION_ALIASES[raw]) return REGION_ALIASES[raw];
  for (const [alias, key] of Object.entries(REGION_ALIASES)) {
    if (raw.includes(alias) || alias.includes(raw)) return key;
  }
  const hit = Object.keys(ADMIN_REGION_BRANCH).find(
    (key) => key.toLowerCase() === raw || raw.includes(key.toLowerCase())
  );
  return hit || 'UAE';
}

export function branchIdForAdminRegion(label) {
  return ADMIN_REGION_BRANCH[normalizeAdminRegionKey(label)] || 'br-dubai';
}

function regionMatches(value, regionKey) {
  if (!value) return false;
  return normalizeAdminRegionKey(value) === regionKey;
}

function pad2(n) {
  return String(Math.max(0, Number(n) || 0)).padStart(2, '0');
}

function doctorInRegion(doctor, regionKey, branchId) {
  if (!doctor) return false;
  if (doctor.branchId && doctor.branchId === branchId) return true;
  if (regionMatches(doctor.clinic?.region || doctor.region, regionKey)) return true;
  if (typeof doctor.clinic === 'string') {
    const clinic = doctor.clinic.toLowerCase();
    if (regionKey === 'UAE' && clinic.includes('dubai')) return true;
    if (regionKey === 'KSA' && clinic.includes('riyadh')) return true;
    if (regionKey === 'Oman' && clinic.includes('muscat')) return true;
    if (regionKey === 'USA' && (clinic.includes('york') || clinic.includes('nyc'))) return true;
    if (regionKey === 'Pakistan' && clinic.includes('lahore')) return true;
  }
  return false;
}

function managerInRegion(manager, regionKey, branchId) {
  if (!manager) return false;
  if (manager.branchId === branchId || manager.clinic?.id === branchId) return true;
  return regionMatches(manager.clinic?.region || manager.region, regionKey);
}

function branchInRegion(branch, regionKey, branchId) {
  if (!branch) return false;
  if (branch.id === branchId) return true;
  return regionMatches(branch.region, regionKey);
}

function appointmentInRegion(item, branchId) {
  if (!item) return false;
  if (item.branchId) return item.branchId === branchId;
  // Seed items without branchId stay visible only if we intentionally tagged them.
  return item.region
    ? normalizeAdminRegionKey(item.region) ===
        normalizeAdminRegionKey(
          Object.entries(ADMIN_REGION_BRANCH).find(([, id]) => id === branchId)?.[0]
        )
    : false;
}

/** Live rows win, but seed fills missing images / descriptions / clinic fields. */
function enrichWithSeed(live, seed, idKey = 'id') {
  const seedList = Array.isArray(seed) ? seed : [];
  const liveList = Array.isArray(live) ? live : [];
  if (!liveList.length) return seedList;
  const seedById = new Map(seedList.map((row) => [String(row?.[idKey]), row]));
  const seen = new Set();
  const merged = liveList.map((row) => {
    const id = String(row?.[idKey] ?? '');
    if (id) seen.add(id);
    const base = seedById.get(id);
    if (!base) {
      return {
        ...row,
        photoKey: row.photoKey || row.imageKey || 'treatmentdoctor',
        imageKey: row.imageKey || row.photoKey || 'treatmentdoctor',
      };
    }
    return {
      ...base,
      ...row,
      photo: row.photo || row.photoUrl || base.photo || null,
      photoKey: row.photoKey || row.imageKey || base.photoKey || 'treatmentdoctor',
      imageKey: row.imageKey || row.photoKey || base.imageKey || 'treatmentdoctor',
      clinic: row.clinic || base.clinic || null,
      specialty: row.specialty || base.specialty,
      specialtyCategory: row.specialtyCategory || base.specialtyCategory,
      body: row.body || base.body,
      description: row.description || base.description,
      address: row.address || base.address,
      city: row.city || base.city,
      region: row.region || base.region,
    };
  });
  // Keep full region roster (seed extras) so first switch never looks half-empty.
  seedList.forEach((row) => {
    const id = String(row?.[idKey] ?? '');
    if (id && !seen.has(id)) merged.push(row);
  });
  return merged;
}

const regionSeedCache = new Map();

function regionSeedPack(regionKey) {
  if (regionSeedCache.has(regionKey)) return regionSeedCache.get(regionKey);
  const pack = {
    dashboard: createAdminSeedDashboard(regionKey),
    appointments: createAdminSeedAppointments(regionKey),
    branches: createAdminSeedBranches(regionKey),
    managers: createAdminSeedManagers(regionKey),
  };
  regionSeedCache.set(regionKey, pack);
  return pack;
}

// Prebuild every region pack so the first globe switch never waits on seed generation.
Object.keys(ADMIN_REGION_BRANCH).forEach((key) => regionSeedPack(key));

function buildRegionStats({ branch, appointments = [], attention = [], seedStats }) {
  const items = Array.isArray(appointments) ? appointments : [];
  const upcoming = items.filter((item) => String(item.status || '').toLowerCase() === 'upcoming').length;
  const canceled = items.filter((item) => String(item.status || '').toLowerCase() === 'canceled').length;
  const today =
    branch?.bookingsToday != null
      ? Number(branch.bookingsToday)
      : items.filter((item) => String(item.status || '').toLowerCase() !== 'canceled').length;

  const seedById = Object.fromEntries((seedStats || []).map((row) => [row.id, row]));
  return [
    {
      id: 'appointments',
      icon: 'calendar-outline',
      value: pad2(today || seedById.appointments?.value || 0),
      label: "Today's Appointments",
    },
    {
      id: 'upcoming',
      icon: 'time-outline',
      value: pad2(upcoming || seedById.upcoming?.value || 0),
      label: 'Upcoming Appointments',
    },
    {
      id: 'canceled',
      icon: 'document-text-outline',
      value: pad2(canceled || seedById.canceled?.value || 0),
      label: 'Canceled Approvals',
    },
    {
      id: 'alerts',
      icon: 'notifications-outline',
      value: pad2(attention.length || seedById.alerts?.value || 0),
      label: 'Clinic Alerts',
    },
  ];
}

function buildAppointmentStats(items, seedStats) {
  const list = Array.isArray(items) ? items : [];
  const upcoming = list.filter((item) => String(item.status || '').toLowerCase() === 'upcoming').length;
  const completed = list.filter((item) => String(item.status || '').toLowerCase() === 'completed').length;
  const canceled = list.filter((item) => String(item.status || '').toLowerCase() === 'canceled').length;
  const seedById = Object.fromEntries((seedStats || []).map((row) => [row.id, row]));
  return [
    {
      id: 'today',
      icon: 'calendar-outline',
      value: pad2(list.length || seedById.today?.value || 0),
      label: "Today's Appointments",
      change: seedById.today?.change ?? 12.4,
    },
    {
      id: 'upcoming',
      icon: 'time-outline',
      value: pad2(upcoming || seedById.upcoming?.value || 0),
      label: 'Upcoming',
      change: seedById.upcoming?.change ?? -8.2,
    },
    {
      id: 'completed',
      icon: 'checkmark-circle-outline',
      value: pad2(completed || seedById.completed?.value || 0),
      label: 'Completed visits',
      change: seedById.completed?.change ?? -3.2,
    },
    {
      id: 'canceled',
      icon: 'close-circle-outline',
      value: pad2(canceled || seedById.canceled?.value || 0),
      label: 'Canceled bookings',
      change: seedById.canceled?.change ?? 10.2,
    },
  ];
}

/**
 * Scope a full admin clinic payload to one region.
 * Always returns a complete design-shaped object (seed fills any empty section).
 */
export function scopeAdminClinicData(payload, regionLabel) {
  const regionKey = normalizeAdminRegionKey(regionLabel);
  const branchId = ADMIN_REGION_BRANCH[regionKey];
  const seed = regionSeedPack(regionKey);
  const seedDash = seed.dashboard;
  const seedAppts = seed.appointments;
  const seedBranches = seed.branches;
  const seedManagers = seed.managers;

  const dash = payload?.dashboard || {};
  // Admin always sees EVERY branch (all regions). Region switch scopes other home data only.
  const allBranchesSeed = createAdminSeedBranches(); // unscoped full catalog
  const allLeaderboardSeed = createAdminSeedDashboard().branches;
  const liveBranches = (dash.branches?.length ? dash.branches : payload?.branches?.items) || [];
  const liveDoctors = dash.doctors || [];
  const liveManagers =
    (dash.managerPreview?.length ? dash.managerPreview : payload?.managers?.items) || [];
  const liveAttention = dash.attention || [];
  const liveAppointments = payload?.appointments?.items || [];

  const doctors = liveDoctors.filter((item) => doctorInRegion(item, regionKey, branchId));
  const managerPreview = liveManagers.filter((item) => managerInRegion(item, regionKey, branchId));
  const attention = liveAttention.filter(
    (item) => !item.branchId || item.branchId === branchId || regionMatches(item.region, regionKey)
  );
  const appointmentItems = liveAppointments.filter((item) => appointmentInRegion(item, branchId));

  // Always enrich with region seed so first switch / cold start never paints headings-only.
  const resolvedBranches = enrichWithSeed(liveBranches, allLeaderboardSeed);
  const resolvedDoctors = enrichWithSeed(doctors, seedDash.doctors);
  const resolvedManagers = enrichWithSeed(managerPreview, seedDash.managerPreview);
  const resolvedAttention = enrichWithSeed(attention, seedDash.attention);
  const resolvedAppointments = enrichWithSeed(appointmentItems, seedAppts.items);
  const primaryBranch =
    resolvedBranches.find((item) => branchInRegion(item, regionKey, branchId)) ||
    seedBranches.items[0] ||
    resolvedBranches[0] ||
    null;

  const managerItems = (payload?.managers?.items || []).filter((item) =>
    managerInRegion(item, regionKey, branchId)
  );
  const resolvedManagerItems = enrichWithSeed(managerItems, seedManagers.items);

  const liveBranchItems = payload?.branches?.items || liveBranches || [];
  const resolvedBranchItems = enrichWithSeed(liveBranchItems, allBranchesSeed.items);

  return {
    ...payload,
    _regionKey: regionKey,
    _branchId: branchId,
    dashboard: {
      ...dash,
      region: regionKey,
      clinic: {
        id: primaryBranch?.id || branchId,
        name: primaryBranch?.name || seedDash.branches?.[0]?.name,
        city: primaryBranch?.city || seedDash.branches?.[0]?.city,
        region: regionKey,
        address: primaryBranch?.address || seedDash.branches?.[0]?.address,
      },
      stats: buildRegionStats({
        branch: primaryBranch,
        appointments: resolvedAppointments,
        attention: resolvedAttention,
        seedStats: seedDash.stats,
      }),
      attention: resolvedAttention,
      branches: resolvedBranches,
      doctors: resolvedDoctors,
      managerPreview: resolvedManagers,
    },
    appointments: {
      stats: buildAppointmentStats(resolvedAppointments, seedAppts.stats),
      items: resolvedAppointments,
    },
    branches: {
      items: resolvedBranchItems,
    },
    managers: {
      stats: {
        total: resolvedManagerItems.length,
        active: resolvedManagerItems.filter((item) => item.status === 'active').length,
        invited: resolvedManagerItems.filter((item) => item.status === 'invited').length,
        inactive: resolvedManagerItems.filter((item) => item.status === 'inactive').length,
        cards: [
          {
            id: 'total',
            label: 'Total',
            value: pad2(resolvedManagerItems.length),
            sub: `${regionKey} Clinics`,
          },
          {
            id: 'active',
            label: 'Active',
            value: pad2(resolvedManagerItems.filter((item) => item.status === 'active').length),
            sub: 'Of Region',
          },
          {
            id: 'pending',
            label: 'Pending',
            value: pad2(resolvedManagerItems.filter((item) => item.status === 'invited').length),
            sub: 'Of Region',
          },
        ],
      },
      items: resolvedManagerItems,
    },
  };
}
