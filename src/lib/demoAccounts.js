/** Demo clinic managers — must match Backend/src/demoManagers.js */

export const DEMO_PASSWORD = '123456';

/** Original first clinic manager (not one of the 5 regional demo accounts). */
export const PRIMARY_MANAGER = {
  name: 'Abiha',
  email: 'itx.abiha.official@gmail.com',
  password: 'KHANabiha&0987',
  branchId: 'br-riyadh',
  region: 'KSA',
  primary: true,
};

export const DEMO_MANAGERS = [
  PRIMARY_MANAGER,
  {
    name: 'Ahmed Al-Faisal',
    email: 'ahmed.ksa@erc-demo.com',
    password: DEMO_PASSWORD,
    branchId: 'br-riyadh',
    region: 'KSA',
  },
  {
    name: 'Omar Hassan',
    email: 'omar.dubai@erc-demo.com',
    password: DEMO_PASSWORD,
    branchId: 'br-dubai',
    region: 'UAE',
  },
  {
    name: 'Khalid Al-Balushi',
    email: 'khalid.oman@erc-demo.com',
    password: DEMO_PASSWORD,
    branchId: 'br-muscat',
    region: 'Oman',
  },
  {
    name: 'James Anderson',
    email: 'james.usa@erc-demo.com',
    password: DEMO_PASSWORD,
    branchId: 'br-nyc',
    region: 'USA',
  },
  {
    name: 'Hamza Khan',
    email: 'hamza.pk@erc-demo.com',
    password: DEMO_PASSWORD,
    branchId: 'br-lahore',
    region: 'Pakistan',
  },
];

export function findDemoManager(email) {
  const key = String(email || '')
    .trim()
    .toLowerCase();
  return DEMO_MANAGERS.find((item) => item.email === key) || null;
}

export function isDemoManagerEmail(email) {
  return Boolean(findDemoManager(email));
}

export function demoPasswordFor(emailOrManager) {
  const manager =
    typeof emailOrManager === 'string' ? findDemoManager(emailOrManager) : emailOrManager;
  return manager?.password || DEMO_PASSWORD;
}
