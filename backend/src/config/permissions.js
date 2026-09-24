const RESOURCES = ['records', 'categories', 'departments', 'staff', 'bidders', 'committees'];

const PERMISSIONS = {
  add: ['Admin', 'Super Admin', 'Procurement', 'Clerk'],
  edit: ['Admin', 'Super Admin', 'Procurement', 'Clerk'],
  delete: ['Admin', 'Super Admin'],
  view: ['Admin', 'Super Admin', 'Procurement', 'Clerk', 'CECOM', 'User'],
};

module.exports = { RESOURCES, PERMISSIONS };
module.exports.RESOURCES = RESOURCES;
module.exports.PERMISSIONS = PERMISSIONS;
module.exports.default = { RESOURCES, PERMISSIONS };
