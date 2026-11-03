/** Keep in sync with Backend clinicData REGION_CURRENCY / regionPriceFactor. */

export const REGION_CURRENCY = {
  UAE: 'AED',
  KSA: 'SAR',
  Oman: 'OMR',
  Pakistan: 'PKR',
  USA: 'USD',
};

export function normalizeRegionKey(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'UAE';
  if (raw.includes('ksa') || raw.includes('saudi')) return 'KSA';
  if (raw.includes('oman') || raw === 'om') return 'Oman';
  if (raw.includes('pakistan') || raw === 'pk') return 'Pakistan';
  if (raw.includes('usa') || raw.includes('united states') || raw === 'us') return 'USA';
  if (raw.includes('uae') || raw.includes('emirates') || raw.includes('dubai')) return 'UAE';
  return (
    Object.keys(REGION_CURRENCY).find((key) => key.toLowerCase() === raw) || 'UAE'
  );
}

export function regionPriceFactor(region) {
  const key = normalizeRegionKey(region);
  if (key === 'KSA') return 1.05;
  if (key === 'Oman') return 0.1;
  if (key === 'Pakistan') return 75;
  if (key === 'USA') return 0.27;
  return 1;
}

export function formatRegionPrice(basePrice = 500, region, unit = 'Per Session') {
  const key = normalizeRegionKey(region);
  const currency = REGION_CURRENCY[key] || 'AED';
  const price = Math.round(Number(basePrice || 500) * regionPriceFactor(key));
  return {
    region: key,
    currency,
    price,
    unit,
    priceLabel: `${currency} ${Number(price).toLocaleString('en-US')} ${unit}`,
  };
}

export function localizeAppointmentForRegion(apt, region) {
  if (!apt) return apt;
  const unit = apt.unit || 'Per Session';
  const priced = formatRegionPrice(apt.basePrice ?? apt.price ?? 500, region, unit);
  return {
    ...apt,
    ...priced,
    treatment: apt.treatment || 'Treatment',
  };
}
