import { KeysMatching } from '@bemedev/decompose';
import type { types } from '@bemedev/types';
import type {
  ObjectS,
  TransformO,
} from '@bemedev/types/lib/transform/types.types';
import type { DELIMITER, STRATEGIES } from './constants';

export type Strategy = (typeof STRATEGIES)[number];

export type Ressource<T = any> = {
  action: string;
  dataType: T;
  __strategy?: Strategy;
};

export type Ressources = Record<string, Ressource>;

export type Priority = number;

export type Roles = Record<string, Priority>;

export type User<R extends Roles = never> = {
  __id: string;
  roles: (keyof R)[];
};

export type CheckReturnType<
  PD extends types.TrueObject = types.TrueObject,
  Keys = KeysMatching<PD>[],
> = boolean | Keys;

export type PermissionCheck<U extends User, PD extends types.TrueObject> =
  | CheckReturnType<PD>
  | ((args: {
      performer: U;
      data?: types.DeepPartial<PD>;
      owner: U;
    }) => CheckReturnType<PD>);

export type RolesWithPermissions<
  R extends Roles,
  U extends User<R>,
  P extends Ressources,
> = {
  [role in keyof R]: Partial<{
    [key in keyof P]: Partial<{
      [action in P[key]['action']]: PermissionCheck<U, P[key]['dataType']>;
    }>;
  }>;
};

export type ExtraPermissionsKey<R extends string = string> =
  | `user:${string}`
  | `role:${R}`;

export type RessourcePermission<
  P extends Ressource = Ressource,
  S extends string = string,
  PD extends P['dataType'] = P['dataType'],
  Keys extends string = KeysMatching<PD>,
> = Partial<
  Record<
    P['action'],
    Partial<
      Record<
        'allow' | 'disallow',
        Partial<
          Record<
            Keys | '**',
            // IDS of users allowed or disallowed to perform the action
            ExtraPermissionsKey<S>[]
          >
        >
      >
    >
  >
>;

export type RessourcePermission2<
  P extends Ressource,
  S extends string,
  PD extends P['dataType'] = P['dataType'],
  Keys = KeysMatching<PD>[],
> =
  | true
  | Partial<
      Record<ExtraPermissionsKey<S>, Record<P['action'], boolean | Keys>>
    >;

export type RessourcePermissions2<
  P extends Ressources,
  S extends string,
> = {
  [Key in keyof P]: RessourcePermission2<P[Key], S>;
};

export type TransformPermissions<
  P extends Record<string, { dataType: ObjectS; actions: string[] }>,
> = {
  [K in keyof P]: {
    dataType: TransformO<P[K]['dataType']>;
    action: P[K]['actions'][number];
  };
};

export type Config = Record<
  string,
  Record<string, types.SingleOrArray<string>>
>;

export type UserFrom<C extends Config> = User<RolesFrom<C>>;

export type RolesFrom<C extends Config> = Record<keyof C, number>;

export type RessourcesFrom<
  C extends Config,
  V extends types.UnionToIntersection<
    types.ValuesOf<C>
  > = types.UnionToIntersection<types.ValuesOf<C>>,
> = {
  [Key in keyof V]: {
    dataType: any;
    __strategy?: Strategy;
  };
};

export type ActionsFrom<C extends Config> = types.ReduceArray<
  types.ValuesOf<types.ValuesOf<C>>
>;

export type Delimiter = typeof DELIMITER;

export type ImplKeys<C extends Config> = {
  [Key1 in keyof C & string]: {
    [Key2 in keyof C[Key1] &
      string]: `${Key1}${Delimiter}${Key2}${Delimiter}${types.ToArray<C[Key1][Key2]>[number]}`;
  }[keyof C[Key1] & string];
}[keyof C & string];

type StringL = `${string}${string}`;

type ExtractRessourceKey<S extends string> =
  S extends `${StringL}${Delimiter}${infer P}${Delimiter}${StringL}`
    ? P
    : never;

export type Implementation<
  C extends Config,
  Us extends object,
  Res extends RessourcesFrom<C>,
  Keys extends string = ImplKeys<C>,
> = {
  [Key in Keys]?: ExtractRessourceKey<Key> extends infer K2 extends
    keyof Res
    ? types.DeepPartial<Res[K2]['dataType']> extends infer K3 extends
        types.TrueObject
      ?
          | types.Fn<
              [
                {
                  owner: Us;
                  performer: Omit<Us & { __id: string }, 'roles'>;
                  data?: K3;
                },
              ],
              CheckReturnType<K3>
            >
          | CheckReturnType<K3>
      : never
    : never;
};
