import type { types } from '@bemedev/types';
import { createTests } from '@bemedev/vitest-extended';
import { expectTypeOf } from 'vitest';
import type { STRATEGIES } from './constants';
import type {
  CheckReturnType,
  ExtraPermissionsKey,
  ImplKeys,
  PermissionCheck,
  Priority,
  Ressource,
  RessourcePermission,
  RessourcePermission2,
  RessourcesFrom,
  Roles,
  RolesFrom,
  RolesWithPermissions,
  Strategy,
  User,
} from './types';

describe('Types Tests', () => {
  const { success } = createTests(() => true);

  describe('#01 => Basic Types', () => {
    describe(
      '#01.01 => Strategy',
      success(
        {
          invite: 'Strategy should be union of STRATEGIES',
          expected: true,
          parameters: [
            () => {
              expectTypeOf<Strategy>().toEqualTypeOf<
                (typeof STRATEGIES)[number]
              >();
              return true;
            },
          ],
        },
        {
          invite: 'Strategy should include bypass, and, or',
          expected: true,
          parameters: [
            () => {
              expectTypeOf<Strategy>().toEqualTypeOf<
                'bypass' | 'and' | 'or'
              >();
              return true;
            },
          ],
        },
      ),
    );

    describe(
      '#01.02 => Ressource',
      success(
        {
          invite: 'Ressource should have correct structure',
          expected: true,
          parameters: [
            () => {
              type TestRessource = Ressource<{
                id: string;
                title: string;
              }>;
              expectTypeOf<TestRessource>().toEqualTypeOf<{
                action: string;
                dataType: { id: string; title: string };
                __strategy?: Strategy;
              }>();
              return true;
            },
          ],
        },
        {
          invite: 'Ressource with any dataType should work',
          expected: true,
          parameters: [
            () => {
              type GenericRessource = Ressource;
              expectTypeOf<GenericRessource>().toEqualTypeOf<{
                action: string;
                dataType: any;
                __strategy?: Strategy;
              }>();
              return true;
            },
          ],
        },
      ),
    );

    describe(
      '#01.03 => Roles and Priority',
      success(
        {
          invite: 'Roles should be Record of string to number',
          expected: true,
          parameters: [
            () => {
              type TestRoles = Roles;
              expectTypeOf<TestRoles>().toEqualTypeOf<
                Record<string, Priority>
              >();
              return true;
            },
          ],
        },
        {
          invite: 'Priority should be number',
          expected: true,
          parameters: [
            () => {
              expectTypeOf<Priority>().toEqualTypeOf<number>();
              return true;
            },
          ],
        },
      ),
    );

    describe(
      '#01.04 => User',
      success(
        {
          invite: 'User should have correct structure with roles',
          expected: true,
          parameters: [
            () => {
              type TestRoles = { admin: 3; user: 1; moderator: 2 };
              type TestUser = User<TestRoles>;
              expectTypeOf<TestUser>().toEqualTypeOf<{
                __id: string;
                roles: ('admin' | 'user' | 'moderator')[];
              }>();
              return true;
            },
          ],
        },
        {
          invite: 'User with never roles should work',
          expected: true,
          parameters: [
            () => {
              type GenericUser = User<Record<string, never>>;
              expectTypeOf<GenericUser>().toEqualTypeOf<{
                __id: string;
                roles: string[];
              }>();
              return true;
            },
          ],
        },
      ),
    );
  });

  describe('#02 => Permission Types', () => {
    describe(
      '#02.01 => CheckReturnType',
      success(
        {
          invite: 'CheckReturnType should return boolean or keys array',
          expected: true,
          parameters: [
            () => {
              type TestData = {
                id: string;
                title: string;
                content: string;
              };
              type TestReturn = CheckReturnType<TestData>;

              expectTypeOf<TestReturn>().toEqualTypeOf<
                boolean | ('id' | 'title' | 'content')[]
              >();
              return true;
            },
          ],
        },
        {
          invite:
            'CheckReturnType with TrueObject should be boolean or string array',
          expected: true,
          parameters: [
            () => {
              type DefaultReturn = CheckReturnType;
              expectTypeOf<DefaultReturn>().toEqualTypeOf<
                boolean | string[]
              >();
              return true;
            },
          ],
        },
      ),
    );

    describe(
      '#02.02 => PermissionCheck',
      success({
        invite: 'PermissionCheck should accept value or function',
        expected: true,
        parameters: [
          () => {
            type TestRoles = { admin: 3; user: 1 };
            type TestUser = User<TestRoles>;
            type TestData = { id: string; title: string };
            type TestPermissionCheck = PermissionCheck<TestUser, TestData>;

            expectTypeOf<TestPermissionCheck>().toEqualTypeOf<
              | boolean
              | ('id' | 'title')[]
              | ((args: {
                  performer: TestUser;
                  data?: types.DeepPartial<TestData>;
                  owner: TestUser;
                }) => boolean | ('id' | 'title')[])
            >();
            return true;
          },
        ],
      }),
    );

    describe(
      '#02.03 => ExtraPermissionsKey',
      success({
        invite:
          'ExtraPermissionsKey should include user and role patterns',
        expected: true,
        parameters: [
          () => {
            type TestKey = ExtraPermissionsKey<
              'admin' | 'user' | 'moderator'
            >;
            expectTypeOf<TestKey>().toEqualTypeOf<
              | `user:${string}`
              | 'role:admin'
              | 'role:user'
              | 'role:moderator'
            >();
            return true;
          },
        ],
      }),
    );
  });

  describe('#03 => Complex Types', () => {
    describe(
      '#03.01 => RolesWithPermissions',
      success({
        invite:
          'RolesWithPermissions should have correct nested structure',
        expected: true,
        parameters: [
          () => {
            type TestRoles = { admin: 3; user: 1 };
            type TestUser = User<TestRoles>;
            type TestRessources = {
              comments: Ressource<{ id: string; body: string }> & {
                action: 'view' | 'create';
              };
              todos: Ressource<{ id: string; title: string }> & {
                action: 'read' | 'write';
              };
            };

            type TestRolesWithPermissions = RolesWithPermissions<
              TestRoles,
              TestUser,
              TestRessources
            >;

            expectTypeOf<TestRolesWithPermissions>().toEqualTypeOf<{
              admin: Partial<{
                comments: Partial<{
                  view: PermissionCheck<
                    TestUser,
                    { id: string; body: string }
                  >;
                  create: PermissionCheck<
                    TestUser,
                    { id: string; body: string }
                  >;
                }>;
                todos: Partial<{
                  read: PermissionCheck<
                    TestUser,
                    { id: string; title: string }
                  >;
                  write: PermissionCheck<
                    TestUser,
                    { id: string; title: string }
                  >;
                }>;
              }>;
              user: Partial<{
                comments: Partial<{
                  view: PermissionCheck<
                    TestUser,
                    { id: string; body: string }
                  >;
                  create: PermissionCheck<
                    TestUser,
                    { id: string; body: string }
                  >;
                }>;
                todos: Partial<{
                  read: PermissionCheck<
                    TestUser,
                    { id: string; title: string }
                  >;
                  write: PermissionCheck<
                    TestUser,
                    { id: string; title: string }
                  >;
                }>;
              }>;
            }>();
            return true;
          },
        ],
      }),
    );

    describe(
      '#03.02 => RessourcePermission',
      success({
        invite:
          'RessourcePermission should handle action-based permissions',
        expected: true,
        parameters: [
          () => {
            type TestRessource = Ressource<{
              id: string;
              title: string;
            }> & {
              action: 'view' | 'edit';
            };

            type TestPermission = RessourcePermission<
              TestRessource,
              'admin' | 'user'
            >;

            expectTypeOf<TestPermission>().toEqualTypeOf<
              Partial<
                Record<
                  'view' | 'edit',
                  Partial<
                    Record<
                      'allow' | 'disallow',
                      Partial<
                        Record<
                          'id' | 'title' | '**',
                          ExtraPermissionsKey<'admin' | 'user'>[]
                        >
                      >
                    >
                  >
                >
              >
            >();
            return true;
          },
        ],
      }),
    );

    describe(
      '#03.03 => RessourcePermission2',
      success({
        invite:
          'RessourcePermission2 should be true or user-keyed permissions',
        expected: true,
        parameters: [
          () => {
            type TestRessource = Ressource<{ id: string }> & {
              action: 'view';
            };

            type TestPermission2 = RessourcePermission2<
              TestRessource,
              'admin' | 'user'
            >;

            // Test that it can be true
            expectTypeOf<true>().toExtend<TestPermission2>();

            // Test that it can be the complex type
            expectTypeOf<
              Partial<
                Record<
                  ExtraPermissionsKey<'admin' | 'user'>,
                  Record<'view', boolean | ['id']>
                >
              >
            >().toExtend<TestPermission2>();

            return true;
          },
        ],
      }),
    );
  });

  describe('#04 => Config-based Types', () => {
    describe(
      '#04.01 => Config and RolesFrom',
      success({
        invite: 'RolesFrom should extract roles from config',
        expected: true,
        parameters: [
          () => {
            type TestConfig = {
              permissions: {
                admin: 'high';
                user: 'low';
                moderator: ['medium', 'special'];
              };
              features: {
                premium: 'enabled';
              };
            };

            type ExtractedRoles = RolesFrom<TestConfig>;
            expectTypeOf<ExtractedRoles>().toEqualTypeOf<
              Record<'permissions' | 'features', number>
            >();
            return true;
          },
        ],
      }),
    );

    describe(
      '#04.02 => RessourcesFrom',
      success({
        invite: 'RessourcesFrom should extract resources from config',
        expected: true,
        parameters: [
          () => {
            type TestConfig = {
              permissions: {
                admin: 'high';
                user: 'low';
              };
              features: {
                premium: 'enabled';
              };
            };

            type ExtractedRessources = RessourcesFrom<TestConfig>;
            expectTypeOf<ExtractedRessources['admin']>().toEqualTypeOf<{
              dataType: any;
              __strategy?: Strategy;
            }>();
            expectTypeOf<ExtractedRessources['user']>().toEqualTypeOf<{
              dataType: any;
              __strategy?: Strategy;
            }>();
            return true;
          },
        ],
      }),
    );

    describe(
      '#04.03 => ImplKeys',
      success({
        invite: 'ImplKeys should generate correct implementation keys',
        expected: true,
        parameters: [
          () => {
            type TestConfig = {
              roles: {
                admin: 'manage';
                user: 'read';
              };
              resources: {
                posts: 'create';
              };
            };

            type TestImplKeys = ImplKeys<TestConfig>;
            // Test that the type exists and has string properties
            expectTypeOf<TestImplKeys>().toBeString();
            return true;
          },
        ],
      }),
    );
  });

  describe('#05 => Edge Cases and Advanced Types', () => {
    describe(
      '#05.01 => Empty Types',
      success(
        {
          invite: 'Empty roles should work',
          expected: true,
          parameters: [
            () => {
              type EmptyRoles = Record<string, never>;
              type EmptyUser = User<EmptyRoles>;
              expectTypeOf<EmptyUser>().toEqualTypeOf<{
                __id: string;
                roles: string[];
              }>();
              return true;
            },
          ],
        },
        {
          invite: 'Empty ressources should work',
          expected: true,
          parameters: [
            () => {
              type EmptyRessources = Record<string, never>;
              expectTypeOf<EmptyRessources>().toBeObject();
              return true;
            },
          ],
        },
      ),
    );

    describe(
      '#05.02 => Complex Nested Types',
      success({
        invite: 'Complex nested permissions should work',
        expected: true,
        parameters: [
          () => {
            type ComplexRoles = {
              superAdmin: 10;
              admin: 5;
              moderator: 3;
              user: 1;
              guest: 0;
            };

            type ComplexRessources = {
              posts: Ressource<{
                id: string;
                title: string;
                content: string;
                authorId: string;
                tags: string[];
              }> & {
                action:
                  | 'create'
                  | 'read'
                  | 'update'
                  | 'delete'
                  | 'publish';
              };
              comments: Ressource<{
                id: string;
                postId: string;
                body: string;
                authorId: string;
              }> & {
                action:
                  | 'create'
                  | 'read'
                  | 'update'
                  | 'delete'
                  | 'moderate';
              };
            };

            type ComplexUser = User<ComplexRoles>;
            type ComplexPermissions = RolesWithPermissions<
              ComplexRoles,
              ComplexUser,
              ComplexRessources
            >;

            expectTypeOf<ComplexPermissions>().toEqualTypeOf<{
              [K in keyof ComplexRoles]: Partial<{
                [R in keyof ComplexRessources]: Partial<{
                  [A in ComplexRessources[R]['action']]: PermissionCheck<
                    ComplexUser,
                    ComplexRessources[R]['dataType']
                  >;
                }>;
              }>;
            }>();
            return true;
          },
        ],
      }),
    );
  });
});
