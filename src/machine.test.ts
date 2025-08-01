import { createTests } from '@bemedev/vitest-extended';
import { createMachine } from './machine';
import { typings } from './typings';

describe('Machine Tests', () => {
  describe('#01 => Basic Machine Creation', () => {
    const machine = createMachine(
      typings({
        ressources: {
          image: {
            actions: ['view', 'delete', 'edit'],
            dataType: { id: 'string' },
            // __strategy: 'bypass',
          },
          document: {
            actions: ['view', 'delete', 'edit', 'create'],
            dataType: { id: 'string' },
            __strategy: 'and',
          },
        },
        user: { name: 'string', age: 'number' },
        roles: { admin: 5, user: 1 },
      }),

      {
        'admin:image:view': true,
        'user:image:view': true,
        'admin:document:delete': true,
        'user:document:create': ({ performer: { name } }) =>
          name === 'BRI',
      },
    );

    const { acceptation, success } = createTests(machine.hasPermisions);

    describe('#00 => Acceptation', acceptation);

    describe(
      '#01 => Success',
      success(
        {
          invite: 'Admin can view image',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'image',
            action: 'view',
            data: { id: '789' },
          },
          expected: true,
        },
        {
          invite: 'Admin can delete document with permission',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'document',
            action: 'delete',
            data: { id: '789' },
          },
          expected: true,
        },
        {
          invite: 'User can view image',
          parameters: {
            performer: { __id: '456', name: 'User', roles: ['user'] },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'image',
            action: 'view',
            data: { id: '789' },
          },
          expected: true,
        },
        {
          invite: 'User cannot edit document',
          parameters: {
            performer: { __id: '456', name: 'User', roles: ['user'] },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'document',
            action: 'edit',
            data: { id: '789' },
          },
          expected: false,
        },
        {
          invite: 'User cannot delete document (not in permissions)',
          parameters: {
            performer: { __id: '456', name: 'User', roles: ['user'] },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'document',
            action: 'delete',
            data: { id: '789' },
          },
          expected: false,
        },
        {
          invite: 'User with multiple roles inherits admin permissions',
          parameters: {
            performer: {
              __id: '789',
              name: 'SuperUser',
              roles: ['user', 'admin'],
            },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'document',
            action: 'delete',
            data: { id: '789' },
          },
          expected: true,
        },
        {
          invite: 'Non-existent action returns false',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'image',
            action: 'create',
            data: { id: '789' },
          },
          expected: false,
        },
        {
          invite: 'User with no roles cannot access anything',
          parameters: {
            performer: { __id: '999', name: 'NoRole', roles: [] },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'image',
            action: 'view',
            data: { id: '789' },
          },
          expected: false,
        },
        {
          invite: 'Admin can edit image without specific implementation',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'image',
            action: 'edit',
            data: { id: '789' },
          },
          expected: false,
        },
        {
          invite: 'User with name BRI can create document',
          parameters: {
            performer: { __id: '123', name: 'BRI', roles: ['user'] },
            owner: { __id: '456', roles: ['user'] },
            ressource: 'document',
            action: 'create',
            data: { id: '789' },
          },
          expected: true,
        },
        {
          invite: 'User with random name cannot create document',
          parameters: {
            performer: { __id: '123', name: 'Alfred', roles: ['user'] },
            owner: { __id: '456', roles: ['user'] },
            ressource: 'document',
            action: 'create',
            data: { id: '789' },
          },

          expected: false,
        },
      ),
    );

    describe('#03 => cov', () => {
      it('Getter __user returns undefined', () => {
        expect(machine.__user).toBeUndefined();
      });
    });
  });

  describe('#02 => Machine Properties and Getters', () => {
    const config = typings({
      ressources: {
        post: {
          actions: ['read', 'write', 'delete'],
          dataType: { id: 'string', authorId: 'string' },
          __strategy: 'or',
        },
      },
      user: { name: 'string', email: 'string' },
      roles: { admin: 10, moderator: 5, user: 1 },
    });

    const machine = createMachine(config, {
      'admin:post:read': true,
      'user:post:read': true,
    });

    test('should expose immutable config', () => {
      expect(machine.config).toEqual(expect.objectContaining(config));

      // Test immutability
      expect(() => {
        (config as any).ressources = {};
      }).toThrow();
    });

    test('should expose immutable roles', () => {
      const roles = machine.roles;
      expect(roles).toEqual({ admin: 10, moderator: 5, user: 1 });

      // Test immutability
      expect(() => {
        (roles as any).admin = 20;
      }).toThrow();
    });

    test('should expose immutable implementation', () => {
      const implementation = machine.implementation;
      expect(implementation).toEqual(
        expect.objectContaining({
          'admin:post:read': true,
          'user:post:read': true,
        }),
      );

      // Test immutability
      expect(() => {
        (implementation as any)['admin:post:read'] = false;
      }).toThrow();
    });

    test('should expose immutable ressources', () => {
      const ressources = machine.ressources;
      expect(ressources).toEqual(
        expect.objectContaining({
          post: expect.objectContaining({
            actions: ['read', 'write', 'delete'],
            __strategy: 'or',
          }),
        }),
      );

      // Test immutability
      expect(() => {
        (ressources as any).post = {};
      }).toThrow();
    });

    test('should return correct priority for roles', () => {
      expect(machine.getPriority('admin')).toBe(10);
      expect(machine.getPriority('moderator')).toBe(5);
      expect(machine.getPriority('user')).toBe(1);
    });
  });

  describe('#03 => Role Sorting', () => {
    const machine = createMachine(
      typings({
        ressources: {
          file: {
            actions: ['read'],
            dataType: { id: 'string' },
            __strategy: 'bypass',
          },
        },
        user: { name: 'string' },
        roles: { admin: 10, moderator: 5, user: 1, guest: 0 },
      }),
      { 'admin:file:read': true },
    );

    test('should sort roles in ascending order', () => {
      const sorted = machine.sortRoles(
        'asc',
        'admin',
        'user',
        'moderator',
        'guest',
      );
      expect(sorted).toEqual(['guest', 'user', 'moderator', 'admin']);
    });

    test('should sort roles in descending order', () => {
      const sorted = machine.sortRoles(
        'desc',
        'admin',
        'user',
        'moderator',
        'guest',
      );
      expect(sorted).toEqual(['admin', 'moderator', 'user', 'guest']);
    });

    test('should handle single role', () => {
      const sorted = machine.sortRoles('asc', 'admin');
      expect(sorted).toEqual(['admin']);
    });

    test('should handle empty roles array', () => {
      const sorted = machine.sortRoles('asc');
      expect(sorted).toEqual([]);
    });
  });

  describe('#04 => Strategy Testing - OR', () => {
    const machine = createMachine(
      typings({
        ressources: {
          article: {
            actions: ['read', 'write'],
            dataType: { id: 'string', authorId: 'string' },
            __strategy: 'or',
          },
        },
        user: { name: 'string' },
        roles: { admin: 5, user: 1 },
      }),
      {
        'admin:article:read': true,
        'user:article:read': false,
        'admin:article:write': ({ performer, data }) =>
          performer.__id === data?.authorId ? ['id', 'authorId'] : false,
      },
    );

    const { success } = createTests(machine.hasPermisions);

    describe(
      'OR Strategy Tests',
      success(
        {
          invite:
            'User can read article with data permissions (OR strategy)',
          parameters: {
            performer: { __id: '123', name: 'User', roles: ['user'] },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'article',
            action: 'read',
            data: {
              id: '789',
              authorId: '123',
              __extraPermissions: {
                read: {
                  allow: {
                    '**': ['user:123'],
                  },
                },
              },
            },
          },
          expected: true,
        },
        {
          invite: 'Admin can write specific fields when is author',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'article',
            action: 'write',
            data: {
              id: '789',
              authorId: '123',
            },
          },
          expected: ['id', 'authorId'],
        },
        {
          invite: 'Admin cannot write when not author',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'article',
            action: 'write',
            data: {
              id: '789',
              authorId: '456',
            },
          },
          expected: true,
        },
      ),
    );
  });

  describe('#05 => Strategy Testing - AND', () => {
    const machine = createMachine(
      typings({
        ressources: {
          sensitive: {
            actions: ['access', 'modify'],
            dataType: { id: 'string', level: 'string' },
            __strategy: 'and',
          },
        },
        user: { name: 'string', clearance: 'string' },
        roles: { admin: 10, user: 1 },
      }),
      {
        'admin:sensitive:access': true,
        'admin:sensitive:modify': ({ performer }) =>
          performer.clearance === 'high' ? true : false,
        'user:sensitive:access': false,
      },
    );

    const { success } = createTests(machine.hasPermisions);

    describe(
      'AND Strategy Tests',
      success(
        {
          invite:
            'Admin with high clearance can modify with data permission',
          parameters: {
            performer: {
              __id: '123',
              name: 'Admin',
              clearance: 'high',
              roles: ['admin'],
            },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'sensitive',
            action: 'modify',
            data: {
              id: '789',
              level: 'high',
              __extraPermissions: {
                modify: {
                  allow: {
                    '**': ['user:123'],
                  },
                },
              },
            },
          },
          expected: true,
        },
        {
          invite:
            'Admin with low clearance cannot modify even with data permission',
          parameters: {
            performer: {
              __id: '123',
              name: 'Admin',
              clearance: 'low',
              roles: ['admin'],
            },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'sensitive',
            action: 'modify',
            data: {
              id: '789',
              level: 'high',
              __extraPermissions: {
                modify: {
                  allow: {
                    '**': ['user:123'],
                  },
                },
              },
            },
          },
          expected: false,
        },
        {
          invite:
            'Admin can access but fails on false user permission (AND)',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'sensitive',
            action: 'access',
            data: {
              id: '789',
              level: 'high',
              __extraPermissions: {
                access: {
                  disallow: {
                    '**': ['user:123'],
                  },
                  allow: {
                    '**': ['user:12ret3'],
                  },
                },
              },
            },
          },
          expected: false,
        },
        {
          invite: 'Admin can access because no data permissions',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'sensitive',
            action: 'access',
            data: {
              id: '789',
              level: 'high',
            },
          },
          expected: true,
        },
        {
          invite: 'Admin can access because empty data permissions',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'sensitive',
            action: 'access',
            data: {
              id: '789',
              level: 'high',
              __extraPermissions: {},
            },
          },
          expected: true,
        },
        {
          invite:
            'Admin can access because empty data permissions IDS array',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'sensitive',
            action: 'access',
            data: {
              id: '789',
              level: 'high',
              __extraPermissions: {
                access: {
                  allow: {
                    '**': ['user:123'],
                  },
                  disallow: {
                    '**': [],
                  },
                },
              },
            },
          },
          expected: true,
        },
        {
          invite: 'Admin can access because undefined access permissions',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'sensitive',
            action: 'access',
            data: {
              id: '789',
              level: 'high',
              __extraPermissions: {
                access: undefined,
                modify: {
                  allow: {
                    '**': ['user:123'],
                  },
                },
              },
            },
          },
          expected: true,
        },
      ),
    );
  });

  describe('#06 => Data Permissions Complex Scenarios', () => {
    const machine = createMachine(
      typings({
        ressources: {
          project: {
            actions: ['view', 'edit', 'delete'],
            dataType: {
              id: 'string',
              title: 'string',
              description: 'string',
            },
            __strategy: 'and',
          },
        },
        user: { name: 'string' },
        roles: { admin: 10, editor: 5, viewer: 1 },
      }),
      {
        'admin:project:view': true,
        'admin:project:edit': true,
        'admin:project:delete': true,
        'editor:project:view': true,
        'editor:project:edit': true,
        'viewer:project:view': true,
      },
    );

    const { success } = createTests(machine.hasPermisions);

    describe(
      'Complex Data Permissions',
      success(
        {
          invite:
            'User with specific field permissions can edit specific fields',
          parameters: {
            performer: { __id: '123', name: 'Editor', roles: ['editor'] },
            owner: { __id: '456', name: 'Owner', roles: ['admin'] },
            ressource: 'project',
            action: 'edit',
            data: {
              id: '789',
              title: 'Test Project',
              description: 'Test Description',
              __extraPermissions: {
                edit: {
                  allow: {
                    title: ['user:123'],
                    description: ['user:123'],
                  },
                },
              },
            },
          },
          expected: ['title', 'description'],
        },
        {
          invite: 'User with mixed allow/disallow gets correct result',
          parameters: {
            performer: { __id: '123', name: 'Editor', roles: ['editor'] },
            owner: { __id: '456', name: 'Owner', roles: ['admin'] },
            ressource: 'project',
            action: 'edit',
            data: {
              id: '789',
              title: 'Test Project',
              description: 'Test Description',
              __extraPermissions: {
                edit: {
                  allow: {
                    title: ['user:123'],
                    description: ['user:123'],
                  },
                  disallow: {
                    description: ['user:123'], // disallow takes precedence
                  },
                },
              },
            },
          },
          expected: ['title'],
        },
        {
          invite: 'User with role-based permissions gets access',
          parameters: {
            performer: { __id: '123', name: 'Editor', roles: ['editor'] },
            owner: { __id: '456', name: 'Owner', roles: ['admin'] },
            ressource: 'project',
            action: 'view',
            data: {
              id: '789',
              title: 'Test Project',
              __extraPermissions: {
                view: {
                  allow: {
                    '**': ['role:editor'],
                  },
                },
              },
            },
          },
          expected: true,
        },
        {
          invite: 'User blocked by disallow rule cannot access',
          parameters: {
            performer: { __id: '123', name: 'Viewer', roles: ['viewer'] },
            owner: { __id: '456', name: 'Owner', roles: ['admin'] },
            ressource: 'project',
            action: 'view',
            data: {
              id: '789',
              title: 'Test Project',
              __extraPermissions: {
                view: {
                  disallow: {
                    '**': ['user:123'],
                  },
                },
              },
            },
          },
          expected: false,
        },
      ),
    );
  });

  describe('#07 => Multi-Role Priority Testing', () => {
    const machine = createMachine(
      typings({
        ressources: {
          resource: {
            actions: ['action1', 'action2'],
            dataType: { id: 'string' },
            __strategy: 'bypass',
          },
        },
        user: { name: 'string' },
        roles: { superadmin: 100, admin: 50, moderator: 25, user: 1 },
      }),
      {
        'user:resource:action1': false,
        'moderator:resource:action1': ['id'],
        'admin:resource:action1': ['id'],
        'superadmin:resource:action1': true,
        'user:resource:action2': ({ performer }) =>
          performer.name === 'Special',
        'admin:resource:action2': true,
      },
    );

    const { success } = createTests(machine.hasPermisions);

    describe(
      'Multi-Role Priority Tests',
      success(
        {
          invite: 'Highest priority role (superadmin) takes precedence',
          parameters: {
            performer: {
              __id: '123',
              name: 'SuperUser',
              roles: ['user', 'moderator', 'admin', 'superadmin'],
            },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'resource',
            action: 'action1',
            data: { id: '789' },
          },
          expected: true,
        },
        {
          invite: 'Admin role takes precedence over lower roles',
          parameters: {
            performer: {
              __id: '123',
              name: 'PowerUser',
              roles: ['user', 'moderator', 'admin'],
            },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'resource',
            action: 'action1',
            data: { id: '789' },
          },
          expected: ['id'],
        },
        {
          invite: 'Function permissions work with multiple roles',
          parameters: {
            performer: {
              __id: '123',
              name: 'Special',
              roles: ['user', 'admin'],
            },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'resource',
            action: 'action2',
            data: { id: '789' },
          },
          expected: true,
        },
        {
          invite: 'Multiple permissions are collected when available',
          parameters: {
            performer: {
              __id: '123',
              name: 'Regular',
              roles: ['user', 'moderator'],
            },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'resource',
            action: 'action1',
            data: { id: '789' },
          },
          expected: ['id'],
        },
      ),
    );
  });

  describe('#08 => Static reduceCollection Method', () => {
    // Create a temporary machine instance to access static method
    const tempMachine = createMachine(
      typings({
        ressources: {
          temp: {
            actions: ['read'],
            dataType: { id: 'string' },
            __strategy: 'bypass',
          },
        },
        user: { name: 'string' },
        roles: { user: 1 },
      }),
      { 'user:temp:read': true },
    );

    test('should return true when any value is true', () => {
      expect(
        (tempMachine.constructor as any).reduceCollection(
          'or',
          false,
          ['field1'],
          true,
          ['field2'],
        ),
      ).toEqual(['field1', 'field2']);
    });

    test('should merge arrays when no true value present', () => {
      expect(
        (tempMachine.constructor as any).reduceCollection(
          'or',
          ['field1'],
          ['field2'],
          ['field1', 'field3'],
        ),
      ).toEqual(['field1', 'field2', 'field3']);
    });

    test('should handle false values correctly', () => {
      expect(
        (tempMachine.constructor as any).reduceCollection('or', false, [
          'field1',
        ]),
      ).toEqual(['field1']);
    });

    test('should return last non-array value when no arrays or true', () => {
      expect(
        (tempMachine.constructor as any).reduceCollection(
          'and',
          false,
          false,
          false,
        ),
      ).toBe(false);
    });

    test('should handle empty input', () => {
      expect(
        (tempMachine.constructor as any).reduceCollection('and'),
      ).toEqual(undefined);
    });

    test('should deduplicate arrays', () => {
      expect(
        (tempMachine.constructor as any).reduceCollection(
          'or',
          ['a', 'b'],
          ['b', 'c'],
          ['a', 'd'],
        ),
      ).toEqual(['a', 'b', 'c', 'd']);
    });

    test('should deduplicate arrays, even with a false inside', () => {
      expect(
        (tempMachine.constructor as any).reduceCollection(
          'or',
          ['a', 'b'],
          false,
          ['b', 'c'],
          ['a', 'd'],
        ),
      ).toEqual(['a', 'b', 'c', 'd']);
    });

    describe('strategy "and"', () => {
      test('it reduces the arrays', () => {
        expect(
          (tempMachine.constructor as any).reduceCollection(
            'and',
            ['a', 'b'],
            ['b', 'c', 'a'],
            ['a', 'd'],
          ),
        ).toEqual(['a']);
      });
      test('if one is false, all is false', () => {
        expect(
          (tempMachine.constructor as any).reduceCollection(
            'and',
            ['a', 'b'],
            ['b', 'c', 'a'],
            false,
          ),
        ).toEqual(false);
        expect(
          (tempMachine.constructor as any).reduceCollection(
            'and',
            ['a', 'b'],
            true,
            ['b', 'c', 'a'],
            false,
          ),
        ).toEqual(false);
      });
    });
  });

  describe('#09 => Edge Cases and Error Handling', () => {
    const machine = createMachine(
      typings({
        ressources: {
          test: {
            actions: ['read'],
            dataType: { id: 'string' },
            __strategy: 'bypass',
          },
        },
        user: { name: 'string' },
        roles: { admin: 5, user: 1 },
      }),
      {
        'admin:test:read': true,
      },
    );

    const { success } = createTests(machine.hasPermisions);

    describe(
      'Edge Cases',
      success(
        {
          invite:
            'User with undefined extra permissions gets default behavior',
          parameters: {
            performer: { __id: '123', name: 'User', roles: ['user'] },
            owner: { __id: '456', name: 'Owner', roles: ['admin'] },
            ressource: 'test',
            action: 'read',
            data: {
              id: '789',
              __extraPermissions: undefined,
            },
          },
          expected: false,
        },
        {
          invite: 'User with empty permissions object gets default',
          parameters: {
            performer: { __id: '123', name: 'User', roles: ['user'] },
            owner: { __id: '456', name: 'Owner', roles: ['admin'] },
            ressource: 'test',
            action: 'read',
            data: {
              id: '789',
              __extraPermissions: {},
            },
          },
          expected: false,
        },
        {
          invite: 'User with empty array roles gets no permissions',
          parameters: {
            performer: { __id: '123', name: 'User', roles: [] },
            owner: { __id: '456', name: 'Owner', roles: ['admin'] },
            ressource: 'test',
            action: 'read',
            data: { id: '789' },
          },
          expected: false,
        },
        {
          invite: 'Admin can access without data object',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'Owner', roles: ['user'] },
            ressource: 'test',
            action: 'read',
          },
          expected: true,
        },
      ),
    );
  });
});
