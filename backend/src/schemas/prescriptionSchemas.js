const { z, objectId } = require('./common');

const prescriptionIdParamsSchema = z.object({
  prescriptionId: objectId
});

module.exports = {
  prescriptionIdParamsSchema
};
