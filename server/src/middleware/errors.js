function notFound(_req, res) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }); }
function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' } });
  if (err.name === 'ValidationError') return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: Object.values(err.errors).map(e => e.message).join(' ') } });
  if (err.name === 'CastError') return res.status(400).json({ error: { code: 'INVALID_ID', message: 'The supplied identifier is invalid.' } });
  if (err.code === 11000) return res.status(409).json({ error: { code: 'DUPLICATE', message: 'A record with that value already exists.' } });
  console.error('Request failed:', err.message);
  res.status(err.status || 500).json({ error: { code: err.codeName || 'INTERNAL_ERROR', message: err.status ? err.message : 'An unexpected error occurred.' } });
}
module.exports = { notFound, errorHandler };
