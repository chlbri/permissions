import { createTests } from '@bemedev/vitest-extended';
import { createMachine } from './machine';

describe('Machine Tests', () => {
  describe('#01 => Basic Machine Creation', () => {
    // TODO: change typings to be more coherent roles not depending on ressources
    const machine = createMachine(
      {
        admin: {
          image: ['view', 'delete', 'edit'],
          document: ['view', 'delete', 'edit'],
        },
        user: {
          image: ['view', 'delete', 'edit'],
          document: ['view', 'edit'],
        },
      },
      {
        ressources: {
          image: {
            dataType: { id: 'string' },
            __strategy: 'bypass',
          },
          document: {
            dataType: { id: 'string' },
            __strategy: 'and',
          },
        },
        roles: { admin: 5, user: 1 },
        user: {} as { name: string; age: number },
      },
      {
        'admin:image:view': true,
        'user:image:view': true,
        'admin:document:delete': true,
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
          invite: 'Non-existent resource returns false',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'User', roles: ['user'] },
            ressource: 'video',
            action: 'view',
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
      ),
    );
  });

  describe('#02 => Machine Properties', () => {
    const machine = createMachine(
      {
        admin: {
          image: ['view', 'delete', 'edit'],
          document: ['view', 'delete', 'edit'],
        },
        user: {
          image: ['view', 'delete', 'edit'],
          document: ['view', 'edit'],
        },
      },
      {
        ressources: {
          image: {
            dataType: { id: 'string' },
            __strategy: 'bypass',
          },
          document: {
            dataType: { id: 'string' },
            __strategy: 'and',
          },
        },
        roles: { admin: 5, user: 1 },
        user: {} as { name: string; age: number },
      },
      {
        'admin:image:view': true,
        'admin:document:delete': true,
      },
    );

    const { success } = createTests(machine.hasPermisions);

    describe(
      '#01 => Machine Structure Tests',
      success(
        {
          invite: 'Machine should have correct config',
          parameters: () => machine.config !== undefined,
          expected: true,
        },
        {
          invite: 'Machine should have correct ressources',
          parameters: () =>
            machine.ressources.image.__strategy === 'bypass',
          expected: true,
        },
        {
          invite: 'Machine should have correct roles priority',
          parameters: () => machine.getPriority('admin') === 5,
          expected: true,
        },
        {
          invite: 'Machine should sort roles by priority ascending',
          parameters: () => {
            const sorted = machine.sortRoles('asc', 'admin', 'user');
            return sorted[0] === 'user' && sorted[1] === 'admin';
          },
          expected: true,
        },
        {
          invite: 'Machine should sort roles by priority descending',
          parameters: () => {
            const sorted = machine.sortRoles('desc', 'admin', 'user');
            return sorted[0] === 'admin' && sorted[1] === 'user';
          },
          expected: true,
        },
        {
          invite: 'Machine implementation should be frozen',
          parameters: () => Object.isFrozen(machine.implementation),
          expected: true,
        },
        {
          invite: 'Machine config should be frozen',
          parameters: () => Object.isFrozen(machine.config),
          expected: true,
        },
      ),
    );
  });

  describe('#03 => Edge Cases', () => {
    const machine = createMachine(
      {
        admin: {
          image: ['view'],
        },
        guest: {
          public: ['read'],
        },
      },
      {
        ressources: {
          image: {
            dataType: { id: 'string' },
            __strategy: 'or',
          },
          public: {
            dataType: { content: 'string' },
            __strategy: 'bypass',
          },
        },
        roles: { admin: 10, guest: 0 },
        user: {} as { name: string },
      },
      {
        'admin:image:view': ['id'],
        'guest:public:read': true,
      },
    );

    const { success } = createTests(machine.hasPermisions);

    describe(
      '#01 => Strategy Testing',
      success(
        {
          invite: 'OR strategy with array result should work',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'User', roles: ['guest'] },
            ressource: 'image',
            action: 'view',
            data: { id: '789' },
          },
          expected: true,
        },
        {
          invite:
            'Bypass strategy always works when implementation returns true',
          parameters: {
            performer: { __id: '999', name: 'Guest', roles: ['guest'] },
            owner: { __id: '999', name: 'Guest', roles: ['guest'] },
            ressource: 'public',
            action: 'read',
            data: { content: 'test' },
          },
          expected: true,
        },
        {
          invite: 'Missing data should not break permission check',
          parameters: {
            performer: { __id: '123', name: 'Admin', roles: ['admin'] },
            owner: { __id: '456', name: 'User', roles: ['guest'] },
            ressource: 'image',
            action: 'view',
            // No data provided
          },
          expected: true,
        },
        {
          invite: 'Invalid role should return false',
          parameters: {
            performer: {
              __id: '999',
              name: 'Invalid',
              roles: ['invalid'],
            },
            owner: { __id: '456', name: 'User', roles: ['guest'] },
            ressource: 'image',
            action: 'view',
            data: { id: '789' },
          },
          expected: false,
        },
      ),
    );
  });
});
