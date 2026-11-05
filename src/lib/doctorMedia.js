/**
 * Shared doctor photo resolver — seeded treatment doctors use treatmentdocotor.png.
 */

const treatmentDoctorImage = require('../../assets/treatmentdocotor.png');
const defaultDoctorImage = require('../../assets/doctor.png');

export function isTreatmentDoctorAsset(doctor) {
  const key = String(doctor?.photoKey || doctor?.imageKey || '').toLowerCase();
  if (key === 'treatmentdoctor' || key === 'treatmentdocotor') return true;
  const uri = String(doctor?.photo || doctor?.photoUrl || doctor?.imageUri || '').toLowerCase();
  return uri === 'asset:treatmentdoctor' || uri === 'asset:treatmentdocotor';
}

export function doctorPhotoSource(doctor, { preferTreatmentAsset = false } = {}) {
  if (isTreatmentDoctorAsset(doctor) || preferTreatmentAsset) {
    return treatmentDoctorImage;
  }
  const uri =
    doctor?.photo ||
    doctor?.photoUrl ||
    doctor?.imageUri ||
    doctor?.avatar ||
    doctor?.profileImage ||
    null;
  if (uri && !String(uri).startsWith('asset:')) {
    return { uri };
  }
  return preferTreatmentAsset ? treatmentDoctorImage : defaultDoctorImage;
}

export { treatmentDoctorImage, defaultDoctorImage };
