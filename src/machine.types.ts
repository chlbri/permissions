import type { KeysMatching } from '@bemedev/decompose';
import type { types } from '@bemedev/types';
import type {
  CheckReturnType,
  Config,
  ExtraPermissionsKey,
  Strategy,
  UserArg,
} from './types';

export type CollectedReturns<Keys extends string> = boolean | Keys[];

export type ReduceCollectedReturns_F = <Keys extends string>(
  strategy: Strategy,
  ...collecteds: CollectedReturns<Keys>[]
) => CollectedReturns<Keys>;

export type ResPerm<
  Co extends Config,
  Re extends keyof Co['ressources'],
  Keys extends string,
> = Partial<
  Record<
    types.ReduceArray<Co['ressources'][Re]['actions']>,
    Partial<
      Record<
        'allow' | 'disallow',
        Partial<
          Record<
            Keys | '**',
            // IDS of users allowed or disallowed to perform the action
            ExtraPermissionsKey<Extract<keyof Co, string>>[]
          >
        >
      >
    >
  >
>;

export type ResPerm2<
  Co extends Config,
  Re extends keyof Co['ressources'],
  Keys extends string[],
> =
  | true
  | Partial<
      Record<
        ExtraPermissionsKey<Extract<keyof Co, string>>,
        Record<
          types.ReduceArray<Co['ressources'][Re]['actions']>,
          boolean | Keys
        >
      >
    >;

export type HasUserPermissions_F<
  Co extends Config,
  Res extends Co['ressources'] = Co['ressources'],
  User extends UserArg<Co> = UserArg<Co>,
> = <
  Re extends Extract<keyof Res, string>,
  A extends types.ReduceArray<Res[Re]['actions']>,
  PD extends types.DeepPartial<Res[Re]['dataType']>,
>(args: {
  performer: User;
  owner: User;
  ressource: Re;
  action: A;
  data?: PD;
}) => CheckReturnType<PD>;

export type HasDataPermissions_F<
  Co extends Config,
  Res extends Co['ressources'] = Co['ressources'],
  User extends UserArg<Co> = UserArg<Co>,
> = <
  Re extends Extract<keyof Res, string>,
  A extends types.ReduceArray<Res[Re]['actions']>,
  PD extends types.TrueObject = types.DeepPartial<Res[Re]['dataType']>,
  Keys extends string = KeysMatching<PD>,
>(
  performer: User,
  action: A,
  extraPermisions?: ResPerm<Co, Re, Keys>,
) => CheckReturnType<PD>;

export type HasPermissions_F<
  Co extends Config,
  Res extends Co['ressources'] = Co['ressources'],
  User extends UserArg<Co> = UserArg<Co>,
> = <
  Re extends Extract<keyof Res, string>,
  A extends types.ReduceArray<Res[Re]['actions']>,
  PD extends types.DeepPartial<Res[Re]['dataType']>,
  Keys extends string = KeysMatching<PD>,
>(args: {
  performer: User;
  owner: User;
  ressource: Re;
  action: A;
  data?: PD & { __extraPermissions?: ResPerm<Co, Re, Keys> };
}) => CheckReturnType<PD>;
