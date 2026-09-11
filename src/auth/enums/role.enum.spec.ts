import { describe, it, expect } from 'vitest';
import { Role, ROLE_LEVEL } from './role.enum.js';

describe('Role Enum & Hierarchy', () => {
  it('should define USER, MANAGER, and ADMIN roles', () => {
    expect(Role.USER).toBe('USER');
    expect(Role.MANAGER).toBe('MANAGER');
    expect(Role.ADMIN).toBe('ADMIN');
  });

  it('should correctly prioritize role hierarchy levels', () => {
    expect(ROLE_LEVEL[Role.USER]).toBe(1);
    expect(ROLE_LEVEL[Role.MANAGER]).toBe(2);
    expect(ROLE_LEVEL[Role.ADMIN]).toBe(3);

    expect(ROLE_LEVEL[Role.ADMIN]).toBeGreaterThan(ROLE_LEVEL[Role.MANAGER]);
    expect(ROLE_LEVEL[Role.MANAGER]).toBeGreaterThan(ROLE_LEVEL[Role.USER]);
  });
});
