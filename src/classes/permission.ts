import { transform, typings, type types } from '@bemedev/types';
import type { ObjectS } from '@bemedev/types/lib/transform/types.types';
import { extractRessourcePermissions } from '../helpers';
import type {
  Ressource,
  Ressources,
  Roles,
  RolesWithPermissions,
  User,
} from '../types';
import type {
  CollectedPermission,
  HasDataPermissions_F,
  HasPermissions2_F,
  HasUserPermissions_F,
  ProvidePermissions_F,
  ReduceCollectedPermissions_F,
  RessourceS,
} from './permission.types';

class Permissions<
  const R extends Roles,
  const U extends object,
  const P extends Ressources,
  _User extends User<R> & U = User<R> & U,
> {
  get roles() {
    return Object.freeze(this._roles);
  }

  #permissions!: RolesWithPermissions<R, _User, P>;

  get permissions() {
    return Object.freeze(this.#permissions);
  }

  #ressources!: P;

  get __user() {
    return typings.commons.unknown<_User>();
  }

  getPriority(role: keyof R) {
    return this._roles[role];
  }

  #sortRoles = (roles: (keyof R)[]) => {
    return roles.sort((a, b) => {
      return this.getPriority(a) - this.getPriority(b);
    });
  };

  #reverseRoles = (roles: (keyof R)[]) => {
    return roles.sort((a, b) => {
      return this.getPriority(b) - this.getPriority(a);
    });
  };

  sortRoles = (order: 'asc' | 'desc', ...roles: (keyof R)[]) => {
    if (order === 'asc') return this.#sortRoles(roles);
    return this.#reverseRoles(roles);
  };

  constructor(private _roles: R) {}

  /**
   * @deprecated
   * @param user
   */
  __provideUser = <T extends ObjectS>(user: T) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _user = transform(user);

    type Transformed = Extract<typeof _user, object>;

    type __User = User<R> & Transformed;

    const _new = new Permissions<R, Transformed, P, __User>(this._roles);

    _new.#ressources = this.#ressources;
  };

  /**
   * @deprecated
   * @param key
   * @param _ressource
   * @returns
   */
  __provideRessource = <
    S extends string,
    T extends ObjectS,
    A extends string[],
  >(
    key: S,
    _ressource: RessourceS<A, T>,
  ) => {
    const dataType = transform(_ressource.dataType);

    const ressource = {
      action: typings.commons.unknown<A[number]>(),
      dataType,
      __strategy: _ressource.__strategy,
    } as const satisfies Ressource<typeof dataType>;

    const ressources = {
      ...this.#ressources,
      [key]: ressource,
    } as P & Record<S, typeof ressource>;

    const _new = new Permissions<R, U, typeof ressources, _User>(
      this._roles,
    );

    _new.#ressources = ressources;

    return ressource;
  };

  providePermissions: ProvidePermissions_F<R, P, _User> = permissions => {
    const _new = new Permissions<R, U, P, _User>(this._roles);

    _new.#ressources = this.#ressources;
    _new.#permissions = permissions;

    return permissions;
  };

  getPermissions() {
    return this.#permissions;
  }

  #hasUserPermissions: HasUserPermissions_F<R, P, _User> = ({
    performer,
    owner,
    data,
    action,
  }) => {
    const sortedRoles = this.#reverseRoles(performer.roles);

    const collecteds: CollectedPermission<any>[] = [];

    for (const role of sortedRoles) {
      const ressources = this.#permissions[role];
      if (!ressources) continue;

      for (const _ressource in ressources) {
        const actions = ressources[_ressource];
        if (!actions) continue;

        const _action = actions[action];
        if (!_action) continue;

        if (typeof _action === 'function') {
          const result = _action({
            performer,
            owner,
            data,
          });

          collecteds.push(result);
        } else collecteds.push(_action);
      }
    }

    if (collecteds.length === 0) return false;

    return Permissions.reduceCollectedPermissions(...collecteds);
  };

  static reduceCollectedPermissions: ReduceCollectedPermissions_F = (
    ...collecteds
  ) => {
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

  #hasDataPermissions: HasDataPermissions_F<R, P, _User> = (
    performer,
    action,
    extraPermisions,
  ) => {
    const permissions = extractRessourcePermissions(extraPermisions);
    const sortedRoles = this.#reverseRoles(performer.roles);

    if (permissions === true) return true;
    const result1 = permissions[`user:${performer.__id}`]?.[action];

    const alreadyTrue = result1 === true;
    if (alreadyTrue) return true;

    const collecteds: CollectedPermission<any>[] = [];

    if (result1) collecteds.push(result1);

    for (const role of sortedRoles) {
      const value1 =
        permissions[`role:${String(role) as keyof R & string}`]?.[action];

      if (value1) collecteds.push(value1);
    }

    if (collecteds.length === 0) return true;

    return Permissions.reduceCollectedPermissions(...collecteds);
  };

  #hasPermissions: HasPermissions2_F<R, P, _User> = (args, strategy) => {
    const userPermissions = this.#hasUserPermissions(args);

    const getData = () =>
      this.#hasDataPermissions(
        args.performer,
        args.action,
        args.data?.__extraPermissions,
      );

    switch (strategy) {
      case 'bypass':
        return userPermissions;
      case 'and': {
        if (userPermissions === false) return false;

        const dataPermissions = getData();

        if (userPermissions === true) return dataPermissions;

        return Permissions.reduceCollectedPermissions<any>(
          userPermissions,
          dataPermissions,
        );
      }
      case 'or': {
        return Permissions.reduceCollectedPermissions<any>(
          userPermissions,
          getData(),
        );
      }
    }
  };
}

export type { Permissions };
