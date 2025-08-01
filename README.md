# @bemedev/permissions

A modern TypeScript library for permissions management based on the ABAC
(Attribute-Based Access Control) model.

## 🚀 Installation

```bash
npm install @bemedev/permissions
# or
pnpm add @bemedev/permissions
# or
yarn add @bemedev/permissions
```

## 📋 Peer Dependencies

This library requires the following dependencies:

```bash
npm install @bemedev/decompose @bemedev/types
```

## 🎯 Features

- ✨ **Permissions machine** with complete ABAC system
- 🔧 **Flexible strategies**: `bypass`, `and`, `or`
- 📝 **Complete TypeScript types** for type safety
- 🎯 **Factory pattern** to create instances easily
- 🔒 **Role system** with priorities
- 📊 **Resource management** with actions and data types
- 🛡️ **Validation** of user and data permissions

## 🏁 Quick Start

### Basic Configuration

```typescript
import { createMachine, typings } from '@bemedev/permissions';

// Define the configuration
const config = typings({
  ressources: {
    image: {
      actions: ['view', 'edit', 'delete'],
      dataType: { id: 'string', url: 'string' },
      __strategy: 'bypass',
    },
    document: {
      actions: ['read', 'write', 'delete'],
      dataType: { id: 'string', content: 'string' },
      __strategy: 'and',
    },
  },
  user: { name: 'string', department: 'string' },
  roles: { admin: 10, editor: 5, viewer: 1 },
});

// Define permission implementations
const implementation = {
  'admin:image:view': true,
  'admin:image:edit': true,
  'admin:image:delete': true,
  'admin:document:read': true,
  'admin:document:write': true,
  'admin:document:delete': true,
  'editor:image:view': true,
  'editor:image:edit': true,
  'editor:document:read': true,
  'editor:document:write': ({ performer, owner }) =>
    performer.__id === owner.__id,
  'viewer:image:view': true,
  'viewer:document:read': true,
};

// Create the permissions machine
const machine = createMachine(config, implementation);
```

### Permission Checking

```typescript
// Define users
const admin = {
  __id: 'admin1',
  name: 'Alice Admin',
  department: 'IT',
  roles: ['admin'],
};

const editor = {
  __id: 'editor1',
  name: 'Bob Editor',
  department: 'Marketing',
  roles: ['editor'],
};

// Check permissions
const canAdminViewImage = machine.hasPermisions({
  performer: admin,
  owner: editor,
  ressource: 'image',
  action: 'view',
  data: { id: 'img123', url: 'https://example.com/image.jpg' },
});

console.log(canAdminViewImage); // true

const canEditorDeleteDocument = machine.hasPermisions({
  performer: editor,
  owner: admin,
  ressource: 'document',
  action: 'delete',
  data: { id: 'doc123', content: 'Document content' },
});

console.log(canEditorDeleteDocument); // false
```

## 📚 Key Concepts

### Strategies

The library supports three validation strategies:

#### `bypass`

Ignores data permissions and relies only on user permissions.

```typescript
{
  resource: {
    __strategy: 'bypass',
    // ...
  }
}
```

#### `and`

Combines user permissions AND data permissions.

```typescript
{
  resource: {
    __strategy: 'and',
    // ...
  }
}
```

#### `or`

Accepts if EITHER user permissions OR data permissions are validated.

```typescript
{
  resource: {
    __strategy: 'or',
    // ...
  }
}
```

### Roles and Priorities

Roles have numeric priorities. The higher the number, the higher the
priority:

```typescript
const roles = {
  admin: 10, // Maximum priority
  editor: 5, // Medium priority
  viewer: 1, // Minimum priority
};
```

### Dynamic Permissions

Permissions can be static values or dynamic functions:

```typescript
const implementation = {
  // Static permission
  'admin:document:view': true,

  // Dynamic permission
  'editor:document:edit': ({ performer, owner, data }) => {
    // Editor can only modify their own documents
    return performer.__id === owner.__id;
  },

  // Permission with field validation
  'editor:document:partial': ({ data }) => {
    // Returns allowed fields
    return ['title', 'content'];
  },
};
```

## 🔧 API Reference

### `createMachine(config, implementation)`

Creates a new permissions machine instance.

**Parameters:**

- `config`: Typed configuration with resources, user and roles
- `implementation`: Object containing permission implementations

**Returns:** `Machine` instance

### `machine.hasPermisions(args)`

Checks if a permission is granted.

**Parameters:**

- `performer`: User performing the action
- `owner`: Resource owner
- `ressource`: Resource name
- `action`: Action to perform
- `data`: Resource data (optional)

**Returns:** `boolean` or `string[]` (list of allowed fields)

### `machine.sortRoles(order, ...roles)`

Sorts roles by priority.

**Parameters:**

- `order`: `'asc'` or `'desc'`
- `roles`: List of roles to sort

**Returns:** `string[]`

### `machine.getPriority(role)`

Gets the priority of a role.

**Parameters:**

- `role`: Role name

**Returns:** `number`

## 📖 Advanced Examples

### Permissions with Extra Data

```typescript
const result = machine.hasPermisions({
  performer: user,
  owner: owner,
  ressource: 'document',
  action: 'edit',
  data: {
    id: 'doc123',
    content: 'Document content',
    __extraPermissions: {
      edit: {
        allow: {
          id: ['user:editor1'],
          content: ['role:editor'],
        },
      },
    },
  },
});
```

### Managing Users with Multiple Roles

```typescript
const superUser = {
  __id: 'super1',
  name: 'Super User',
  roles: ['viewer', 'editor', 'admin'], // Multiple roles
};

// The machine will automatically use the role with the highest priority
```

### Testing with vitest-extended

```typescript
import { createTests } from '@bemedev/vitest-extended';

const { success } = createTests(machine.hasPermisions);

describe(
  'Permission Tests',
  success({
    invite: 'Admin can view images',
    parameters: {
      performer: admin,
      owner: user,
      ressource: 'image',
      action: 'view',
      data: { id: 'img123' },
    },
    expected: true,
  }),
);
```

## 🤝 Contributing

Contributions are welcome! Please see the
[contribution guide](CONTRIBUTING.md) for more details.

## 📄 License

MIT

## 📞 Support

For any questions or issues, feel free to open an issue on
[GitHub](https://github.com/chlbri/permissions/issues).

## 👨‍💻 Author

**chlbri** (bri_lvi@icloud.com)

[My GitHub](https://github.com/chlbri?tab=repositories)

[<svg width="98" height="96" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#24292f"/></svg>](https://github.com/chlbri?tab=repositories)

## 🔗 Links

- [Complete Documentation](https://github.com/chlbri/permissions)

- [Issues and Support](https://github.com/chlbri/permissions/issues)
