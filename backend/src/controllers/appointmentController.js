const Appointment = require('../models/Appointment');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const { createNotification } = require('../services/notificationService');
const { logAuditSafe } = require('../services/auditService');

async function ensureDoctorConnected(patientId, doctorId) {
  return PatientProfile.findOne({
    userId: patientId,
    connectedDoctorIds: doctorId
  });
}

async function getMyAppointmentsAsPatient(req, res, next) {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.find({ patientId })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'fullName email phone')
      .lean();

    res.json({ success: true, data: { appointments } });
  } catch (error) {
    next(error);
  }
}

async function createMyAppointment(req, res, next) {
  try {
    const patientId = req.user.id;
    const { doctorId, type, date, time, notes } = req.body;

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) {
      const error = new Error('Doctor not found');
      error.statusCode = 404;
      throw error;
    }

    const connected = await ensureDoctorConnected(patientId, doctorId);
    if (!connected) {
      const error = new Error('Doctor is not connected to patient');
      error.statusCode = 403;
      throw error;
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      type: type || 'in_person',
      date,
      time,
      notes,
      status: 'pending',
      createdBy: 'patient'
    });

    await createNotification({
      userId: doctorId,
      type: 'appointment',
      title: 'New Appointment Request',
      body: 'A patient has requested an appointment.',
      metadata: { appointmentId: appointment._id, patientId }
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyAppointment(req, res, next) {
  try {
    const patientId = req.user.id;
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({ _id: appointmentId, patientId });
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      const error = new Error('Completed or cancelled appointments cannot be edited');
      error.statusCode = 400;
      throw error;
    }

    const { type, date, time, notes } = req.body;
    if (type !== undefined) appointment.type = type;
    if (date !== undefined) appointment.date = date;
    if (time !== undefined) appointment.time = time;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
}

async function cancelMyAppointment(req, res, next) {
  try {
    const patientId = req.user.id;
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({ _id: appointmentId, patientId });
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    appointment.status = 'cancelled';
    await appointment.save();

    await createNotification({
      userId: appointment.doctorId,
      type: 'appointment',
      title: 'Appointment Cancelled',
      body: 'A patient cancelled an appointment.',
      metadata: { appointmentId: appointment._id, patientId }
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyAppointmentsAsDoctor(req, res, next) {
  try {
    const doctorId = req.user.id;

    const appointments = await Appointment.find({ doctorId })
      .sort({ createdAt: -1 })
      .populate('patientId', 'fullName email phone')
      .lean();

    res.json({ success: true, data: { appointments } });
  } catch (error) {
    next(error);
  }
}

async function updateMyAppointmentAsDoctor(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId });
    if (!appointment) {
      const error = new Error('Appointment not found');
      error.statusCode = 404;
      throw error;
    }

    const { status, notes, date, time, type } = req.body;
    if (status !== undefined) appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;
    if (date !== undefined) appointment.date = date;
    if (time !== undefined) appointment.time = time;
    if (type !== undefined) appointment.type = type;

    await appointment.save();

    await createNotification({
      userId: appointment.patientId,
      type: 'appointment',
      title: 'Appointment Updated',
      body: `Your appointment status is now ${appointment.status}.`,
      metadata: { appointmentId: appointment._id, status: appointment.status }
    });

    await logAuditSafe({
      actorId: doctorId,
      actorRole: 'doctor',
      action: 'appointment_updated',
      entityType: 'appointment',
      entityId: appointment._id,
      details: { status: appointment.status }
    });

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyAppointmentsAsPatient,
  createMyAppointment,
  updateMyAppointment,
  cancelMyAppointment,
  getMyAppointmentsAsDoctor,
  updateMyAppointmentAsDoctor
};
