import { createTests } from '@bemedev/vitest-extended';
import { createRolesWithPermissions, identity, types } from './functions';

type Comment = {
  id: string;
  body: string;
  authorId: string;
  createdAt: Date;
};

type Todo = {
  id: string;
  title: string;
  userId: string;
  completed: boolean;
  invitedUsers: string[];
};

describe('Permissions Functions', () => {
  const { hasPermissions } = createRolesWithPermissions(
    types.args(
      {
        comments: {
          dataType: identity<Omit<Comment, 'authorId'>>(),
          actions: ['view', 'create', 'update'],
        },
        todos: {
          dataType: identity<Omit<Todo, 'userId'>>(),
          actions: ['create', 'view', 'update', 'delete'],
        },
      },
      {
        blockeds: identity<string[]>(),
      },
      'admin',
      'moderator',
      'user',
    ),
  )({
    admin: {
      comments: {
        view: true,
        create: true,
        update: true,
      },
      todos: {
        view: true,
        create: true,
        update: true,
        delete: true,
      },
    },
    moderator: {
      comments: {
        view: true,
        create: true,
        update: true,
      },
      todos: {
        view: true,
        create: true,
        update: true,
        delete: ({ data }) => data.completed,
      },
    },
    user: {
      comments: {
        view: ({ performer, owner }) =>
          !performer.blockeds.includes(owner.__id) &&
          !owner.blockeds.includes(performer.__id),
        create: true,
        update: ({ performer, owner }) => performer.__id === owner.__id,
      },
      todos: {
        view: ({ performer, owner }) =>
          !performer.blockeds.includes(owner.__id) &&
          !owner.blockeds.includes(performer.__id),
        create: true,
        update: ({ performer, data, owner }) =>
          owner.__id === performer.__id ||
          data.invitedUsers.includes(performer.__id),
        delete: ({ performer, data, owner }) =>
          owner.__id === performer.__id ||
          (data.invitedUsers.includes(performer.__id) && data.completed),
      },
    },
  });

  const { acceptation, success } = createTests(hasPermissions);

  describe('#01 => Acceptation', acceptation);

  describe('#02 => Usage', () => {
    describe('#02.01 => User Role', () => {
      describe(
        '#02.01.01 => Comments',
        success(
          {
            invite: 'User can view comments when not blocked',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'view',
                data: { id: 'comment1' },
              },
            ],
          },
          {
            invite: 'User cannot view comments when blocked by owner',
            expected: false,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: ['user1'],
                },
                resource: 'comments',
                action: 'view',
                data: { id: 'comment1' },
              },
            ],
          },
          {
            invite:
              'User cannot view comments when they blocked the owner',
            expected: false,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: ['user2'],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'view',
                data: { id: 'comment1' },
              },
            ],
          },
          {
            invite: 'User can create comments',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'create',
              },
            ],
          },
          {
            invite: 'User can update their own comments',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'update',
                data: { id: 'comment1' },
              },
            ],
          },
          {
            invite: 'User cannot update others comments',
            expected: false,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'update',
                data: { id: 'comment1' },
              },
            ],
          },
        ),
      );

      describe(
        '#02.01.02 => Todos',
        success(
          {
            invite: 'User can view todos when not blocked',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'view',
                data: {
                  id: 'todo1',
                  completed: false,
                  invitedUsers: [],
                },
              },
            ],
          },
          {
            invite: 'User cannot view todos when blocked',
            expected: false,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: ['user2'],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'view',
                data: {
                  id: 'todo1',
                  completed: false,
                  invitedUsers: [],
                },
              },
            ],
          },
          {
            invite: 'User can create todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'create',
              },
            ],
          },
          {
            invite: 'User can update their own todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'update',
                data: {
                  id: 'todo1',
                  completed: false,
                  invitedUsers: [],
                },
              },
            ],
          },
          {
            invite: 'User can update todos when invited',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'update',
                data: {
                  id: 'todo1',
                  completed: false,
                  invitedUsers: ['user1'],
                },
              },
            ],
          },
          {
            invite: 'User cannot update todos when not invited',
            expected: false,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'update',
                data: {
                  id: 'todo1',
                  completed: false,
                  invitedUsers: [],
                },
              },
            ],
          },
          {
            invite: 'User can delete their own completed todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'delete',
                data: { id: 'todo1', completed: true, invitedUsers: [] },
              },
            ],
          },
          {
            invite: 'User can delete their own incomplete todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'delete',
                data: {
                  id: 'todo1',
                  completed: false,
                  invitedUsers: [],
                },
              },
            ],
          },
          {
            invite: 'User can delete completed todos when invited',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'delete',
                data: {
                  id: 'todo1',
                  completed: true,
                  invitedUsers: ['user1'],
                },
              },
            ],
          },
          {
            invite: 'User cannot delete incomplete todos when invited',
            expected: false,
            parameters: [
              {
                performer: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user2',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'delete',
                data: {
                  id: 'todo1',
                  completed: false,
                  invitedUsers: ['user1'],
                },
              },
            ],
          },
        ),
      );
    });

    describe('#02.02 => Moderator Role', () => {
      describe('#02.02.01 => Comments', () => {
        describe(
          'Can view all',
          success({
            invite: 'Moderator can view all comments',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'view',
                data: { id: 'comment1' },
              },
            ],
          }),
        );

        describe(
          'Can create',
          success({
            invite: 'Moderator can create comments',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                owner: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'create',
              },
            ],
          }),
        );

        describe(
          'Can update any',
          success({
            invite: 'Moderator can update comments',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'update',
                data: { id: 'comment1' },
              },
            ],
          }),
        );
      });

      describe('#02.02.02 => Todos', () => {
        describe(
          'Can view all',
          success({
            invite: 'Moderator can view all todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'view',
                data: { id: 'todo1', completed: false, invitedUsers: [] },
              },
            ],
          }),
        );

        describe(
          'Can create',
          success({
            invite: 'Moderator can create todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                owner: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'create',
              },
            ],
          }),
        );

        describe(
          'Can update any',
          success({
            invite: 'Moderator can update todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'update',
                data: { id: 'todo1', completed: false, invitedUsers: [] },
              },
            ],
          }),
        );

        describe(
          'Can delete completed only',
          success({
            invite: 'Moderator can delete completed todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'delete',
                data: { id: 'todo1', completed: true, invitedUsers: [] },
              },
            ],
          }),
        );

        describe(
          'Cannot delete incomplete',
          success({
            invite: 'Moderator cannot delete incomplete todos',
            expected: false,
            parameters: [
              {
                performer: {
                  __id: 'mod1',
                  roles: ['moderator'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'delete',
                data: { id: 'todo1', completed: false, invitedUsers: [] },
              },
            ],
          }),
        );
      });
    });

    describe('#02.03 => Admin Role', () => {
      describe('#02.03.01 => Comments', () => {
        describe(
          'Can view all',
          success({
            invite: 'Admin can view all comments',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'admin1',
                  roles: ['admin'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'view',
                data: { id: 'comment1' },
              },
            ],
          }),
        );

        describe(
          'Can create',
          success({
            invite: 'Admin can create comments',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'admin1',
                  roles: ['admin'],
                  blockeds: [],
                },
                owner: {
                  __id: 'admin1',
                  roles: ['admin'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'create',
              },
            ],
          }),
        );

        describe(
          'Can update any',
          success({
            invite: 'Admin can update any comments',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'admin1',
                  roles: ['admin'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'comments',
                action: 'update',
                data: { id: 'comment1' },
              },
            ],
          }),
        );
      });

      describe('#02.03.02 => Todos', () => {
        describe(
          'Can view all',
          success({
            invite: 'Admin can view all todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'admin1',
                  roles: ['admin'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'view',
                data: { id: 'todo1', completed: false, invitedUsers: [] },
              },
            ],
          }),
        );

        describe(
          'Can create',
          success({
            invite: 'Admin can create todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'admin1',
                  roles: ['admin'],
                  blockeds: [],
                },
                owner: {
                  __id: 'admin1',
                  roles: ['admin'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'create',
              },
            ],
          }),
        );

        describe(
          'Can update any',
          success({
            invite: 'Admin can update any todos',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'admin1',
                  roles: ['admin'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'update',
                data: { id: 'todo1', completed: false, invitedUsers: [] },
              },
            ],
          }),
        );

        describe(
          'Can delete any regardless of completion',
          success({
            invite: 'Admin can delete any todos regardless of completion',
            expected: true,
            parameters: [
              {
                performer: {
                  __id: 'admin1',
                  roles: ['admin'],
                  blockeds: [],
                },
                owner: {
                  __id: 'user1',
                  roles: ['user'],
                  blockeds: [],
                },
                resource: 'todos',
                action: 'delete',
                data: { id: 'todo1', completed: false, invitedUsers: [] },
              },
            ],
          }),
        );
      });
    });

    describe('#02.04 => Multi-Role Users', () => {
      describe(
        'Admin role override',
        success({
          invite: 'User with admin role gets full permissions',
          expected: true,
          parameters: [
            {
              performer: {
                __id: 'user1',
                roles: ['user', 'admin'],
                blockeds: [],
              },
              owner: {
                __id: 'user2',
                roles: ['user'],
                blockeds: [],
              },
              resource: 'todos',
              action: 'delete',
              data: { id: 'todo1', completed: false, invitedUsers: [] },
            },
          ],
        }),
      );

      describe(
        'Moderator role can delete completed only',
        success({
          invite: 'User with moderator role can delete completed todos',
          expected: true,
          parameters: [
            {
              performer: {
                __id: 'user1',
                roles: ['user', 'moderator'],
                blockeds: [],
              },
              owner: {
                __id: 'user2',
                roles: ['user'],
                blockeds: [],
              },
              resource: 'todos',
              action: 'delete',
              data: { id: 'todo1', completed: true, invitedUsers: [] },
            },
          ],
        }),
      );

      describe(
        'Moderator role cannot delete incomplete',
        success({
          invite:
            'User with moderator role cannot delete incomplete todos',
          expected: false,
          parameters: [
            {
              performer: {
                __id: 'user1',
                roles: ['user', 'moderator'],
                blockeds: [],
              },
              owner: {
                __id: 'user2',
                roles: ['user'],
                blockeds: [],
              },
              resource: 'todos',
              action: 'delete',
              data: { id: 'todo1', completed: false, invitedUsers: [] },
            },
          ],
        }),
      );
    });
  });
});

describe('types.permission', () => {
  it('returns correct dataType and first action', () => {
    const result = types.permission({ foo: 'bar' }, 'read', 'write');
    expect(result).toEqual({
      dataType: { foo: 'bar' },
      action: 'read',
    });
  });

  it('handles empty actions array', () => {
    const result = types.permission({ foo: 'bar' });
    expect(result).toEqual({
      dataType: { foo: 'bar' },
      action: undefined,
    });
  });

  it('works with primitive dataType', () => {
    const result = types.permission(42, 'edit');
    expect(result).toEqual({
      dataType: 42,
      action: 'edit',
    });
  });

  it('works with no dataType provided', () => {
    const result = types.permission(undefined, 'delete');
    expect(result).toEqual({
      dataType: undefined,
      action: 'delete',
    });
  });
});
