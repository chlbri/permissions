import { createTests } from '@bemedev/vitest-extended';
import { extractRessourcePermissions } from './helpers';
import type { RessourcePermission } from './types';

describe('Helpers Functions', () => {
  // Define a test permission type for testing

  const { success } = createTests(extractRessourcePermissions);

  describe('#01 => extractRessourcePermissions', () => {
    describe('#01.01 => Basic Cases', () => {
      test('returns true for undefined permission', () => {
        const result = (extractRessourcePermissions as any)(undefined);
        expect(result).toBe(true);
      });

      test('returns true for empty permission object', () => {
        const result = (extractRessourcePermissions as any)({});
        expect(result).toBe(true);
      });

      test('returns true when all values are undefined', () => {
        const permission = {
          view: undefined,
          edit: undefined,
          delete: undefined,
        } as const;

        const result = (extractRessourcePermissions as any)(permission);
        expect(result).toBe(true);
      });
    });

    describe('#01.02 => Allow Permissions', () => {
      test('handles simple allow permissions', () => {
        const result = extractRessourcePermissions({
          view: {
            allow: {
              id: ['user:user1', 'user:user2'],
              title: ['user:user1'],
            },
          },
        });
        const expected = {
          user1: {
            view: ['id', 'title'],
          },
          user2: {
            view: ['id'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('handles wildcard allow permissions', () => {
        const permission: RessourcePermission = {
          view: {
            allow: {
              '**': ['user:admin1'],
              id: ['user:user1'],
            },
          },
        };

        const result = extractRessourcePermissions(permission);
        const expected = {
          admin1: {
            view: true,
          },
          user1: {
            view: ['id'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('handles multiple actions with allow permissions', () => {
        const permission: RessourcePermission = {
          view: {
            allow: {
              id: ['user:user1'],
              title: ['user:user1', 'user:user2'],
            },
          },
          edit: {
            allow: {
              content: ['user:user1'],
              '**': ['user:admin1'],
            },
          },
        };

        const result = extractRessourcePermissions(permission);
        const expected = {
          user1: {
            view: ['id', 'title'],
            edit: ['content'],
          },
          user2: {
            view: ['title'],
          },
          admin1: {
            edit: true,
          },
        };

        expect(result).toEqual(expected);
      });
    });

    describe('#01.03 => Disallow Permissions', () => {
      test('handles simple disallow permissions', () => {
        const permission: RessourcePermission = {
          view: {
            allow: {
              id: ['user:user1'],
              title: ['user:user1'],
              content: ['user:user1'],
            },
            disallow: {
              title: ['user:user1'],
            },
          },
        } as const;

        const result = extractRessourcePermissions(permission);
        const expected = {
          user1: {
            view: ['id', 'content'], // title removed by disallow
          },
        };

        expect(result).toEqual(expected);
      });

      test('handles wildcard disallow permissions', () => {
        const permission: RessourcePermission = {
          view: {
            allow: {
              id: ['user:user1'],
              title: ['user:user1'],
            },
            disallow: {
              '**': ['user:user1'],
            },
          },
        };

        const result = extractRessourcePermissions(permission);
        const expected = {
          user1: {
            view: false, // overridden by wildcard disallow
          },
        };

        expect(result).toEqual(expected);
      });

      test('handles mixed allow and disallow permissions', () => {
        const permission: RessourcePermission = {
          view: {
            allow: {
              '**': ['user:admin1'],
              id: ['user:user1', 'user:user2'],
              title: ['user:user1', 'user:user2'],
            },
            disallow: {
              title: ['user:user2'],
              content: ['user:user1'],
            },
          },
          edit: {
            allow: {
              content: ['user:user1', 'user:user2'],
            },
            disallow: {
              '**': ['user:user2'],
            },
          },
        } as const;

        const result = extractRessourcePermissions(permission);
        const expected = {
          admin1: {
            view: true,
          },
          user1: {
            view: ['id', 'title'], // content removed by disallow
            edit: ['content'],
          },
          user2: {
            view: ['id'], // title removed by disallow
            edit: false, // overridden by wildcard disallow
          },
        };

        expect(result).toEqual(expected);
      });
    });

    describe('#01.04 => Edge Cases', () => {
      test('handles empty arrays in permissions', () => {
        const permission: RessourcePermission = {
          view: {
            allow: {
              id: [],
              title: ['user:user1'],
            },
            disallow: {
              content: [],
            },
          },
        };

        const result = extractRessourcePermissions(permission);
        const expected = {
          user1: {
            view: ['title'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('handles multiple users with overlapping permissions', () => {
        const permission: RessourcePermission = {
          view: {
            allow: {
              id: ['user:user1', 'user:user2', 'user:user3'],
              title: ['user:user1', 'user:user2'],
              content: ['user:user1'],
            },
          },
          edit: {
            allow: {
              title: ['user:user1', 'user:user2'],
              content: ['user:user2', 'user:user3'],
            },
          },
          delete: {
            allow: {
              '**': ['user:user1'],
            },
            disallow: {
              id: ['user:user1'],
            },
          },
        };

        const result = extractRessourcePermissions(permission);
        const expected = {
          user1: {
            view: ['id', 'title', 'content'],
            edit: ['title'],
            delete: true, // wildcard allow, id disallow doesn't affect wildcard
          },
          user2: {
            view: ['id', 'title'],
            edit: ['title', 'content'],
          },
          user3: {
            view: ['id'],
            edit: ['content'],
          },
        };

        expect(result).toEqual(expected);
      });

      test('handles action with undefined permissions', () => {
        const permission: RessourcePermission = {
          view: {
            allow: {
              id: ['user:user1'],
            },
          },
          edit: undefined,
          delete: {
            allow: {
              content: ['user:user1'],
            },
          },
        };

        const result = extractRessourcePermissions(permission);
        const expected = {
          user1: {
            view: ['id'],
            delete: ['content'],
          },
        };

        expect(result).toEqual(expected);
      });
    });

    describe(
      '#01.05 => Success Pattern Tests',
      success(
        {
          invite: 'returns true for undefined permission',
          expected: true,
          parameters: [undefined],
        },
        {
          invite: 'extracts simple allow permissions correctly',
          expected: {
            user1: {
              view: ['id', 'title'],
            },
            user2: {
              view: ['id'],
            },
          },
          parameters: [
            {
              view: {
                allow: {
                  id: ['user:user1', 'user:user2'],
                  title: ['user:user1'],
                },
              },
            },
          ],
        },
        {
          invite: 'handles wildcard permissions correctly',
          expected: {
            admin1: {
              view: true,
            },
            user1: {
              view: ['id'],
            },
          },
          parameters: [
            {
              view: {
                allow: {
                  '**': ['user:admin1'],
                  id: ['user:user1'],
                },
              },
            },
          ],
        },
        {
          invite: 'processes disallow permissions correctly',
          expected: {
            user1: {
              view: ['id'], // title removed by disallow
            },
          },
          parameters: [
            {
              view: {
                allow: {
                  id: ['user:user1'],
                  title: ['user:user1'],
                },
                disallow: {
                  title: ['user:user1'],
                },
              },
            },
          ],
        },
        {
          invite: 'handles complex mixed permissions',
          expected: {
            admin1: {
              view: true,
              edit: ['content'],
            },
            user1: {
              view: ['id'],
              edit: ['content'],
            },
            user2: {
              view: ['id'],
              edit: false,
            },
          },
          parameters: [
            {
              view: {
                allow: {
                  '**': ['user:admin1'],
                  id: ['user:user1', 'user:user2'],
                  title: ['user:user1'],
                },
                disallow: {
                  title: ['user:user1'],
                },
              },
              edit: {
                allow: {
                  content: ['user:admin1', 'user:user1', 'user:user2'],
                },
                disallow: {
                  '**': ['user:user2'],
                },
              },
            },
          ],
        },
      ),
    );
  });
});
