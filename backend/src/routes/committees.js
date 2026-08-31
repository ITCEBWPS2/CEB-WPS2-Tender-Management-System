const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/committeeController');
const { validateCreateCommittee, validateUpdateCommittee } = require('../validators/committeeValidator');

// All authenticated core roles can view the TEC committees list
router.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.list);

// CECOM given full administrative power to create TEC committees alongside Admin and Procurement
router.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateCreateCommittee, ctrl.create);

// Individual committee lookup allowed for all system management roles
router.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), ctrl.get);

// CECOM authorized to modify existing TEC committee records
router.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateUpdateCommittee, ctrl.update);

// CECOM granted hard delete permissions for committee configurations alongside Admin
router.delete('/:id', protect, authorize('Admin', 'CECOM'), ctrl.remove);

module.exports = router;