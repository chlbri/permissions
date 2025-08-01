// /* eslint-disable @typescript-eslint/no-unused-vars */

// import type {
//   PermissionsTypes,
//   RessourcePermission,
//   Roles,
//   RolesWithPermissions,
//   User,
// } from './types';

// export const createRoles = <const R extends Roles>(roles: R) => roles;

// type CreateRolesWithPermissionsArgs<
//   R extends Roles,
//   U extends User<R>,
//   P extends PermissionsTypes,
// > = {
//   user?: U;
//   permissions?: P;
//   roles?: R;
// };

// export const createRolesWithPermissions = <
//   const R extends Roles,
//   const U extends User<R>,
//   const P extends PermissionsTypes,
// >(
//   _?: CreateRolesWithPermissionsArgs<R, U, P>,
// ) => {
//   const out = <const T extends RolesWithPermissions<R, U, P>>(
//     roles: T,
//   ) => {
//     const ROLES = roles;

//     type PermissionArgs<Re extends Extract<keyof P, string>> = {
//       performer: U;
//       owner: U;
//       resource: Re;
//       action: P[Re]['action'];
//       data?: Partial<P[Re]['dataType']> & {
//         __extraPermissions?: RessourcePermission<P[Re], R>;
//       };
//     };

//     const hasPermissions = <Re extends Extract<keyof P, string>>({
//       performer,
//       owner,
//       resource,
//       action,
//       data,
//     }: PermissionArgs<Re>) => {
//       return performer.roles.some(role => {
//         const permission = ROLES[role][resource]?.[action];

//         if (typeof permission === 'function') {
//           return permission(
//             Object.freeze({
//               performer,
//               data,
//               owner,
//             }),
//           );
//           // &&
//           // TODO: Add extra permissions on all ressources, User is also a ressource
//         }

//         return permission;
//       });
//     };

//     return {
//       hasPermissions,
//       ROLES,
//     };
//   };

//   return out;
// };
