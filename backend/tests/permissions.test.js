require('./setup');
const { PERMISSIONS } = require('../src/config/permissions');
const { authorize } = require('../src/middleware/auth');

describe('Shared Permissions Config & authorize middleware', () => {
  describe('PERMISSIONS matrix definitions', () => {
    it('verifies PERMISSIONS.delete contains Admin and Super Admin ONLY', () => {
      expect(PERMISSIONS.delete).toEqual(expect.arrayContaining(['Admin', 'Super Admin']));
      expect(PERMISSIONS.delete.length).toBe(2);
      expect(PERMISSIONS.delete).not.toContain('Procurement');
      expect(PERMISSIONS.delete).not.toContain('Clerk');
      expect(PERMISSIONS.delete).not.toContain('CECOM');
      expect(PERMISSIONS.delete).not.toContain('User');
    });

    it('verifies PERMISSIONS.add contains Admin, Super Admin, Procurement, and Clerk', () => {
      expect(PERMISSIONS.add).toEqual(expect.arrayContaining(['Admin', 'Super Admin', 'Procurement', 'Clerk']));
      expect(PERMISSIONS.add.length).toBe(4);
      expect(PERMISSIONS.add).not.toContain('CECOM');
      expect(PERMISSIONS.add).not.toContain('User');
    });

    it('verifies PERMISSIONS.edit contains Admin, Super Admin, Procurement, and Clerk', () => {
      expect(PERMISSIONS.edit).toEqual(expect.arrayContaining(['Admin', 'Super Admin', 'Procurement', 'Clerk']));
      expect(PERMISSIONS.edit.length).toBe(4);
      expect(PERMISSIONS.edit).not.toContain('CECOM');
      expect(PERMISSIONS.edit).not.toContain('User');
    });

    it('verifies PERMISSIONS.view contains all 6 roles', () => {
      expect(PERMISSIONS.view).toEqual(
        expect.arrayContaining(['Admin', 'Super Admin', 'Procurement', 'Clerk', 'CECOM', 'User'])
      );
      expect(PERMISSIONS.view.length).toBe(6);
    });
  });

  describe('authorize middleware with PERMISSIONS', () => {
    const runMiddleware = (middleware, role) => {
      const req = { user: { role, email: `${role.toLowerCase().replace(/\s+/g, '')}@ceb.lk` } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      middleware(req, res, next);
      return { req, res, next };
    };

    it('rejects Clerk, CECOM, and User on a DELETE route while accepting Admin and Super Admin', () => {
      const deleteMiddleware = authorize(PERMISSIONS.delete);

      // Admin & Super Admin should pass
      expect(runMiddleware(deleteMiddleware, 'Admin').next).toHaveBeenCalled();
      expect(runMiddleware(deleteMiddleware, 'Super Admin').next).toHaveBeenCalled();

      // Clerk, CECOM, User, Procurement must be rejected
      const clerkRes = runMiddleware(deleteMiddleware, 'Clerk');
      expect(clerkRes.next).not.toHaveBeenCalled();
      expect(clerkRes.res.status).toHaveBeenCalledWith(403);

      const cecomRes = runMiddleware(deleteMiddleware, 'CECOM');
      expect(cecomRes.next).not.toHaveBeenCalled();
      expect(cecomRes.res.status).toHaveBeenCalledWith(403);

      const userRes = runMiddleware(deleteMiddleware, 'User');
      expect(userRes.next).not.toHaveBeenCalled();
      expect(userRes.res.status).toHaveBeenCalledWith(403);

      const procRes = runMiddleware(deleteMiddleware, 'Procurement');
      expect(procRes.next).not.toHaveBeenCalled();
      expect(procRes.res.status).toHaveBeenCalledWith(403);
    });

    it('accepts Clerk and Procurement on an ADD route while rejecting CECOM and User', () => {
      const addMiddleware = authorize(PERMISSIONS.add);

      expect(runMiddleware(addMiddleware, 'Admin').next).toHaveBeenCalled();
      expect(runMiddleware(addMiddleware, 'Super Admin').next).toHaveBeenCalled();
      expect(runMiddleware(addMiddleware, 'Procurement').next).toHaveBeenCalled();
      expect(runMiddleware(addMiddleware, 'Clerk').next).toHaveBeenCalled();

      const cecomRes = runMiddleware(addMiddleware, 'CECOM');
      expect(cecomRes.next).not.toHaveBeenCalled();
      expect(cecomRes.res.status).toHaveBeenCalledWith(403);

      const userRes = runMiddleware(addMiddleware, 'User');
      expect(userRes.next).not.toHaveBeenCalled();
      expect(userRes.res.status).toHaveBeenCalledWith(403);
    });

    it('accepts all 6 roles on a VIEW route', () => {
      const viewMiddleware = authorize(PERMISSIONS.view);

      const roles = ['Admin', 'Super Admin', 'Procurement', 'Clerk', 'CECOM', 'User'];
      for (const role of roles) {
        expect(runMiddleware(viewMiddleware, role).next).toHaveBeenCalled();
      }
    });
  });
});
