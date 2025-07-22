/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
  PermissionsType,
  PermissionsTypes,
  Roles,
  RolesWithPermissions,
  User,
} from './types';

type AnyArray<T> = T[] | readonly T[];

type TransformPermissions<
  P extends Record<string, { dataType: any; actions: string[] }>,
> = {
  [K in keyof P]: {
    dataType: P[K]['dataType'];
    action: P[K]['actions'][number];
  };
};

export const identity = <const T>(value?: T) => value as T;

export const types = {
  roles: <const R extends AnyArray<Roles>>(...roles: R) => identity(roles),

  user: <const R extends AnyArray<Roles>, Rest = any>(
    __?: Rest,
    ..._: R
  ) => identity<Omit<Rest, '__id' | 'roles'> & User<R[number]>>(),

  permission: <const S extends string[], const A = any>(
    dataType?: A,
    ...actions: S
  ) => {
    return {
      dataType,
      action: actions[0],
    } as {
      action: S[number];
      dataType: A;
    } satisfies PermissionsType<A>;
  },

  permissions: <
    P extends Record<string, { dataType: any; actions: string[] }>,
  >(
    permissions: P,
  ) => {
    const entries = Object.entries(permissions);

    return entries
      .map(([key, { actions, dataType }]) => {
        const action = actions[0];
        return [key, { dataType, action }] as const;
      })
      .reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        {} as TransformPermissions<P>,
      );
  },

  rolesWithPermissions: <
    const R extends AnyArray<Roles>,
    P extends Record<string, { dataType: any; actions: string[] }>,
    Rest = any,
  >(
    _permissions: P,
    _restUser?: Rest,
    ..._roles: R
  ) => {
    const roles = types.roles(..._roles);
    const user = types.user(_restUser, ..._roles);
    const permissions = types.permissions(_permissions);

    return {
      roles,
      user,
      permissions,
    };
  },

  args: <
    const R extends AnyArray<Roles>,
    P extends Record<string, { dataType: any; actions: string[] }>,
    Rest = any,
  >(
    _permissions: P,
    _restUser?: Rest,
    ..._roles: R
  ) => types.rolesWithPermissions(_permissions, _restUser, ..._roles),
};

type CreateRolesWithPermissionsArgs<
  R extends Roles[],
  U extends User<R[number]>,
  P extends PermissionsTypes,
> = {
  user?: U;
  permissions?: P;
  roles?: R;
};

export const createRolesWithPermissions = <
  R extends Roles[],
  U extends User<R[number]>,
  P extends PermissionsTypes,
>(
  _?: CreateRolesWithPermissionsArgs<R, U, P>,
) => {
  const out = <const T extends RolesWithPermissions<R[number], U, P>>(
    roles: T,
  ) => {
    const ROLES = identity(roles);

    type PermissionArgs<Re extends Extract<keyof P, string>> = {
      performer: U;
      owner: U;
      resource: Re;
      action: P[Re]['action'];
      data?: P[Re]['dataType'];
    };

    const hasPermissions = <Re extends Extract<keyof P, string>>({
      performer,
      owner,
      resource,
      action,
      data,
    }: PermissionArgs<Re>) => {
      return performer.roles.some(role => {
        const permission = ROLES[role][resource]?.[action];

        if (permission === undefined) return false;

        if (typeof permission === 'function') {
          return (
            data != null &&
            permission({
              performer,
              data,
              owner,
            })
          );
        }

        return permission;
      });
    };

    return {
      hasPermissions,
      ROLES,
    };
  };

  return out;
};
