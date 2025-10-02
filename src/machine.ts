import { common } from '@bemedev/core';
import type {
  DeepPartial,
  TrueObject,
  ValuesOf,
} from '@bemedev/core/lib/globals/types';
import type { KeysMatching } from '@bemedev/decompose';
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
import type { Config, Implementation as Impl, UserFrom } from './types';

class Machine<
  const Co extends Config,
  Implementation extends Impl<Co> = Impl<Co>,
> {
  #ressources: Co['ressources'];

  #implementation!: Implementation;

  #roles: Co['roles'];

  constructor(private __config: Co) {
    this.#ressources = Object.freeze(this.__config.ressources);
    this.#roles = Object.freeze(this.__config.roles);
  }

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
    return common.typings.dynamic<UserFrom<Co> & Co['user']>();
  }

  get ressources() {
    return this.#ressources;
  }

  getPriority(role: keyof Co['roles']) {
    return this.#roles[role];
  }

  #sortRoles = (...roles: (keyof Co['roles'])[]) => {
    return roles.sort((a, b) => {
      return this.getPriority(a) - this.getPriority(b);
    });
  };

  #reverseRoles = (...roles: (keyof Co['roles'])[]) => {
    return roles.sort((a, b) => {
      return this.getPriority(b) - this.getPriority(a);
    });
  };

  sortRoles = (order: 'asc' | 'desc', ...roles: (keyof Co['roles'])[]) => {
    if (order === 'asc') return this.#sortRoles(...roles);
    return this.#reverseRoles(...roles);
  };

  #implements = (implementation: Implementation) => {
    return (this.#implementation = implementation);
  };

  /**
   * @deprecated
   *
   * Implements the machine with the provided implementation.
   * This method is used to set the implementation for the machine, allowing it to handle permissions
   * based on the provided implementation logic.
   * @param implementation The implementation logic to be set for the machine.
   * @returns A new instance of the machine with the provided implementation.
   */
  __implements = (implementation: Implementation) => {
    const _new = new Machine<Co, Implementation>(this.__config);

    _new.#implements(implementation);

    return _new;
  };

  #hasUserPermissions: HasUserPermissions_F<Co> = ({
    performer,
    owner,
    data,
    action,
    ressource,
  }) => {
    const sortedRoles = this.#reverseRoles(...performer.roles);

    const collecteds: CollectedReturns<any>[] = [];

    sortedRoles.forEach(role => {
      const key =
        `${String(role) as keyof Co & string}${DELIMITER}${ressource}${DELIMITER}${action}` as keyof Implementation;

      const permission = this.#implementation[key];

      if (common.castings.is.undefined(permission)) return;

      if (typeof permission === 'function') {
        const result = permission({
          owner,
          performer,
          data,
        });

        return collecteds.push(result);
      }

      return collecteds.push(permission);
    });

    if (collecteds.length === 0) return false;

    return Machine.reduceCollection('or', ...collecteds);
  };

  #hasDataPermissions: HasDataPermissions_F<Co> = (
    performer,
    action,
    extra,
  ) => {
    const permissions = this.#extractDataPermissions(extra);

    const sortedRoles = this.#reverseRoles(...performer.roles);

    if (permissions === true) return true;

    const result1 = permissions[`user:${performer.__id}`]?.[action];

    const alreadyTrue = result1 === true;
    if (alreadyTrue) return true;

    const collecteds: CollectedReturns<any>[] = [];

    if (common.castings.is.defined(result1)) collecteds.push(result1);

    sortedRoles.forEach(role => {
      const _role = String(role) as keyof Co & string;
      const value1 = permissions[`role:${_role}`]?.[action];
      if (value1) collecteds.push(value1);
    });

    if (collecteds.length === 0) return true;

    return Machine.reduceCollection('or', ...collecteds);
  };

  hasPermisions: HasPermissions_F<Co> = args => {
    const userPermissions = this.#hasUserPermissions(args);
    const dataPermissions = this.#hasDataPermissions(
      args.performer,
      args.action,
      args.data?.__extraPermissions,
    );

    const strategy =
      this.#ressources[args.ressource].__strategy || 'bypass';

    return Machine.reduceCollection<any>(
      strategy,
      userPermissions,
      dataPermissions,
    );
  };

  #extractDataPermissions = <
    Re extends Extract<keyof Co['ressources'], string>,
    PD extends TrueObject = DeepPartial<Co['ressources'][Re]['dataType']>,
    Keys extends string = KeysMatching<PD>,
  >(
    permissions?: ResPerm<Co, Re, Keys>,
  ): ResPerm2<Co, Re, Keys[]> => {
    if (!permissions) return true;

    type Pe = ResPerm<Co, Re, Keys>;

    type Entries = [keyof Pe, ValuesOf<Pe>][];

    const entries = common.castings.unknown<Entries>(
      Object.entries(permissions),
    );

    const allValuesAreNotDefineds = entries.every(([, value]) =>
      common.castings.is.undefined(value),
    );
    if (allValuesAreNotDefineds) return true;

    const out: any = {};

    entries.forEach(([action, _permissions]) => {
      if (common.castings.is.undefined(_permissions)) return;

      const { allow, disallow } = _permissions;

      if (allow) {
        const allowEntries: [string, string[]][] = Object.entries(allow);

        allowEntries.forEach(([dataKey, userIds]) => {
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

      if (disallow) {
        const disallowEntries: [string, string[]][] =
          Object.entries(disallow);

        disallowEntries.forEach(([dataKey, userIds]) => {
          if (userIds.length === 0) return;

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

  static reduceCollection: ReduceCollectedReturns_F = (
    strategy,
    ...collecteds
  ) => {
    if (!strategy || strategy === 'bypass') return collecteds[0];

    const isOr = strategy === 'or';
    let out: any;

    for (const result of collecteds) {
      if (Array.isArray(out)) {
        if (Array.isArray(result)) {
          if (isOr) out = [...new Set([...out, ...result])];
          else {
            out = out.filter(value => result.includes(value));
          }
        }
        if (!isOr && result === false) return false;
        continue;
      }

      if (result === isOr) return isOr;

      out = result;
    }

    return out;
  };
}

export const createMachine = <const Co extends Config>(
  config: Co,
  implementation: Impl<Co>,
) => {
  const machine = new Machine(config).__implements(implementation);

  return machine;
};

export { type Machine };
