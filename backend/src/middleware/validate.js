const { ZodError } = require('zod');

module.exports = function validate(schemas = {}) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        error.statusCode = 400;
        error.message = 'Validation failed';
        error.errors = error.issues.map((issue) => ({
          field: issue.path.join('.') || 'request',
          message: issue.message
        }));
      }
      next(error);
    }
  };
};