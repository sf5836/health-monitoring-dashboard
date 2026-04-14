const Prescription = require('../models/Prescription');

async function getMyPrescriptions(req, res, next) {
  try {
    const patientId = req.user.id;

    const prescriptions = await Prescription.find({ patientId })
      .sort({ issuedAt: -1 })
      .populate('doctorId', 'fullName email phone')
      .lean();

    res.json({
      success: true,
      data: { prescriptions }
    });
  } catch (error) {
    next(error);
  }
}

async function getPrescriptionPdf(req, res, next) {
  try {
    const patientId = req.user.id;
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findOne({ _id: prescriptionId, patientId }).lean();
    if (!prescription) {
      const error = new Error('Prescription not found');
      error.statusCode = 404;
      throw error;
    }

    const fallbackPdfUrl = `http://localhost:5000/api/prescriptions/me/${prescriptionId}/pdf`;

    res.json({
      success: true,
      data: {
        prescriptionId,
        pdfUrl: prescription.pdfUrl || fallbackPdfUrl
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyPrescriptions,
  getPrescriptionPdf
};
