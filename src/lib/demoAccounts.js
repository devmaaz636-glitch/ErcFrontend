/** Demo clinic managers — must match Backend/src/demoManagers.js */

export const DEMO_PASSWORD = '123456';

export const DEMO_MANAGERS = [
  {
    name: 'Ahmed Al-Faisal',
    email: 'ahmed.ksa@erc-demo.com',
    branchId: 'br-riyadh',
    region: 'KSA',
  },
  {
    name: 'Omar Hassan',
    email: 'omar.dubai@erc-demo.com',
    branchId: 'br-dubai',
    region: 'UAE',
  },
  {
    name: 'Khalid Al-Balushi',
    email: 'khalid.oman@erc-demo.com',
    branchId: 'br-muscat',
    region: 'Oman',
  },
  {
    name: 'James Anderson',
    email: 'james.usa@erc-demo.com',
    branchId: 'br-nyc',
    region: 'USA',
  },
  {
    name: 'Hamza Khan',
    email: 'hamza.pk@erc-demo.com',
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
