/* eslint-disable @typescript-eslint/no-unused-vars */

import { transform } from '@bemedev/types';
import type {
  MapS,
  ObjectS,
  PartialCustom,
  TransformO,
} from '@bemedev/types/lib/transform/types.types';
import type {
  PermissionsType,
  PermissionsTypes,
  Roles,
  RolesWithPermissions,
  User,
} from './types';

type AnyArray<T> = T[] | readonly T[];

type TransformPermissions<
  P extends Record<string, { dataType: ObjectS; actions: string[] }>,
> = {
  [K in keyof P]: {
    dataType: TransformO<P[K]['dataType']>;
    action: P[K]['actions'][number];
  };
};

export const identity = <const T>(value?: T) => value as T;

export const types = {
  roles: <const R extends AnyArray<Roles>>(...roles: R) => identity(roles),

  user: <
    const R extends AnyArray<Roles>,
    const Rest extends MapS | PartialCustom = MapS | PartialCustom,
  >(
    __?: Rest,
    ..._: R
  ) => {
    const rest = transform(__);
    return identity<
      Readonly<Omit<typeof rest, '__id' | 'roles'> & User<R[number]>>
    >();
  },

  permission: <
    const S extends string[],
    const A extends ObjectS = ObjectS,
  >(
    dataType?: A,
    ...actions: S
  ) => {
    return identity<PermissionsType<TransformO<A>>>({
      dataType: identity<TransformO<A>>((transform as any)(dataType)),
      action: actions[0],
    });
  },

  permissions: <
    P extends Record<string, { dataType: ObjectS; actions: string[] }>,
  >(
    permissions: P,
  ) => {
    const entries = Object.entries(permissions);

    return entries
      .map(([key, { actions, dataType: dt }]) => {
        const action = actions[0];
        const dataType = transform(dt);
        return [key, { dataType, action }] as const;
      })
      .reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        {} as TransformPermissions<P>,
      );
  },

  rolesWithPermissions: <
    const R extends AnyArray<Roles>,
    const P extends Record<
      string,
      { dataType: ObjectS; actions: string[] }
    >,
    const Rest extends MapS | PartialCustom = MapS | PartialCustom,
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
    const P extends Record<
      string,
      { dataType: ObjectS; actions: string[] }
    >,
    const Rest extends MapS | PartialCustom = MapS | PartialCustom,
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
  const R extends Roles[],
  const U extends User<R[number]>,
  const P extends PermissionsTypes,
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
      data?: Partial<P[Re]['dataType']>;
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

        if (typeof permission === 'function') {
          return (
            !!data &&
            permission(
              Object.freeze({
                performer,
                data,
                owner,
              }),
            )
            // &&
            // TODO: Add extra permissions on all ressources, User is also a ressource
          );
        }

        if (!permission) return false;

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
