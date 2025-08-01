/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
  Ressources,
  Roles,
  RolesWithPermissions,
  User,
} from './types';

export const createRoles = <const R extends Roles>(roles: R) => roles;

type CreateRolesWithPermissionsArgs<
  R extends Roles,
  U extends User<R>,
  P extends Ressources,
> = {
  user?: U;
  permissions?: P;
  roles?: R;
};

export const createPermissions = <
  const R extends Roles,
  U extends object,
  const P extends Ressources,
>(
  roles: R,
  _: U,
  ressouces: P,
) => {
  type _User = User<R> & U;

  return (permissions: RolesWithPermissions<R, _User, P>) => {
    const getPriority = (role: keyof R) => roles[role];
    const ROLES_ARRAY = Object.keys(roles);
  };
};

const ttt = createPermissions(
  { admin: 1, user: 2 },
  { val: 66 as number },
  {
    art: {
      action: 'read',
      dataType: { id: 'string' as string, content: 'string' as string },
    },
  },
);
