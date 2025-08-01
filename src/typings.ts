/* eslint-disable @typescript-eslint/no-unused-vars */

import { transform, types } from '@bemedev/types';
import type {
  MapS,
  ObjectS,
  PartialCustom,
  TransformO,
} from '@bemedev/types/lib/transform/types.types';
import { identity } from './helpers';
import type {
  Ressource,
  Roles,
  TransformPermissions,
  User,
} from './types';

export const typings = {
  roles: <const R extends types.AnyArray<Roles>>(...roles: R) =>
    identity(roles),

  user: <
    const R extends types.AnyArray<Roles>,
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
    return identity<Ressource<TransformO<A>>>({
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
    const R extends types.AnyArray<Roles>,
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
    const roles = typings.roles(..._roles);
    const user = typings.user(_restUser, ..._roles);
    const permissions = typings.permissions(_permissions);

    return {
      roles,
      user,
      permissions,
    };
  },

  args: <
    const R extends types.AnyArray<Roles>,
    const P extends Record<
      string,
      { dataType: ObjectS; actions: string[] }
    >,
    const Rest extends MapS | PartialCustom = MapS | PartialCustom,
  >(
    _permissions: P,
    _restUser?: Rest,
    ..._roles: R
  ) => typings.rolesWithPermissions(_permissions, _restUser, ..._roles),
};
