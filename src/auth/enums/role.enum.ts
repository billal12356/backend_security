export enum Role {
  USER = 'USER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export const ROLE_LEVEL: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.MANAGER]: 2,
  [Role.ADMIN]: 3,
};
