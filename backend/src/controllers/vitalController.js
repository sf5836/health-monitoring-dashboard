const mongoose = require('mongoose');

const VitalRecord = require('../models/VitalRecord');
const PatientProfile = require('../models/PatientProfile');
const { evaluateVitalRisk } = require('../services/riskEngine');
const { createNotification } = require('../services/notificationService');

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function buildUpdatablePayload(body) {
  const allowed = [
    'datetime',
    'bloodPressure',
    'heartRate',
    'spo2',
    'temperatureC',
    'glucose',
    'weightKg',
    'notes'
  ];

  const payload = {};
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  }

  return payload;
}

async function notifyRiskIfNeeded(patientId, riskLevel, riskReasons) {
  if (!['medium', 'high'].includes(riskLevel)) {
    return;
  }

  const recipients = new Set([String(patientId)]);
  const profile = await PatientProfile.findOne({ userId: patientId }).select('connectedDoctorIds').lean();
  for (const doctorId of profile?.connectedDoctorIds || []) {
    recipients.add(String(doctorId));
  }

  const title = riskLevel === 'high' ? 'High Risk Vital Alert' : 'Medium Risk Vital Alert';
  const body = riskReasons?.length
    ? `Detected risk reasons: ${riskReasons.join(', ')}`
    : 'A new vital entry needs review.';

  await Promise.all(
    [...recipients].map((userId) =>
      createNotification({
        userId,
        type: 'risk_alert',
        title,
        body,
        metadata: {
          patientId: String(patientId),
          riskLevel,
          riskReasons
        }
      })
    )
  );
}

async function getMyVitals(req, res, next) {
  try {
    const patientId = req.user.id;
    const limit = Math.min(Number(req.query.limit || 50), 200);

    const vitals = await VitalRecord.find({ patientId })
      .sort({ datetime: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: { vitals }
    });
  } catch (error) {
    next(error);
  }
}

async function createMyVital(req, res, next) {
  try {
    const patientId = req.user.id;
    const payload = buildUpdatablePayload(req.body);

    const { riskLevel, riskReasons } = evaluateVitalRisk(payload);

    const vital = await VitalRecord.create({
      patientId,
      ...payload,
      riskLevel,
      riskReasons
    });

    await notifyRiskIfNeeded(patientId, riskLevel, riskReasons);

    res.status(201).json({
      success: true,
      message: 'Vital record created successfully',
      data: { vital }
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyVital(req, res, next) {
  try {
    const patientId = req.user.id;
    const { vitalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vitalId)) {
      throw badRequest('Invalid vitalId');
    }

    const vital = await VitalRecord.findOne({ _id: vitalId, patientId });
    if (!vital) {
      const error = new Error('Vital record not found');
      error.statusCode = 404;
      throw error;
    }

    const payload = buildUpdatablePayload(req.body);
    Object.assign(vital, payload);

    const { riskLevel, riskReasons } = evaluateVitalRisk(vital);
    vital.riskLevel = riskLevel;
    vital.riskReasons = riskReasons;

    await vital.save();
    await notifyRiskIfNeeded(patientId, riskLevel, riskReasons);

    res.json({
      success: true,
      message: 'Vital record updated successfully',
      data: { vital }
    });
  } catch (error) {
    next(error);
  }
}

async function deleteMyVital(req, res, next) {
  try {
    const patientId = req.user.id;
    const { vitalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vitalId)) {
      throw badRequest('Invalid vitalId');
    }

    const deleted = await VitalRecord.findOneAndDelete({ _id: vitalId, patientId });
    if (!deleted) {
      const error = new Error('Vital record not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Vital record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getMyTrends(req, res, next) {
  try {
    const patientId = req.user.id;
    const days = Math.min(Math.max(Number(req.query.days || 30), 1), 365);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const vitals = await VitalRecord.find({ patientId, datetime: { $gte: since } })
      .sort({ datetime: 1 })
      .lean();

    const average = {
      heartRate: null,
      spo2: null,
      temperatureC: null,
      weightKg: null,
      systolic: null,
      diastolic: null
    };

    if (vitals.length > 0) {
      const totals = vitals.reduce(
        (acc, entry) => {
          if (Number.isFinite(entry.heartRate)) acc.heartRate += entry.heartRate;
          if (Number.isFinite(entry.spo2)) acc.spo2 += entry.spo2;
          if (Number.isFinite(entry.temperatureC)) acc.temperatureC += entry.temperatureC;
          if (Number.isFinite(entry.weightKg)) acc.weightKg += entry.weightKg;
          if (Number.isFinite(entry?.bloodPressure?.systolic)) {
            acc.systolic += entry.bloodPressure.systolic;
          }
          if (Number.isFinite(entry?.bloodPressure?.diastolic)) {
            acc.diastolic += entry.bloodPressure.diastolic;
          }
          return acc;
        },
        {
          heartRate: 0,
          spo2: 0,
          temperatureC: 0,
          weightKg: 0,
          systolic: 0,
          diastolic: 0
        }
      );

      average.heartRate = Number((totals.heartRate / vitals.length).toFixed(2));
      average.spo2 = Number((totals.spo2 / vitals.length).toFixed(2));
      average.temperatureC = Number((totals.temperatureC / vitals.length).toFixed(2));
      average.weightKg = Number((totals.weightKg / vitals.length).toFixed(2));
      average.systolic = Number((totals.systolic / vitals.length).toFixed(2));
      average.diastolic = Number((totals.diastolic / vitals.length).toFixed(2));
    }

    res.json({
      success: true,
      data: {
        periodDays: days,
        totalRecords: vitals.length,
        average,
        vitals
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyVitals,
  createMyVital,
  updateMyVital,
  deleteMyVital,
  getMyTrends
};
