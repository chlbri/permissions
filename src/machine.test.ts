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
            __strategy: 'bypass',
          },
          document: {
            actions: ['view', 'delete', 'edit'],
            dataType: { id: 'string' },
            __strategy: 'bypass',
          },
        },
        user: { name: 'string', age: 'number' },
        roles: { admin: 5, user: 1 },
      }),

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
});
