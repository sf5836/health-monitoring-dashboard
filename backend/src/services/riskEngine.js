function toNumber(value) {
	if (value === null || value === undefined || value === '') {
		return null;
	}

	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function evaluateVitalRisk(vital) {
	const reasons = [];

	const systolic = toNumber(vital?.bloodPressure?.systolic);
	const diastolic = toNumber(vital?.bloodPressure?.diastolic);
	const glucoseValue = toNumber(vital?.glucose?.value);
	const glucoseMode = vital?.glucose?.mode;
	const spo2 = toNumber(vital?.spo2);
	const heartRate = toNumber(vital?.heartRate);

	let riskLevel = 'normal';

	if ((systolic !== null && systolic >= 150) || (diastolic !== null && diastolic >= 95)) {
		riskLevel = 'high';
		reasons.push('Blood pressure is in high-risk range');
	} else if (
		(systolic !== null && systolic >= 135 && systolic <= 149) ||
		(diastolic !== null && diastolic >= 85 && diastolic <= 94)
	) {
		if (riskLevel !== 'high') {
			riskLevel = 'medium';
		}
		reasons.push('Blood pressure is above normal range');
	}

	if (glucoseValue !== null) {
		if (glucoseMode === 'fasting' && glucoseValue >= 126) {
			riskLevel = 'high';
			reasons.push('Fasting glucose is in high-risk range');
		}

		if (glucoseMode === 'post_meal' && glucoseValue >= 180) {
			riskLevel = 'high';
			reasons.push('Post-meal glucose is in high-risk range');
		}
	}

	if (spo2 !== null && spo2 < 94) {
		riskLevel = 'high';
		reasons.push('SpO2 is below safe threshold');
	}

	if (heartRate !== null) {
		if (heartRate > 120 || heartRate < 45) {
			riskLevel = 'high';
			reasons.push('Heart rate is in high-risk range');
		} else if ((heartRate > 110 || heartRate < 50) && riskLevel !== 'high') {
			riskLevel = 'medium';
			reasons.push('Heart rate is outside normal range');
		}
	}

	return {
		riskLevel,
		riskReasons: reasons
	};
}

module.exports = {
	evaluateVitalRisk
};
