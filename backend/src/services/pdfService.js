function renderPrescriptionText(prescription) {
	const meds = Array.isArray(prescription.medications) ? prescription.medications : [];
	const medsText = meds
		.map(
			(m, index) =>
				`${index + 1}. ${m.name || '-'} | dosage: ${m.dosage || '-'} | frequency: ${
					m.frequency || '-'
				} | duration: ${m.duration || '-'}`
		)
		.join('\n');

	return [
		'HealthMonitorPro Prescription',
		`Prescription ID: ${prescription._id || ''}`,
		`Patient ID: ${prescription.patientId || ''}`,
		`Doctor ID: ${prescription.doctorId || ''}`,
		`Issued At: ${prescription.issuedAt || new Date().toISOString()}`,
		`Diagnosis: ${prescription.diagnosis || '-'}`,
		`Instructions: ${prescription.instructions || '-'}`,
		'Medications:',
		medsText || 'None'
	].join('\n');
}

async function generatePrescriptionPdfBuffer(prescription) {
	const text = renderPrescriptionText(prescription || {});
	return Buffer.from(text, 'utf8');
}

module.exports = {
	generatePrescriptionPdfBuffer
};
