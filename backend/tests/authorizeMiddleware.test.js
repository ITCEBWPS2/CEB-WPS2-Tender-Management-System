require('./setup');
const { authorize } = require('../src/middleware/auth');

describe('authorize middleware', () => {
  it('should treat "Super Admin" as "Admin" and permit access to Admin-only routes', () => {
    const middleware = authorize('Admin');
    const req = { user: { role: 'Super Admin', email: 'superadmin@ceb.lk' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should accept lowercase "super admin" when "admin" is authorized', () => {
    const middleware = authorize('admin');
    const req = { user: { role: 'super admin', email: 'superadmin@ceb.lk' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject unauthorized roles when only Admin is allowed', () => {
    const middleware = authorize('Admin');
    const req = { user: { role: 'Clerk', email: 'clerk@ceb.lk' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringMatching(/not authorized/i)
    }));
  });
});
