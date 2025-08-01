/* eslint-disable @typescript-eslint/no-unused-vars */

import { typings as _typings, transform } from '@bemedev/types';
import type {
  MapS,
  ObjectS,
  PartialCustom,
  TransformO,
} from '@bemedev/types/lib/transform/types.types';
import type { Config, Roles, Strategy } from './types';

type RessourcesS = Record<
  string,
  { dataType: ObjectS; actions: string[]; __strategy: Strategy }
>;

type TransformRessources<T extends RessourcesS> = {
  [K in keyof T]: {
    dataType: TransformO<T[K]['dataType']>;
    actions: T[K]['actions'];
    __strategy: T[K]['__strategy'];
  };
};

type Args = {
  ressources: RessourcesS;
  user: MapS | PartialCustom;
  roles: Roles;
};

type TransformArgs<T extends Args> = {
  ressources: TransformRessources<T['ressources']>;
  user: TransformO<T['user']>;
  roles: T['roles'];
};

const roles = <const R extends Roles>(roles: R) => roles;

const user = <
  const Rest extends MapS | PartialCustom = MapS | PartialCustom,
>(
  __?: Rest,
) => {
  const rest = transform(__);
  return _typings.commons.unknown<
    Readonly<Omit<typeof rest, '__id' | 'roles'>>
  >();
};
const dataType = <const A extends ObjectS>(dataType: A) =>
  transform(dataType);

const ressources = <const T extends RessourcesS>(ressources: T) => {
  const entries = Object.entries(ressources) as [
    string,
    { dataType: ObjectS; actions: string[]; __strategy: Strategy },
  ][];

  const out = entries.reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: {
        ...value,
        dataType: dataType(value.dataType),
      },
    }),
    {} as TransformRessources<T>,
  );

  return out;
};

export const typings = <const T extends Args>(args: T) => {
  return {
    ressources: (ressources as any)(args.ressources),
    user: user(args.user),
    roles: roles(args.roles),
  } as TransformArgs<T> satisfies Config;
};
