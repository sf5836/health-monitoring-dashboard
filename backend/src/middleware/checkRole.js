module.exports = function checkRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !req.user.role) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error('Forbidden');
      error.statusCode = 403;
      return next(error);
    }

    return next();
  };
};