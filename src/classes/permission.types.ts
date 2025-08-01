import type { types } from '@bemedev/types';
import type { ObjectS } from '@bemedev/types/lib/transform/types.types';
import type {
  CheckReturnType,
  PermissionCheck,
  RessourcePermission,
  Ressources,
  Roles,
  RolesWithPermissions,
  Strategy,
  User,
} from '../types';

export type ProvidePermission_F<
  R extends Roles,
  P extends Ressources,
  _User extends User<R>,
> = <Rk extends keyof R, Pk extends keyof P, A extends P[Pk]['action']>(
  role: Rk,
  ressource: Pk,
  action: A,
  func: PermissionCheck<_User, P[Pk]['dataType']>,
) => PermissionCheck<_User, P[Pk]['dataType']>;

export type ProvidePermissions_F<
  R extends Roles,
  P extends Ressources,
  _User extends User<R>,
> = (
  permissions: RolesWithPermissions<R, _User, P>,
) => RolesWithPermissions<R, _User, P>;

export type HasUserPermissions_F<
  R extends Roles,
  P extends Ressources,
  _User extends User<R>,
> = <
  Re extends Extract<keyof P, string>,
  A extends P[Re]['action'],
  PD extends types.DeepPartial<P[Re]['dataType']>,
>(args: {
  performer: _User;
  owner: _User;
  resource: Re;
  action: A;
  data?: PD;
}) => CheckReturnType<PD>;

export type HasDataPermissions_F<
  R extends Roles,
  P extends Ressources,
  _User extends User<R>,
> = <
  K extends keyof P,
  A extends P[K]['action'],
  PD extends types.DeepPartial<P[K]['dataType']>,
>(
  performer: _User,
  action: A,
  extraPermisions?: RessourcePermission<P[K], R>,
) => CheckReturnType<PD>;

export type CollectedPermission<Keys extends string> = boolean | Keys[];

export type ReduceCollectedPermissions_F = <Keys extends string>(
  ...collecteds: CollectedPermission<Keys>[]
) => CollectedPermission<Keys>;

export type HasPermissions2_F<
  R extends Roles,
  P extends Ressources,
  _User extends User<R>,
> = <
  Re extends Extract<keyof P, string>,
  A extends P[Re]['action'],
  PD extends types.DeepPartial<P[Re]['dataType']>,
>(
  args: {
    performer: _User;
    owner: _User;
    resource: Re;
    action: A;
    data?: PD & {
      __extraPermissions?: RessourcePermission<P[Re], R, PD>;
    };
  },
  strategy: Strategy,
) => CheckReturnType<PD>;

export type HasPermissions_F<
  R extends Roles,
  P extends Ressources,
  _User extends User<R>,
> = <
  Re extends Extract<keyof P, string>,
  A extends P[Re]['action'],
  PD extends types.DeepPartial<P[Re]['dataType']>,
>(args: {
  performer: _User;
  owner: _User;
  resource: Re;
  action: A;
  data?: PD & {
    __extraPermissions?: RessourcePermission<P[Re], R, PD>;
  };
}) => CheckReturnType<PD>;

export type RessourceS<
  A extends string[] = string[],
  T extends ObjectS = ObjectS,
> = {
  actions: A;
  dataType: T;
  __strategy?: Strategy;
};
