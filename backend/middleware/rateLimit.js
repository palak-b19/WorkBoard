const rateLimit = require('express-rate-limit');
const timelimit = 15 * 60 * 1000;

module.exports = rateLimit({
  windowMs: timelimit,
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  /* standardHeaders: true - Enables standard rate limit headers:

  RateLimit-Limit: Maximum requests allowed
  RateLimit-Remaining: Requests left in current window
  RateLimit-Reset: When the window resets
  
  
  legacyHeaders: false - Disables old-style headers:
  
  X-RateLimit-Limit
  X-RateLimit-Remaining
  X-RateLimit-Reset*/
  legacyHeaders: false,
});
