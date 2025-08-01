/* eslint-disable @typescript-eslint/no-unused-vars */

import { castings, transform, types } from '@bemedev/types';
import type {
  MapS,
  ObjectS,
  PartialCustom,
  TransformO,
} from '@bemedev/types/lib/transform/types.types';
import type {
  Ressource,
  Roles,
  TransformPermissions,
  User,
} from './types';

export const typings = {
  roles: <const R extends types.AnyArray<Roles>>(...roles: R) => roles,

  user: <
    const R extends types.AnyArray<Roles>,
    const Rest extends MapS | PartialCustom = MapS | PartialCustom,
  >(
    __?: Rest,
    ..._: R
  ) => {
    const rest = transform(__);
    return castings.commons.unknown<
      Readonly<Omit<typeof rest, '__id' | 'roles'> & User<R[number]>>
    >(3);
  },

  permission: <
    const S extends string[],
    const A extends ObjectS = ObjectS,
  >(
    dataType?: A,
    ...actions: S
  ) => {
    return castings.commons.unknown<Ressource<TransformO<A>>>({
      dataType: castings.commons.unknown<TransformO<A>>(
        (transform as any)(dataType),
      ),
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
