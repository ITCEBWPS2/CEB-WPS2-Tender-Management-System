const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET not set in environment');
  process.exit(1);
}

const protect = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'Token error' });
  
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ 
        message: 'Access denied. User session context not discovered.' 
      });
    }

    // 🎯 Dynamically expand permitted roles to natively bridge legacy and standardized roles
    const expandedRoles = [];
    allowedRoles.forEach(role => {
      const cleanRole = role.toLowerCase().trim();
      expandedRoles.push(cleanRole);
      
      if (cleanRole === 'commercial user') expandedRoles.push('clerk');
      if (cleanRole === 'clerk') expandedRoles.push('commercial user');
      if (cleanRole === 'c.com user') expandedRoles.push('cecom');
      if (cleanRole === 'cecom') expandedRoles.push('c.com user');
    });

    const currentUserRole = (req.user.role || '').toLowerCase().trim();

    if (!expandedRoles.includes(currentUserRole)) {
      return res.status(403).json({ 
        message: `Access denied. Your role '${req.user.role || 'Guest'}' is not authorized to access this function.` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };