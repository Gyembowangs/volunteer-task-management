exports.isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.isAdmin) {
    return res.redirect('/login');
  }
  next();
};
