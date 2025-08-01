import type { KeysMatching } from '@bemedev/decompose';
import type { types } from '@bemedev/types';
import type {
  CheckReturnType,
  Config,
  ExtraPermissionsKey,
  RessourcesFrom,
} from './types';

export type CollectedReturns<Keys extends string> = boolean | Keys[];

export type ReduceCollectedReturns_F = <Keys extends string>(
  ...collecteds: CollectedReturns<Keys>[]
) => CollectedReturns<Keys>;

export type ResPerm<
  C extends Config,
  Re extends string,
  Keys extends string,
> = Partial<
  Record<
    types.ReduceArray<types.ValuesOf<C>[Re]>,
    Partial<
      Record<
        'allow' | 'disallow',
        Partial<
          Record<
            Keys | '**',
            // IDS of users allowed or disallowed to perform the action
            ExtraPermissionsKey<Extract<keyof C, string>>[]
          >
        >
      >
    >
  >
>;

export type ResPerm2<
  C extends Config,
  Re extends string,
  Keys extends string[],
> =
  | true
  | Partial<
      Record<
        ExtraPermissionsKey<Extract<keyof C, string>>,
        Record<types.ReduceArray<types.ValuesOf<C>[Re]>, boolean | Keys>
      >
    >;

export type HasUserPermissions_F<
  C extends Config,
  P extends RessourcesFrom<C>,
  _User extends object,
> = <
  Re extends Extract<keyof P, string>,
  A extends types.ReduceArray<types.ValuesOf<C>[Re]>,
  PD extends types.DeepPartial<P[Re]['dataType']>,
>(args: {
  performer: _User;
  owner: _User;
  ressource: Re;
  action: A;
  data?: PD;
}) => CheckReturnType<PD>;

export type HasDataPermissions_F<
  C extends Config,
  P extends RessourcesFrom<C>,
  _User extends object,
> = <
  Re extends Extract<keyof P, string>,
  A extends types.ReduceArray<types.ValuesOf<C>[Re]>,
  PD extends types.TrueObject = types.DeepPartial<P[Re]['dataType']>,
  Keys extends string = KeysMatching<PD>,
>(
  performer: _User,
  action: A,
  extraPermisions?: ResPerm<C, Re, Keys>,
) => CheckReturnType<PD>;

export type HasPermissions_F<
  C extends Config,
  P extends RessourcesFrom<C>,
  _User extends object,
> = <
  Re extends Extract<keyof P, string>,
  A extends types.ReduceArray<types.ValuesOf<C>[Re]>,
  PD extends types.DeepPartial<P[Re]['dataType']>,
  Keys extends string = KeysMatching<PD>,
>(args: {
  performer: _User;
  owner: _User;
  ressource: Re;
  action: A;
  data?: PD & { __extraPermissions?: ResPerm<C, Re, Keys> };
}) => CheckReturnType<PD>;
