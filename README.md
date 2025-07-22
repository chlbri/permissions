- [@bemedev/permissions](#bemedevpermissions)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Basic Setup](#basic-setup)
    - [Permission Checking](#permission-checking)
    - [Advanced Examples](#advanced-examples)
      - [Multi-role Users](#multi-role-users)
      - [Function-based Permissions](#function-based-permissions)
  - [API Reference](#api-reference)
    - [`createRolesWithPermissions(config)(roles)`](#createroleswithpermissions-config-roles)
    - [`hasPermissions(args)`](#haspermissions-args)
    - [Type Helpers](#type-helpers)
  - [Contributing](#contributing)
  - [License](#license)
  - [Author](#author)
  - [Links](#links)

  
# @bemedev/permissions

A powerful TypeScript library for managing Attribute-Based Access Control
(ABAC) permissions with type safety and flexible role-based access control.

## Features

- 🔒 **Type-safe permissions** - Full TypeScript support with compile-time
  type checking
- 🎯 **Attribute-Based Access Control (ABAC)** - Context-aware permission
  checks based on user attributes, resource properties, and actions
- 🔧 **Flexible role system** - Support for multiple roles per user with
  hierarchical permissions
- 🚀 **Function-based permissions** - Dynamic permission evaluation using
  custom functions
- 📦 **Zero dependencies** - Lightweight and standalone
- 🧪 **Well tested** - Comprehensive test suite with 100% coverage

## Installation

```bash
npm install @bemedev/permissions
# or
yarn add @bemedev/permissions
# or
pnpm add @bemedev/permissions
```

## Usage

### Basic Setup

```typescript
import {
  createRolesWithPermissions,
  types,
  identity,
} from '@bemedev/permissions';

// Define your data types
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

// Define roles and permissions
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
      blockeds: identity<string[]>(), // Additional user properties
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
      delete: ({ data }) => data.completed, // Function-based permission
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
```

### Permission Checking

```typescript
// Define users
const user: User = {
  __id: 'user1',
  roles: ['user'],
  blockeds: [],
};

const admin: User = {
  __id: 'admin1',
  roles: ['admin'],
  blockeds: [],
};

// Check permissions
const canUserViewComment = hasPermissions({
  performer: user,
  owner: { __id: 'user2', roles: ['user'], blockeds: [] },
  resource: 'comments',
  action: 'view',
  data: { id: 'comment1' },
});

const canAdminDeleteTodo = hasPermissions({
  performer: admin,
  owner: user,
  resource: 'todos',
  action: 'delete',
  data: { id: 'todo1', completed: false, invitedUsers: [] },
});

console.log(canUserViewComment); // true/false based on blocking rules
console.log(canAdminDeleteTodo); // true (admin can delete any todo)
```

### Advanced Examples

#### Multi-role Users

```typescript
const moderatorUser = {
  __id: 'mod-user1',
  roles: ['user', 'moderator'],
  blockeds: [],
};

// Will check both user and moderator permissions
// and return true if any role allows the action
const canDelete = hasPermissions({
  performer: moderatorUser,
  owner: user,
  resource: 'todos',
  action: 'delete',
  data: { id: 'todo1', completed: true, invitedUsers: [] },
});
```

#### Function-based Permissions

```typescript
// Permissions can use custom logic
const permissions = {
  user: {
    posts: {
      edit: ({ performer, data, owner }) => {
        // Custom business logic
        const isOwner = performer.__id === owner.__id;
        const isWithinEditWindow = Date.now() - data.createdAt < 86400000; // 24h
        return isOwner && isWithinEditWindow;
      },
    },
  },
};
```

## API Reference

### `createRolesWithPermissions(config)(roles)`

Creates a permission system with the specified configuration.

**Parameters:**

- `config`: Configuration object containing permissions, user properties,
  and roles
- `roles`: Object defining permissions for each role

**Returns:**

- `hasPermissions`: Function to check permissions
- `ROLES`: The roles configuration object

### `hasPermissions(args)`

Checks if a user has permission to perform an action.

**Parameters:**

- `performer`: The user performing the action
- `owner`: The owner of the resource
- `resource`: The resource being accessed
- `action`: The action being performed
- `data?`: Optional data associated with the resource

**Returns:** `boolean` or a partial of the authorized data depending on the
permission configuration

### Type Helpers

- `types.args()`: Helper for creating type-safe permission configurations
- `identity<T>()`: Type helper for maintaining type information
- `User<R>`: User type with roles
- `PermissionsTypes`: Type for permission definitions
- `RolesWithPermissions<R, U, P>`: Type for role-permission mappings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

**chlbri** (bri_lvi@icloud.com)

[<img src="https://github.com/chlbri.png" width="50" height="50" style="border-radius: 50%;">](https://github.com/chlbri?tab=repositories)
[GitHub Profile](https://github.com/chlbri?tab=repositories)

## Links

- [NPM Package](https://www.npmjs.com/package/@bemedev/permissions)
- [GitHub Repository](https://github.com/chlbri/permissions)
- [Documentation](https://github.com/chlbri/permissions#readme)
- [Issues](https://github.com/chlbri/permissions/issues)

---

Made with ❤️ by [bemedev](https://bemedev.vercel.app)
