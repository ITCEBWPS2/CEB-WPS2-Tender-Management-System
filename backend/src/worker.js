import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { jwtVerify } from 'jose';
import Joi from 'joi';

import supabase from './config/supabase.js';
import AuditLog from './utils/auditLogger.js';

const app = new Hono();

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
  const items = (data || []).map(formatCategory);
  return c.json(items);
});

categories.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(createCategorySchema), async (c) => {
  const body = c.get('parsedBody');
  const user = c.get('user');

  const { data, error } = await supabase
    .from('categories')
    .insert([{
      name: body.name,
      description: body.description || null,
      status: body.status || 'Active'
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ message: 'Category name already exists' }, 400);
    }
    throw error;
  }

  const item = formatCategory(data);

  await AuditLog.create({
    user: user?.email,
    type: 'create:category',
    message: `Created category ${item.name}`
  }).catch(err => console.error('AuditLog error:', err));

  return c.json(item, 201);
});

categories.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

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

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return c.json({ message: 'Category name already exists' }, 400);
    }
    throw error;
  }

  if (!data) return c.json({ message: 'Not found' }, 404);

  const item = formatCategory(data);

  await AuditLog.create({
    user: user?.email,
    type: 'update:category',
    message: `Updated category ${item.name}`
  }).catch(err => console.error('AuditLog error:', err));

  return c.json(item);
});

categories.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (item) {
    await AuditLog.create({
      user: user?.email,
      type: 'delete:category',
      message: `Deleted category ${item.name}`
    }).catch(err => console.error('AuditLog error:', err));
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
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const items = (data || []).map(formatDepartment);
  return c.json(items);
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

  const { data, error } = await supabase
    .from('departments')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ message: 'Department already exists' }, 400);
    }
    throw error;
  }

  const item = formatDepartment(data);

  await AuditLog.create({
    user: user?.email,
    type: 'create:department',
    message: `Created department ${item.name} (${item.code})`
  }).catch(err => console.error('AuditLog error:', err));

  return c.json(item, 201);
});

departments.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

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

  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return c.json({ message: 'Department already exists' }, 400);
    }
    throw error;
  }

  if (!data) return c.json({ message: 'Not found' }, 404);

  const item = formatDepartment(data);

  await AuditLog.create({
    user: user?.email,
    type: 'update:department',
    message: `Updated department ${item.name}`
  }).catch(err => console.error('AuditLog error:', err));

  return c.json(item);
});

departments.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (item) {
    await AuditLog.create({
      user: user?.email,
      type: 'delete:department',
      message: `Deleted department ${item.name}`
    }).catch(err => console.error('AuditLog error:', err));
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
  const { data, error } = await supabase
    .from('staff')
    .select('*, departments(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const items = (data || []).map(formatStaff);
  return c.json(items);
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

  const { data: inserted, error } = await supabase
    .from('staff')
    .insert([insertData])
    .select('*, departments(*)')
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ message: 'Staff member already exists' }, 400);
    }
    throw error;
  }

  const item = formatStaff(inserted);

  await AuditLog.create({
    user: user?.email,
    type: 'create:staff',
    message: `Created staff ${item.name}`
  }).catch(err => console.error('AuditLog error:', err));

  return c.json(item, 201);
});

staff.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase
    .from('staff')
    .select('*, departments(*)')
    .eq('id', id)
    .maybeSingle();

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

  const { data: updated, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select('*, departments(*)')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return c.json({ message: 'Staff member already exists' }, 400);
    }
    throw error;
  }

  if (!updated) return c.json({ message: 'Not found' }, 404);

  const item = formatStaff(updated);

  await AuditLog.create({
    user: user?.email,
    type: 'update:staff',
    message: `Updated staff ${item.name}`
  }).catch(err => console.error('AuditLog error:', err));

  return c.json(item);
});

staff.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (item) {
    await AuditLog.create({
      user: user?.email,
      type: 'delete:staff',
      message: `Deleted staff ${item.name}`
    }).catch(err => console.error('AuditLog error:', err));
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
  const { data, error } = await supabase
    .from('bidders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const items = (data || []).map(formatBidder);
  return c.json(items);
});

bidders.post('/', protect, authorize('Admin', 'Procurement', 'CECOM'), validateBody(createBidderSchema), async (c) => {
  const body = c.get('parsedBody');
  const user = c.get('user');

  const insertData = {
    name: body.name || null,
    email: body.email || null,
    address: body.address || null,
    contact: body.contact || null
  };

  const { data, error } = await supabase
    .from('bidders')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ message: 'Supplier/Bidder already exists' }, 400);
    }
    throw error;
  }

  const item = formatBidder(data);

  await AuditLog.create({
    user: user?.email,
    type: 'create:bidder',
    message: `Created bidder ${item.name}`
  }).catch(err => console.error('AuditLog error:', err));

  return c.json(item, 201);
});

bidders.get('/:id', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const id = c.req.param('id');
  const { data, error } = await supabase
    .from('bidders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

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

  const { data, error } = await supabase
    .from('bidders')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return c.json({ message: 'Supplier/Bidder already exists' }, 400);
    }
    throw error;
  }

  if (!data) return c.json({ message: 'Not found' }, 404);

  const item = formatBidder(data);

  await AuditLog.create({
    user: user?.email,
    type: 'update:bidder',
    message: `Updated bidder ${item.name}`
  }).catch(err => console.error('AuditLog error:', err));

  return c.json(item);
});

bidders.delete('/:id', protect, authorize('Admin', 'CECOM'), async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const { data: item } = await supabase
    .from('bidders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('bidders')
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (item) {
    await AuditLog.create({
      user: user?.email,
      type: 'delete:bidder',
      message: `Deleted bidder ${item.name}`
    }).catch(err => console.error('AuditLog error:', err));
  }

  return c.json({ message: 'Deleted' });
});

app.route('/api/bidders', bidders);

// ---------------------------------------------------------------------------
// Fallback Route
// ---------------------------------------------------------------------------

app.all('*', (c) => {
  return c.json({ message: 'Route not implemented in Hono worker yet' }, 501);
});

export default app;
