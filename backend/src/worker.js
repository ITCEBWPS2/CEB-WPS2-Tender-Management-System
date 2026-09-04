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
    console.error('[Hono Auth Error]:', err.message);
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

// ---------------------------------------------------------------------------
// Helpers & Validation Schemas
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
// Categories Routes (Migrated Proof-of-Concept)
// ---------------------------------------------------------------------------

const categories = new Hono();

// GET /api/categories
categories.get('/', protect, authorize('Admin', 'Procurement', 'CECOM', 'Clerk'), async (c) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const items = (data || []).map(formatCategory);
  return c.json(items);
});

// POST /api/categories
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

// GET /api/categories/:id
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

// PUT /api/categories/:id
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

// DELETE /api/categories/:id
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

// Mount Categories router under /api/categories
app.route('/api/categories', categories);

// Fallback for unhandled routes during migration phase
app.all('*', (c) => {
  return c.json({ message: 'Route not implemented in Hono worker yet' }, 501);
});

export default app;
