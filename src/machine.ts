/* eslint-disable @typescript-eslint/no-unused-vars */
import type { KeysMatching } from '@bemedev/decompose';
import { castings, typings, type types } from '@bemedev/types';
import { DELIMITER } from './constants';
import type {
  CollectedReturns,
  HasDataPermissions_F,
  HasPermissions_F,
  HasUserPermissions_F,
  ReduceCollectedReturns_F,
  ResPerm,
  ResPerm2,
} from './machine.types';
import type {
  Config,
  Implementation as Impl,
  RessourcesFrom,
  RolesFrom,
  UserFrom,
} from './types';

class Machine<
  const Co extends Config,
  const Us extends object,
  const Ro extends RolesFrom<Co>,
  const Res extends RessourcesFrom<Co>,
  User extends UserFrom<Co> = UserFrom<Co> & Us,
  Implementation extends Impl<Co, User, Res> = Impl<Co, User, Res>,
> {
  #ressources!: Res;

  #implementation!: Implementation;

  #roles!: Ro;

  constructor(private __config: Co) {}

  get config() {
    return Object.freeze(this.__config);
  }

  get roles() {
    return Object.freeze(this.#roles);
  }

  get implementation() {
    return Object.freeze(this.#implementation);
  }

  get __user() {
    return typings.commons.unknown<User>();
  }

  get __ressources() {
    return typings.commons.unknown<Res>();
  }

  getPriority(role: keyof Ro) {
    return this.#roles[role];
  }

  #sortRoles = (roles: (keyof Ro)[]) => {
    return roles.sort((a, b) => {
      return this.getPriority(a) - this.getPriority(b);
    });
  };

  #reverseRoles = (roles: (keyof Ro)[]) => {
    return roles.sort((a, b) => {
      return this.getPriority(b) - this.getPriority(a);
    });
  };

  sortRoles = (order: 'asc' | 'desc', ...roles: (keyof Ro)[]) => {
    if (order === 'asc') return this.#sortRoles(roles);
    return this.#reverseRoles(roles);
  };

  #addRessources = <const P extends Res>(ressouces: P) =>
    (this.#ressources = ressouces);

  /**
   * @deprecated
   * @param ressouces
   * @returns
   */
  __provideRessources = <const P extends RessourcesFrom<Co>>(
    ressouces: P,
  ) => {
    const _new = new Machine<Co, Us, Ro, P>(this.__config);

    _new.#addRessources(ressouces);
    _new.#roles = this.#roles;

    return _new;
  };

  #addRoles = <const R extends Ro>(roles: R) => (this.#roles = roles);

  __provideRoles = <const R extends RolesFrom<Co>>(roles: R) => {
    const _new = new Machine<Co, Us, R, Res>(this.__config);

    _new.#addRoles(roles);
    _new.#ressources = this.#ressources;

    return _new;
  };

  __provideUser = <const U extends object>(_?: U) => {
    const _new = new Machine<Co, U, Ro, Res>(this.__config);

    _new.#roles = this.#roles;
    _new.#ressources = this.#ressources;

    return _new;
  };

  #implements = (implementation: Implementation) => {
    return (this.#implementation = implementation);
  };

  implements = (implementation: Implementation) => {
    const _new = new Machine<Co, Us, Ro, Res, User, Implementation>(
      this.__config,
    );

    _new.#roles = this.#roles;
    _new.#ressources = this.#ressources;
    _new.#implements(implementation);

    return _new;
  };

  #hasUserPermissions: HasUserPermissions_F<Co, Res, User> = ({
    performer,
    owner,
    data,
    action,
    resource,
  }) => {
    const sortedRoles = this.#reverseRoles(performer.roles);

    const collecteds: CollectedReturns<any>[] = [];

    sortedRoles.forEach(role => {
      const key =
        `${String(role) as keyof Co & string}${DELIMITER}${resource}${DELIMITER}${action}` as keyof Implementation;

      const permission = this.#implementation[key];

      if (castings.commons.isUndefined(permission)) return;

      if (typeof permission === 'function') {
        const result = castings.commons.any(
          permission({
            owner,
            performer,
            data,
          }),
        );

        collecteds.push(result);

        return;
      }

      collecteds.push(permission);
    });

    return Machine.reduceCollection(...collecteds);
  };

  #hasDataPermissions: HasDataPermissions_F<Co, Res, User> = (
    performer,
    action,
    extra,
  ) => {
    const permissions = this.extractDataPermissions(extra);

    const sortedRoles = this.#reverseRoles(performer.roles);

    if (permissions === true) return true;

    const result1 = permissions[`user:${performer.__id}`]?.[action];

    const alreadyTrue = result1 === true;
    if (alreadyTrue) return true;

    const collecteds: CollectedReturns<any>[] = [];

    if (result1) collecteds.push(result1);

    sortedRoles.forEach(role => {
      const value1 =
        permissions[`role:${String(role) as keyof Co & string}`]?.[action];

      if (value1) collecteds.push(value1);
    });

    if (collecteds.length === 0) return true;

    return Machine.reduceCollection(...collecteds);
  };

  hasPermisions: HasPermissions_F<Co, Res, User> = args => {
    const userPermissions = this.#hasUserPermissions(args);

    const getData = () =>
      this.#hasDataPermissions(
        args.performer,
        args.action,
        args.data?.__extraPermissions,
      );

    const strategy = this.#ressources[args.resource].__strategy;

    switch (strategy) {
      case 'bypass':
        return userPermissions;
      case 'and': {
        if (userPermissions === false) return false;

        const dataPermissions = getData();

        if (userPermissions === true) return dataPermissions;

        return Machine.reduceCollection<any>(
          userPermissions,
          dataPermissions,
        );
      }
      case 'or': {
        return Machine.reduceCollection<any>(userPermissions, getData());
      }
      default:
        return userPermissions;
    }
  };

  extractDataPermissions = <
    Re extends Extract<keyof Res, string>,
    PD extends types.TrueObject = types.DeepPartial<Res[Re]['dataType']>,
    Keys extends string = KeysMatching<PD>,
  >(
    permissions?: ResPerm<Co, Re, Keys>,
  ): ResPerm2<Co, Re, Keys[]> => {
    if (!permissions) return true;

    type Ac = keyof typeof permissions;
    type Vs = types.ValuesOf<typeof permissions>;

    type Entries = [Ac, Vs][];

    const entries = castings.commons.unknown<Entries>(
      Object.entries(permissions),
    );

    const allValuesAreNotDefineds = entries.every(([, value]) =>
      castings.commons.isUndefined(value),
    );
    if (allValuesAreNotDefineds) return true;

    const out: any = {};

    entries.forEach(([action, _permissions]) => {
      if (castings.commons.isUndefined(_permissions)) return;

      const { allow, disallow } = _permissions;

      // Process 'allow' permissions
      if (allow) {
        const allowEntries = Object.entries(allow);

        allowEntries.forEach(([dataKey, userIds]) => {
          if (!Array.isArray(userIds) || userIds.length === 0) return;

          userIds.forEach(userId => {
            if (!out[userId]) {
              out[userId] = {};
            }

            if (!out[userId][action]) {
              out[userId][action] = [];
            }

            const currentValue = out[userId][action];

            if (dataKey === '**') {
              out[userId][action] = true;
            } else if (Array.isArray(currentValue)) {
              if (!currentValue.includes(dataKey)) {
                currentValue.push(dataKey);
              }
            }
          });
        });
      }

      // Process 'disallow' permissions (similar logic but for restrictions)
      if (disallow) {
        const disallowEntries = Object.entries(disallow);

        disallowEntries.forEach(([dataKey, userIds]) => {
          if (!Array.isArray(userIds) || userIds.length === 0) return;

          userIds.forEach(userId => {
            if (!out[userId]) {
              out[userId] = {};
            }

            if (!out[userId][action]) {
              out[userId][action] = [];
            }

            const currentValue = out[userId][action];

            if (dataKey === '**') {
              out[userId][action] = false;
            } else if (Array.isArray(currentValue)) {
              // Remove from allowed if it was there (disallow takes precedence)
              const index = currentValue.indexOf(dataKey);
              if (index > -1) {
                currentValue.splice(index, 1);
              }
            }
          });
        });
      }
    });

    return out;
  };

  static reduceCollection: ReduceCollectedReturns_F = (...collecteds) => {
    let out: any = [];
    for (const result of collecteds) {
      if (result === true) return true;
      if (out === false) {
        out = result;
        continue;
      }
      if (Array.isArray(result)) {
        if (Array.isArray(out)) out = [...new Set([...out, ...result])];
        else out = result;
      }
    }
    return out;
  };
}

export { type Machine };
