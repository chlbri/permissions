export type DeepPartial<T extends object> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type PermissionsType<T = any> = {
  action: string;
  dataType: T;
};

export type PermissionsTypes = Record<string, PermissionsType>;

export type Roles = string;

export type User<R extends Roles = Roles> = { __id: string; roles: R[] };

export type PermissionCheck<
  U extends User,
  P extends PermissionsTypes,
  K extends keyof P,
  PD extends P[K]['dataType'] = P[K]['dataType'],
> =
  | boolean
  | PD
  | ((args: {
      performer: U;
      data: P[K]['dataType'];
      owner: U;
    }) => boolean | PD);

export type RolesWithPermissions<
  R extends Roles,
  U extends User<R>,
  P extends PermissionsTypes,
> = {
  [role in R]: Partial<{
    [key in keyof P]: Partial<{
      [action in P[key]['action']]: PermissionCheck<U, P, key>;
    }>;
  }>;
};
