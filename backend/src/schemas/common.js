const { z } = require('zod');

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');
const legalDocumentContentType = z
  .string()
  .refine(
    (value) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(String(value).toLowerCase()),
    'Document must be a PDF, JPG, or PNG file'
  );

module.exports = {
  z,
  objectId,
  legalDocumentContentType
};
