module.exports = (err, req, res, next) => {
  console.error('Express Error:', err);
  const status = err.status || err.statusCode || 500;
  if (status >= 400 && status < 500) {
    return res.status(status).json({ message: err.message || 'Client Error' });
  }
  return res.status(500).json({ message: 'An unexpected error occurred' });
};
