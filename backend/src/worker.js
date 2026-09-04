import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { jwtVerify } from 'jose';
import Joi from 'joi';

import supabase from './config/supabase.js';
import AuditLog from './utils/auditLogger.js';

const app = new Hono();
const STORAGE_BUCKET = 'record-documents';

// ---------------------------------------------------------------------------
// Core Middleware Configuration
// ---------------------------------------------------------------------------

// 1. Security Headers (Helmet Equivalent)
app.use('*', secureHeaders());

// 2. CORS Setup
app.use('*', async (c, next) => {
  const corsOrigin = c.env?.CORS_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = corsOrigin.split(',').map(o => o.trim()).filter(Boolean);

  return cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return origin;
      }
      return null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  })(c, next);
});

// 3. Rate Limiting Note:
// express-rate-limit is omitted for Workers serverless environment.
// In production on Cloudflare Workers, rate limiting will be enforced via Cloudflare Rate Limiting Bindings or WAF rules.

// 4. Auth & Authorization Middleware (Web-Standard using 'jose')
const protect = async (c, next) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader) {
    return c.json({ message: 'No token provided' }, 401);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return c.json({ message: 'Token error' }, 401);
  }

  const token = parts[1];
  const secretStr = c.env?.JWT_SECRET || process.env.JWT_SECRET || 'super_secret_jwt_key_12345';
  const secretKey = new TextEncoder().encode(secretStr);

  try {
    const { payload } = await jwtVerify(token, secretKey);
    c.set('user', payload);
    await next();
  } catch (err) {
    return c.json({ message: 'Invalid token' }, 401);
  }
};

const authorize = (...allowedRoles) => {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ message: 'Access denied. User session context not discovered.' }, 403);
    }

    const expandedRoles = [];
    allowedRoles.forEach(role => {
      const cleanRole = role.toLowerCase().trim();
      expandedRoles.push(cleanRole);
      if (cleanRole === 'commercial user') expandedRoles.push('clerk');
      if (cleanRole === 'clerk') expandedRoles.push('commercial user');
      if (cleanRole === 'c.com user') expandedRoles.push('cecom');
      if (cleanRole === 'cecom') expandedRoles.push('c.com user');
    });

    const currentUserRole = (user.role || '').toLowerCase().trim();

    if (!expandedRoles.includes(currentUserRole)) {
      return c.json({
        message: `Access denied. Your role '${user.role || 'Guest'}' is not authorized to access this function.`
      }, 403);
    }

    await next();
  };
};

// 5. Global Error Handling
app.onError((err, c) => {
  console.error('Worker error:', err);
  const status = err.status || err.statusCode || 500;
  return c.json({ message: err.message || 'Server Error' }, status);
});

// Helper for Joi body validation
const validateBody = (schema) => async (c, next) => {
  const body = await c.req.json().catch(() => ({}));
  const { error } = schema.validate(body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    return c.json({ message }, 400);
  }
  c.set('parsedBody', body);
  await next();
};

const dateOrString = Joi.alternatives().try(Joi.date(), Joi.string().allow('', null));

// ---------------------------------------------------------------------------
// 1. CATEGORIES RESOURCE (/api/categories)
// ---------------------------------------------------------------------------

const formatCategory = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description || '',
    status: row.status || 'Active',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const createCategorySchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().allow('', null),
  description: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

const categories = new Hono();

categories.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return c.json((data || []).map(formatCategory));
});

categories.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(createCategorySchema), async (c) => {
  const body = c.get('parsedBody');
  const user = c.get('user');

  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: body.name, description: body.description || null, status: body.status || 'Active' }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return c.json({ message: 'Category name already exists' }, 400);
    throw error;
  }

  const item = formatCategory(data);
  await AuditLog.create({ user: user?.email, type: 'create:category', message: `Created category ${item.name}` }).catch(err => console.error(err));
  return c.json(item, 201);
});

categories.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return c.json({ message: 'Not found' }, 404);
  return c.json(formatCategory(data));
});

categories.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(updateCategorySchema), async (c) => {
  const id = c.req.param('id');
  const body = c.get('parsedBody');
  const user = c.get('user');

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status;

  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Category name already exists' }, 400);
    throw error;
  }
  if (!data) return c.json({ message: 'Not found' }, 404);

  const item = formatCategory(data);
  await AuditLog.create({ user: user?.email, type: 'update:category', message: `Updated category ${item.name}` }).catch(err => console.error(err));
  return c.json(item);
});

categories.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;

  if (item) {
    await AuditLog.create({ user: user?.email, type: 'delete:category', message: `Deleted category ${item.name}` }).catch(err => console.error(err));
  }
  return c.json({ message: 'Deleted' });
});

app.route('/api/categories', categories);

// ---------------------------------------------------------------------------
// 2. DEPARTMENTS RESOURCE (/api/departments)
// ---------------------------------------------------------------------------

const formatDepartment = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name || '',
    code: row.code || '',
    description: row.description || '',
    headOfDepartment: row.head_of_department || '',
    status: row.status || 'Active',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().required(),
  code: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  headOfDepartment: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim().allow('', null),
  code: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  headOfDepartment: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

const departments = new Hono();

departments.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const { data, error } = await supabase.from('departments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return c.json((data || []).map(formatDepartment));
});

departments.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(createDepartmentSchema), async (c) => {
  const body = c.get('parsedBody');
  const user = c.get('user');

  const insertData = {
    name: body.name || null,
    code: body.code || null,
    description: body.description || null,
    head_of_department: body.headOfDepartment !== undefined ? body.headOfDepartment : (body.head_of_department || null),
    status: body.status || 'Active'
  };

  const { data, error } = await supabase.from('departments').insert([insertData]).select().single();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Department already exists' }, 400);
    throw error;
  }

  const item = formatDepartment(data);
  await AuditLog.create({ user: user?.email, type: 'create:department', message: `Created department ${item.name} (${item.code})` }).catch(err => console.error(err));
  return c.json(item, 201);
});

departments.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase.from('departments').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return c.json({ message: 'Not found' }, 404);
  return c.json(formatDepartment(data));
});

departments.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(updateDepartmentSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.get('parsedBody');
  const user = c.get('user');

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.code !== undefined) updates.code = body.code;
  if (body.description !== undefined) updates.description = body.description;
  if (body.headOfDepartment !== undefined) updates.head_of_department = body.headOfDepartment;
  else if (body.head_of_department !== undefined) updates.head_of_department = body.head_of_department;
  if (body.status !== undefined) updates.status = body.status;

  const { data, error } = await supabase.from('departments').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Department already exists' }, 400);
    throw error;
  }
  if (!data) return c.json({ message: 'Not found' }, 404);

  const item = formatDepartment(data);
  await AuditLog.create({ user: user?.email, type: 'update:department', message: `Updated department ${item.name}` }).catch(err => console.error(err));
  return c.json(item);
});

departments.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase.from('departments').select('*').eq('id', id).maybeSingle();
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw error;

  if (item) {
    await AuditLog.create({ user: user?.email, type: 'delete:department', message: `Deleted department ${item.name}` }).catch(err => console.error(err));
  }
  return c.json({ message: 'Deleted' });
});

app.route('/api/departments', departments);

// ---------------------------------------------------------------------------
// 3. STAFF RESOURCE (/api/staff)
// ---------------------------------------------------------------------------

const formatStaff = (row) => {
  if (!row) return null;
  const dept = row.departments || null;
  const formattedDept = dept ? {
    _id: dept.id,
    id: dept.id,
    name: dept.name || '',
    code: dept.code || '',
    description: dept.description || '',
    headOfDepartment: dept.head_of_department || '',
    status: dept.status || 'Active'
  } : null;

  return {
    _id: row.id,
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    area: row.area || '',
    designation: row.designation || '',
    department_id: row.department_id || null,
    department: formattedDept || row.department_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const extractDepartmentId = (body) => {
  if (!body) return null;
  if (body.department_id && typeof body.department_id === 'string' && body.department_id.trim() !== '') {
    return body.department_id.trim();
  }
  if (body.department) {
    if (typeof body.department === 'string' && body.department.trim() !== '') {
      return body.department.trim();
    }
    if (typeof body.department === 'object' && body.department.id) {
      return body.department.id;
    }
  }
  return null;
};

const createStaffSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().allow('', null),
  area: Joi.string().allow('', null),
  designation: Joi.string().allow('', null),
  department: Joi.string().allow('', null)
});

const updateStaffSchema = Joi.object({
  name: Joi.string().trim().allow('', null),
  email: Joi.string().allow('', null),
  area: Joi.string().allow('', null),
  designation: Joi.string().allow('', null),
  department: Joi.string().allow('', null)
});

const staff = new Hono();

staff.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const { data, error } = await supabase.from('staff').select('*, departments(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return c.json((data || []).map(formatStaff));
});

staff.post('/', protect, authorize('Admin', 'CECOM'), validateBody(createStaffSchema), async (c) => {
  const body = c.get('parsedBody');
  const user = c.get('user');

  const departmentId = extractDepartmentId(body);
  const insertData = {
    name: body.name || null,
    email: body.email || null,
    area: body.area || null,
    designation: body.designation || null,
    department_id: departmentId
  };

  const { data: inserted, error } = await supabase.from('staff').insert([insertData]).select('*, departments(*)').single();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Staff member already exists' }, 400);
    throw error;
  }

  const item = formatStaff(inserted);
  await AuditLog.create({ user: user?.email, type: 'create:staff', message: `Created staff ${item.name}` }).catch(err => console.error(err));
  return c.json(item, 201);
});

staff.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase.from('staff').select('*, departments(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return c.json({ message: 'Not found' }, 404);
  return c.json(formatStaff(data));
});

staff.put('/:id', protect, authorize('Admin', 'CECOM'), validateBody(updateStaffSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.get('parsedBody');
  const user = c.get('user');

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.email !== undefined) updates.email = body.email;
  if (body.area !== undefined) updates.area = body.area;
  if (body.designation !== undefined) updates.designation = body.designation;

  const departmentId = extractDepartmentId(body);
  if (departmentId !== null || body.department !== undefined || body.department_id !== undefined) {
    updates.department_id = departmentId;
  }

  const { data: updated, error } = await supabase.from('staff').update(updates).eq('id', id).select('*, departments(*)').maybeSingle();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Staff member already exists' }, 400);
    throw error;
  }
  if (!updated) return c.json({ message: 'Not found' }, 404);

  const item = formatStaff(updated);
  await AuditLog.create({ user: user?.email, type: 'update:staff', message: `Updated staff ${item.name}` }).catch(err => console.error(err));
  return c.json(item);
});

staff.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase.from('staff').select('*').eq('id', id).maybeSingle();
  const { error } = await supabase.from('staff').delete().eq('id', id);
  if (error) throw error;

  if (item) {
    await AuditLog.create({ user: user?.email, type: 'delete:staff', message: `Deleted staff ${item.name}` }).catch(err => console.error(err));
  }
  return c.json({ message: 'Deleted' });
});

app.route('/api/staff', staff);

// ---------------------------------------------------------------------------
// 4. BIDDERS RESOURCE (/api/bidders)
// ---------------------------------------------------------------------------

const formatBidder = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    address: row.address || '',
    contact: row.contact || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const createBidderSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  contact: Joi.string().allow('', null)
});

const updateBidderSchema = Joi.object({
  name: Joi.string().trim().allow('', null),
  email: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  contact: Joi.string().allow('', null)
});

const bidders = new Hono();

bidders.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const { data, error } = await supabase.from('bidders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return c.json((data || []).map(formatBidder));
});

bidders.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(createBidderSchema), async (c) => {
  const body = c.get('parsedBody');
  const user = c.get('user');

  const insertData = { name: body.name || null, email: body.email || null, address: body.address || null, contact: body.contact || null };
  const { data, error } = await supabase.from('bidders').insert([insertData]).select().single();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Supplier/Bidder already exists' }, 400);
    throw error;
  }

  const item = formatBidder(data);
  await AuditLog.create({ user: user?.email, type: 'create:bidder', message: `Created bidder ${item.name}` }).catch(err => console.error(err));
  return c.json(item, 201);
});

bidders.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase.from('bidders').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return c.json({ message: 'Not found' }, 404);
  return c.json(formatBidder(data));
});

bidders.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(updateBidderSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.get('parsedBody');
  const user = c.get('user');

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.email !== undefined) updates.email = body.email;
  if (body.address !== undefined) updates.address = body.address;
  if (body.contact !== undefined) updates.contact = body.contact;

  const { data, error } = await supabase.from('bidders').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Supplier/Bidder already exists' }, 400);
    throw error;
  }
  if (!data) return c.json({ message: 'Not found' }, 404);

  const item = formatBidder(data);
  await AuditLog.create({ user: user?.email, type: 'update:bidder', message: `Updated bidder ${item.name}` }).catch(err => console.error(err));
  return c.json(item);
});

bidders.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase.from('bidders').select('*').eq('id', id).maybeSingle();
  const { error } = await supabase.from('bidders').delete().eq('id', id);
  if (error) throw error;

  if (item) {
    await AuditLog.create({ user: user?.email, type: 'delete:bidder', message: `Deleted bidder ${item.name}` }).catch(err => console.error(err));
  }
  return c.json({ message: 'Deleted' });
});

app.route('/api/bidders', bidders);

// ---------------------------------------------------------------------------
// 5. COMMITTEES RESOURCE (/api/committees)
// ---------------------------------------------------------------------------

const formatCommittee = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    committeeNumber: row.committee_number || '',
    member1: row.member1 || '',
    member2: row.member2 || '',
    member3: row.member3 || '',
    additionalMembers: Array.isArray(row.additional_members) ? row.additional_members : [],
    appointedDate: row.appointed_date ? String(row.appointed_date).slice(0, 10) : '',
    status: row.status || 'Active',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const createCommitteeSchema = Joi.object({
  committeeNumber: Joi.string().trim().required(),
  member1: Joi.string().trim().required(),
  member2: Joi.string().trim().required(),
  member3: Joi.string().trim().required(),
  additionalMembers: Joi.array().items(Joi.string().allow('', null)).optional(),
  appointedDate: dateOrString.required(),
  status: Joi.string().allow('', null)
});

const updateCommitteeSchema = Joi.object({
  committeeNumber: Joi.string().trim().allow('', null),
  member1: Joi.string().trim().allow('', null),
  member2: Joi.string().trim().allow('', null),
  member3: Joi.string().trim().allow('', null),
  additionalMembers: Joi.array().items(Joi.string().allow('', null)).optional(),
  appointedDate: dateOrString,
  status: Joi.string().allow('', null)
});

const committees = new Hono();

committees.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const { data, error } = await supabase.from('committees').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return c.json((data || []).map(formatCommittee));
});

committees.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(createCommitteeSchema), async (c) => {
  const body = c.get('parsedBody');
  const user = c.get('user');

  const committeeNumber = body.committeeNumber || body.committee_number;
  const additionalMembers = Array.isArray(body.additionalMembers)
    ? body.additionalMembers
    : (Array.isArray(body.additional_members) ? body.additional_members : []);
  const appointedDate = body.appointedDate || body.appointed_date;

  const insertData = {
    committee_number: committeeNumber || null,
    member1: body.member1 || null,
    member2: body.member2 || null,
    member3: body.member3 || null,
    additional_members: additionalMembers,
    appointed_date: appointedDate ? String(appointedDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    status: body.status || 'Active'
  };

  const { data, error } = await supabase.from('committees').insert([insertData]).select().single();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Committee number already exists' }, 400);
    throw error;
  }

  const item = formatCommittee(data);
  await AuditLog.create({ user: user?.email, type: 'create:committee', message: `Created committee ${item.committeeNumber}` }).catch(err => console.error(err));
  return c.json(item, 201);
});

committees.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase.from('committees').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return c.json({ message: 'Not found' }, 404);
  return c.json(formatCommittee(data));
});

committees.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(updateCommitteeSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.get('parsedBody');
  const user = c.get('user');

  const updates = {};
  if (body.committeeNumber !== undefined) updates.committee_number = body.committeeNumber;
  else if (body.committee_number !== undefined) updates.committee_number = body.committee_number;

  if (body.member1 !== undefined) updates.member1 = body.member1;
  if (body.member2 !== undefined) updates.member2 = body.member2;
  if (body.member3 !== undefined) updates.member3 = body.member3;

  if (body.additionalMembers !== undefined) {
    updates.additional_members = Array.isArray(body.additionalMembers) ? body.additionalMembers : [];
  } else if (body.additional_members !== undefined) {
    updates.additional_members = Array.isArray(body.additional_members) ? body.additional_members : [];
  }

  if (body.appointedDate !== undefined) updates.appointed_date = String(body.appointedDate).slice(0, 10);
  else if (body.appointed_date !== undefined) updates.appointed_date = String(body.appointed_date).slice(0, 10);

  if (body.status !== undefined) updates.status = body.status;

  const { data, error } = await supabase.from('committees').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Committee number already exists' }, 400);
    throw error;
  }
  if (!data) return c.json({ message: 'Not found' }, 404);

  const item = formatCommittee(data);
  await AuditLog.create({ user: user?.email, type: 'update:committee', message: `Updated committee ${item.committeeNumber}` }).catch(err => console.error(err));
  return c.json(item);
});

committees.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase.from('committees').select('*').eq('id', id).maybeSingle();
  const { error } = await supabase.from('committees').delete().eq('id', id);
  if (error) throw error;

  if (item) {
    await AuditLog.create({ user: user?.email, type: 'delete:committee', message: `Deleted committee ${item.committee_number || item.id}` }).catch(err => console.error(err));
  }
  return c.json({ message: 'Deleted' });
});

app.route('/api/committees', committees);

// ---------------------------------------------------------------------------
// 6. RECORDS RESOURCE (/api/records) + DOCUMENT MANAGEMENT
// ---------------------------------------------------------------------------

const formatRecordDocument = (doc) => {
  if (!doc) return null;
  return {
    _id: doc.id,
    id: doc.id,
    filename: doc.file_name || '',
    originalName: doc.file_name || '',
    filePath: doc.file_path || '',
    mimeType: doc.mime_type || '',
    size: Number(doc.file_size || 0),
    uploadedBy: '',
    uploadedByName: 'Staff Member',
    uploadedByEmail: '',
    uploadedAt: doc.uploaded_at
  };
};

const formatRecord = (row, documents = []) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    tenderNumber: row.tender_number || '',
    relevantTo: row.relevant_to || '',
    category: row.category || '',
    description: row.description || '',
    other: row.other || '',
    bidStartDate: row.bid_start_date || null,
    bidOpenDate: row.bid_open_date || null,
    bidClosingDate: row.bid_closing_date || null,
    approvedDate: row.approved_date || null,
    fileSentToTecDate: row.file_sent_to_tec_date || null,
    fileSentToTecSecondTime: row.file_sent_to_tec_second_time || null,
    bidBondNumber: row.bid_bond_number || '',
    bidBondBank: row.bid_bond_bank || '',
    bidValidityPeriod: row.bid_validity_period || null,
    remark: row.remark || '',
    status: row.status || 'Under Evaluation',
    tecCommitteeNumber: row.tec_committee_number || '',
    tecChairman: row.tec_chairman || '',
    tecMember1: row.tec_member1 || '',
    tecMember2: row.tec_member2 || '',
    awardedTo: row.awarded_to || '',
    serviceAgreementStartDate: row.service_agreement_start_date || null,
    serviceAgreementEndDate: row.service_agreement_end_date || null,
    performanceBondNumber: row.performance_bond_number || '',
    performanceBondBank: row.performance_bond_bank || '',
    performanceBondRemark: row.performance_bond_remark || '',
    delay: row.delay !== null && row.delay !== undefined ? Number(row.delay) : 0,
    documents: documents.map(formatRecordDocument),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapRecordInput = (body) => {
  const result = {};
  if (body.tenderNumber !== undefined) result.tender_number = body.tenderNumber;
  else if (body.tender_number !== undefined) result.tender_number = body.tender_number;

  if (body.relevantTo !== undefined) result.relevant_to = body.relevantTo;
  if (body.category !== undefined) result.category = body.category;
  if (body.description !== undefined) result.description = body.description;
  if (body.other !== undefined) result.other = body.other;

  if (body.bidStartDate !== undefined) result.bid_start_date = body.bidStartDate ? String(body.bidStartDate).slice(0, 10) : null;
  if (body.bidOpenDate !== undefined) result.bid_open_date = body.bidOpenDate ? String(body.bidOpenDate).slice(0, 10) : null;
  if (body.bidClosingDate !== undefined) result.bid_closing_date = body.bidClosingDate ? String(body.bidClosingDate).slice(0, 10) : null;
  if (body.approvedDate !== undefined) result.approved_date = body.approvedDate ? String(body.approvedDate).slice(0, 10) : null;
  if (body.fileSentToTecDate !== undefined) result.file_sent_to_tec_date = body.fileSentToTecDate ? String(body.fileSentToTecDate).slice(0, 10) : null;
  if (body.fileSentToTecSecondTime !== undefined) result.file_sent_to_tec_second_time = body.fileSentToTecSecondTime ? String(body.fileSentToTecSecondTime).slice(0, 10) : null;

  if (body.bidBondNumber !== undefined) result.bid_bond_number = body.bidBondNumber;
  if (body.bidBondBank !== undefined) result.bid_bond_bank = body.bidBondBank;
  if (body.bidValidityPeriod !== undefined) result.bid_validity_period = body.bidValidityPeriod ? String(body.bidValidityPeriod).slice(0, 10) : null;
  if (body.remark !== undefined) result.remark = body.remark;
  if (body.status !== undefined) result.status = body.status;

  if (body.tecCommitteeNumber !== undefined) result.tec_committee_number = body.tecCommitteeNumber;
  if (body.tecChairman !== undefined) result.tec_chairman = body.tecChairman;
  if (body.tecMember1 !== undefined) result.tec_member1 = body.tecMember1;
  if (body.tecMember2 !== undefined) result.tec_member2 = body.tecMember2;

  if (body.awardedTo !== undefined) result.awarded_to = body.awardedTo;
  if (body.serviceAgreementStartDate !== undefined) result.service_agreement_start_date = body.serviceAgreementStartDate ? String(body.serviceAgreementStartDate).slice(0, 10) : null;
  if (body.serviceAgreementEndDate !== undefined) result.service_agreement_end_date = body.serviceAgreementEndDate ? String(body.serviceAgreementEndDate).slice(0, 10) : null;
  if (body.performanceBondNumber !== undefined) result.performance_bond_number = body.performanceBondNumber;
  if (body.performanceBondBank !== undefined) result.performance_bond_bank = body.performanceBondBank;
  if (body.performanceBondRemark !== undefined) result.performance_bond_remark = body.performanceBondRemark;

  if (body.delay !== undefined && body.delay !== null) result.delay = Number(body.delay);

  return result;
};

const getDocumentsForRecord = async (recordId) => {
  const { data } = await supabase
    .from('record_documents')
    .select('*')
    .eq('record_id', recordId)
    .order('uploaded_at', { ascending: true });
  return data || [];
};

const createRecordSchema = Joi.object({
  tenderNumber: Joi.string().trim().required(),
  relevantTo: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  other: Joi.string().allow('', null),
  bidStartDate: dateOrString,
  bidOpenDate: dateOrString,
  bidClosingDate: dateOrString,
  approvedDate: dateOrString,
  fileSentToTecDate: dateOrString,
  fileSentToTecSecondTime: dateOrString,
  bidBondNumber: Joi.string().allow('', null),
  bidBondBank: Joi.string().allow('', null),
  bidValidityPeriod: dateOrString,
  remark: Joi.string().allow('', null),
  status: Joi.string().allow('', null),
  tecCommitteeNumber: Joi.string().allow('', null),
  tecChairman: Joi.string().allow('', null),
  tecMember1: Joi.string().allow('', null),
  tecMember2: Joi.string().allow('', null),
  awardedTo: Joi.string().allow('', null),
  serviceAgreementStartDate: dateOrString,
  serviceAgreementEndDate: dateOrString,
  performanceBondNumber: Joi.string().allow('', null),
  performanceBondBank: Joi.string().allow('', null),
  performanceBondRemark: Joi.string().allow('', null),
  delay: Joi.number().allow(null)
});

const updateRecordSchema = Joi.object({
  tenderNumber: Joi.string().trim().allow('', null),
  relevantTo: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  other: Joi.string().allow('', null),
  bidStartDate: dateOrString,
  bidOpenDate: dateOrString,
  bidClosingDate: dateOrString,
  approvedDate: dateOrString,
  fileSentToTecDate: dateOrString,
  fileSentToTecSecondTime: dateOrString,
  bidBondNumber: Joi.string().allow('', null),
  bidBondBank: Joi.string().allow('', null),
  bidValidityPeriod: dateOrString,
  remark: Joi.string().allow('', null),
  status: Joi.string().allow('', null),
  tecCommitteeNumber: Joi.string().allow('', null),
  tecChairman: Joi.string().allow('', null),
  tecMember1: Joi.string().allow('', null),
  tecMember2: Joi.string().allow('', null),
  awardedTo: Joi.string().allow('', null),
  serviceAgreementStartDate: dateOrString,
  serviceAgreementEndDate: dateOrString,
  performanceBondNumber: Joi.string().allow('', null),
  performanceBondBank: Joi.string().allow('', null),
  performanceBondRemark: Joi.string().allow('', null),
  delay: Joi.number().allow(null)
});

const records = new Hono();

records.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const { data: recordRows, error } = await supabase
    .from('records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: allDocs } = await supabase.from('record_documents').select('*');
  const docsByRecordId = {};
  (allDocs || []).forEach(doc => {
    if (!docsByRecordId[doc.record_id]) docsByRecordId[doc.record_id] = [];
    docsByRecordId[doc.record_id].push(doc);
  });

  return c.json((recordRows || []).map(r => formatRecord(r, docsByRecordId[r.id] || [])));
});

records.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(createRecordSchema), async (c) => {
  const body = c.get('parsedBody');
  const user = c.get('user');

  const insertData = mapRecordInput(body);
  const { data, error } = await supabase.from('records').insert([insertData]).select().single();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Tender Record already exists' }, 400);
    throw error;
  }

  const item = formatRecord(data, []);
  await AuditLog.create({ user: user?.email, type: 'create:record', message: `Created tender record ${item.tenderNumber}` }).catch(err => console.error(err));
  return c.json(item, 201);
});

records.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data: record, error } = await supabase.from('records').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!record) return c.json({ message: 'Not found' }, 404);

  const docs = await getDocumentsForRecord(record.id);
  return c.json(formatRecord(record, docs));
});

records.put('/:id', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(updateRecordSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.get('parsedBody');
  const user = c.get('user');

  const updates = mapRecordInput(body);
  const { data: updated, error } = await supabase.from('records').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    if (error.code === '23505') return c.json({ message: 'Tender Record already exists' }, 400);
    throw error;
  }
  if (!updated) return c.json({ message: 'Not found' }, 404);

  const docs = await getDocumentsForRecord(updated.id);
  const item = formatRecord(updated, docs);
  await AuditLog.create({ user: user?.email, type: 'update:record', message: `Updated tender record ${item.tenderNumber}` }).catch(err => console.error(err));
  return c.json(item);
});

records.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase.from('records').select('*').eq('id', id).maybeSingle();

  // Clean up documents in storage and record_documents table
  const docs = await getDocumentsForRecord(id);
  if (docs.length > 0) {
    const paths = docs.map(d => d.file_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(paths).catch(err => console.warn(err));
    }
    await supabase.from('record_documents').delete().eq('record_id', id);
  }

  const { error } = await supabase.from('records').delete().eq('id', id);
  if (error) throw error;

  if (item) {
    await AuditLog.create({ user: user?.email, type: 'delete:record', message: `Deleted record ${item.tender_number || item.id}` }).catch(err => console.error(err));
  }
  return c.json({ message: 'Deleted' });
});

// ---------------------------------------------------------------------------
// Records Document Sub-Routes (Hono multipart file upload, streaming download, delete)
// ---------------------------------------------------------------------------

// POST /api/records/:id/documents (Upload Documents)
records.post('/:id/documents', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: record } = await supabase.from('records').select('*').eq('id', id).maybeSingle();
  if (!record) {
    return c.json({ message: 'Tender record not found' }, 404);
  }

  const parsedBody = await c.req.parseBody({ all: true });
  const rawValues = Object.values(parsedBody).flatMap(val => Array.isArray(val) ? val : [val]);
  const uploadedFiles = rawValues.filter(file => file && typeof file.arrayBuffer === 'function');

  if (uploadedFiles.length > 0) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

    for (const file of uploadedFiles) {
      const fileName = file.name || 'unnamed_file';
      const fileSize = file.size || 0;
      const fileType = file.type || 'application/octet-stream';

      const dotIdx = fileName.lastIndexOf('.');
      const ext = dotIdx !== -1 ? fileName.slice(dotIdx).toLowerCase() : '';

      if (fileSize > maxSizeBytes) {
        return c.json({ message: `File ${fileName} exceeds maximum allowed limit of 10MB` }, 400);
      }

      if (!allowedMimeTypes.includes(fileType) && !allowedExtensions.includes(ext)) {
        return c.json({ message: `File type ${ext || fileType} is not supported` }, 400);
      }

      const cleanBase = (dotIdx !== -1 ? fileName.slice(0, dotIdx) : fileName).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const storageFilename = `${cleanBase}-${uniqueSuffix}${ext}`;
      const storagePath = `records/${record.id}/${storageFilename}`;

      const fileBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: fileType,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase Storage upload error:', uploadError);
        throw uploadError;
      }

      const { error: insertError } = await supabase
        .from('record_documents')
        .insert([{
          record_id: record.id,
          file_name: fileName,
          file_path: storagePath,
          file_size: fileSize,
          mime_type: fileType
        }]);

      if (insertError) {
        console.error('Failed to insert record_document row:', insertError);
        throw insertError;
      }
    }
  }

  const docs = await getDocumentsForRecord(record.id);
  const formattedDocs = docs.map(formatRecordDocument);

  await AuditLog.create({
    user: user?.email,
    type: 'document_upload',
    message: `Uploaded ${uploadedFiles.length} document(s) to Record ${record.tender_number || record.id}`
  }).catch(err => console.error(err));

  return c.json({
    message: 'Documents uploaded successfully',
    documents: formattedDocs
  }, 201);
});

// GET /api/records/:id/documents (List Documents)
records.get('/:id/documents', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data: record } = await supabase.from('records').select('*').eq('id', id).maybeSingle();
  if (!record) {
    return c.json({ message: 'Tender record not found' }, 404);
  }

  const docs = await getDocumentsForRecord(record.id);
  return c.json(docs.map(formatRecordDocument));
});

// GET /api/records/:id/documents/:docId/download (Download Document Stream)
records.get('/:id/documents/:docId/download', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const docId = c.req.param('docId');

  const { data: record } = await supabase.from('records').select('*').eq('id', id).maybeSingle();
  if (!record) return c.json({ message: 'Tender record not found' }, 404);

  const { data: doc } = await supabase
    .from('record_documents')
    .select('*')
    .eq('id', docId)
    .eq('record_id', record.id)
    .maybeSingle();

  if (!doc) return c.json({ message: 'Document not found' }, 404);

  const { data: fileBlob, error: downloadError } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .download(doc.file_path);

  if (downloadError || !fileBlob) {
    console.error('Supabase Storage download error:', downloadError);
    return c.json({ message: 'File not found in storage' }, 404);
  }

  const arrayBuffer = await fileBlob.arrayBuffer();

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': doc.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.file_name)}"`,
      'Content-Length': String(arrayBuffer.byteLength)
    }
  });
});

// DELETE /api/records/:id/documents/:docId (Delete Document)
records.delete('/:id/documents/:docId', protect, authorize('Admin', 'Procurement'), async (c) => {
  const id = c.req.param('id');
  const docId = c.req.param('docId');
  const user = c.get('user');

  const { data: record } = await supabase.from('records').select('*').eq('id', id).maybeSingle();
  if (!record) return c.json({ message: 'Tender record not found' }, 404);

  const { data: doc } = await supabase
    .from('record_documents')
    .select('*')
    .eq('id', docId)
    .maybeSingle();

  if (!doc) return c.json({ message: 'Document not found' }, 404);

  if (doc.file_path) {
    const { error: removeError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .remove([doc.file_path]);

    if (removeError) {
      console.warn('Failed to delete object from Supabase Storage:', removeError.message);
    }
  }

  await supabase.from('record_documents').delete().eq('id', doc.id);

  const docs = await getDocumentsForRecord(record.id);
  const formattedDocs = docs.map(formatRecordDocument);

  await AuditLog.create({
    user: user?.email,
    type: 'document_delete',
    message: `Deleted document ${doc.file_name} from Record ${record.tender_number || record.id}`
  }).catch(err => console.error(err));

  return c.json({
    message: 'Document deleted successfully',
    documents: formattedDocs
  });
});

app.route('/api/records', records);

// ---------------------------------------------------------------------------
// 7. AUDIT LOGS RESOURCE (/api/audits)
// ---------------------------------------------------------------------------

const formatAuditLog = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    user: row.user || 'System',
    type: row.type || '',
    message: row.message || '',
    ipAddress: row.ip_address || '',
    timestamp: row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const audits = new Hono();

audits.get('/', protect, authorize('Admin'), async (c) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw error;
  return c.json((data || []).map(formatAuditLog));
});

audits.get('/:id', protect, authorize('Admin'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase.from('audit_logs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return c.json({ message: 'Not found' }, 404);
  return c.json(formatAuditLog(data));
});

app.route('/api/audits', audits);

// ---------------------------------------------------------------------------
// Fallback Route
// ---------------------------------------------------------------------------

app.all('*', (c) => {
  return c.json({ message: 'Route not implemented in Hono worker yet' }, 501);
});

export default app;
