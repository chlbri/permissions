import { KeysMatching } from '@bemedev/decompose';
import type { types } from '@bemedev/types';
import type { DELIMITER, STRATEGIES } from './constants';

export type Strategy = (typeof STRATEGIES)[number];

export type Ressource<T = any> = {
  actions: string[];
  dataType: T;
  __strategy?: Strategy;
};

export type Ressources = Record<string, Ressource>;

export type Priority = number;

export type Roles = Record<string, Priority>;

export type User<R extends types.Keys = never> = {
  __id: string;
  roles: R[];
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

export type ExtraPermissionsKey<R extends string = string> =
  | `user:${string}`
  | `role:${R}`;

export type Config = {
  ressources: Ressources;
  roles: Roles;
  user: object;
};

export type UserFrom<C extends Config> = User<keyof C['roles']>;

export type RolesFrom<C extends Config> = Record<keyof C, number>;

export type ActionsFrom<C extends Config> = types.ReduceArray<
  types.ValuesOf<types.ValuesOf<C>>
>;

export type Delimiter = typeof DELIMITER;

export type ImplKeys<C extends Config> = {
  [Key1 in keyof C['roles'] & string]: {
    [Key2 in keyof C['ressources'] & string]: types.ReduceArray<
      C['ressources'][Key2]['actions']
    > extends infer Key3 extends string
      ? `${Key1}${Delimiter}${Key2}${Delimiter}${Key3}`
      : never;
  }[keyof C['ressources'] & string];
}[keyof C['roles'] & string];

export type StringL = `${string}${string}`;

export type ExtractRessourceKey<S extends string> =
  S extends `${StringL}${Delimiter}${infer P}${Delimiter}${StringL}`
    ? P
    : never;

export type Implementation<
  C extends Config,
  Res extends Ressources = C['ressources'],
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
                  owner: UserFrom<C> & C['user'];
                  performer: types.NOmit<UserFrom<C> & C['user'], 'roles'>;
                  data?: K3;
                },
              ],
              CheckReturnType<K3>
            >
          | CheckReturnType<K3>
      : never
    : never;
};
