import { castings } from '@bemedev/types';
import type { Ressource, RessourcePermission, Strategy } from './types';

export const identity = <const T>(value?: T) => value as T;

export const extractStrategy = (strategy?: Strategy) => {
  return strategy || 'bypass';
};

export const extractRessourcePermissions = <
  const P extends Ressource,
  const S extends string = string,
>(
  permission?: RessourcePermission<P, S>,
) => {
  if (!permission) return true;

  type Entries = [P['action'], RessourcePermission<P, S>[P['action']]];

  const entries: Entries[] = Object.entries(permission);

  const allValuesAreNotDefineds = entries.every(([, value]) =>
    castings.commons.isUndefined(value),
  );
  if (allValuesAreNotDefineds) return true;

  const out: Record<
    // User IDs extracted from the arrays
    string,
    Record<
      P['action'],
      // Here "**" means all keys of the dataType
      (keyof P['dataType'] | '**')[] | boolean
    >
  > = {};

  entries.forEach(([action, actionPermissions]) => {
    if (
      !actionPermissions ||
      castings.commons.isUndefined(actionPermissions)
    ) {
      return;
    }

    // Process 'allow' permissions
    const allowPerms = actionPermissions?.allow;
    if (allowPerms) {
      const allowEntries = Object.entries(allowPerms);

      allowEntries.forEach(([dataKey, userIds]) => {
        if (!Array.isArray(userIds) || userIds.length === 0) return;

        userIds.forEach(userId => {
          if (!out[userId]) {
            out[userId] = {} as Record<
              P['action'],
              (keyof P['dataType'] | '**')[] | boolean
            >;
          }

          if (!out[userId][action as P['action']]) {
            out[userId][action as P['action']] = [];
          }

          const currentValue = out[userId][action as P['action']];

          if (dataKey === '**') {
            out[userId][action as P['action']] = true;
          } else if (Array.isArray(currentValue)) {
            if (!currentValue.includes(dataKey as keyof P['dataType'])) {
              currentValue.push(dataKey as keyof P['dataType']);
            }
          }
        });
      });
    }

    // Process 'disallow' permissions (similar logic but for restrictions)
    const disallowPerms = (actionPermissions as any)?.disallow;
    if (disallowPerms) {
      const disallowEntries = Object.entries(disallowPerms);

      disallowEntries.forEach(([dataKey, userIds]) => {
        if (!Array.isArray(userIds) || userIds.length === 0) return;

        userIds.forEach(userId => {
          if (!out[userId]) {
            out[userId] = {} as Record<
              P['action'],
              (keyof P['dataType'] | '**')[] | boolean
            >;
          }

          if (!out[userId][action as P['action']]) {
            out[userId][action as P['action']] = [];
          }

          const currentValue = out[userId][action as P['action']];

          if (dataKey === '**') {
            out[userId][action as P['action']] = false;
          } else if (Array.isArray(currentValue)) {
            // Remove from allowed if it was there (disallow takes precedence)
            const index = currentValue.indexOf(
              dataKey as keyof P['dataType'],
            );
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
