# Contributing to @bemedev/permissions

Thank you for your interest in contributing to @bemedev/permissions! This
guide will help you get started with contributing to this TypeScript
permissions management library.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)

## 🤝 Code of Conduct

This project adheres to a code of conduct that we expect all contributors
to follow. Please be respectful and constructive in all interactions.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/permissions.git
   cd permissions
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/chlbri/permissions.git
   ```

## 🛠️ Development Setup

### Prerequisites

- **Node.js** >= 20
- **pnpm** (recommended package manager)

### Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm test

# Run linting
pnpm run lint
```

### Available Scripts

```bash
pnpm run build          # Build the library
pnpm run test           # Run all tests
pnpm run test:watch     # Run tests in watch mode
pnpm run lint           # Run ESLint
pnpm run lint:fix       # Fix ESLint issues automatically
pnpm run prettier      # Format code with Prettier
pnpm run ci             # Run full CI pipeline (lint + test + prettier)
```

## 📁 Project Structure

```
src/
├── machine.ts          # Core Machine class and createMachine factory
├── machine.types.ts    # Type definitions for Machine
├── types.ts           # Core type definitions
├── typings.ts         # Type transformation utilities
├── helpers.ts         # Utility functions
├── constants.ts       # Project constants
├── index.ts          # Main export file
└── __tests__/        # Test files
    ├── machine.test.ts
    ├── helpers.test.ts
    └── types.test-d.ts
```

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable TypeScript code
- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run tests
pnpm test

# Run linting
pnpm run lint

# Build to ensure no compilation errors
pnpm run build
```

### 4. Commit Your Changes

Follow our [commit guidelines](#commit-guidelines) for consistent commit
messages.

## 🧪 Testing

### Test Structure

We use **Vitest** for testing with the **@bemedev/vitest-extended**
framework

### Writing Tests

#### For Functions/Utilities (helpers.test.ts pattern)

```typescript
import { createTests } from '@bemedev/vitest-extended';
import { yourFunction } from './your-module';

describe('Your Function Tests', () => {
  const { success } = createTests(yourFunction);

  describe('#01 => Basic Cases', () => {
    test('should handle basic input', () => {
      const result = yourFunction(input);
      expect(result).toBe(expected);
    });
  });

  describe(
    '#02 => Success Pattern Tests',
    success(
      {
        invite: 'should work with valid input',
        parameters: [validInput],
        expected: expectedResult,
      },
      // Add more test cases...
    ),
  );
});
```

#### For Type Validation (types.test-d.ts pattern)

```typescript
import { expectTypeOf } from 'vitest';
import type { YourType } from './types';

describe('Type Tests', () => {
  test('YourType should accept correct structure', () => {
    expectTypeOf<YourType>().toEqualTypeOf<ExpectedType>();
  });
});
```

#### For Machine/Integration Tests

```typescript
import { createTests } from '@bemedev/vitest-extended';
import { createMachine, typings } from './machine';

describe('Machine Integration Tests', () => {
  const machine = createMachine(/* config */, /* implementation */);
  const { success } = createTests(machine.hasPermisions);

  describe(
    'Permission Scenarios',
    success(
      {
        invite: 'Admin should view images',
        parameters: {
          performer: admin,
          owner: user,
          ressource: 'image',
          action: 'view',
          data: { id: 'test' },
        },
        expected: true,
      },
    ),
  );
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test machine.test.ts

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## 🎨 Code Style

### TypeScript Guidelines

- Use **strict TypeScript** configuration
- Prefer **type safety** over convenience
- Use **const assertions** for immutable data
- Leverage **generic types** for reusable components

### Code Formatting

We use **Prettier** and **ESLint**:

```bash
# Format code
pnpm run prettier

# Fix linting issues
pnpm run lint:fix
```

### Naming Conventions

- **Classes**: PascalCase (`Machine`, `PermissionManager`)
- **Functions**: camelCase (`createMachine`, `hasPermisions`)
- **Types**: PascalCase (`Config`, `UserFrom`)
- **Constants**: UPPER_SNAKE_CASE (`DELIMITER`, `STRATEGIES`)
- **Files**: kebab-case (`machine.types.ts`, `helpers.test.ts`)

## 📝 Commit Guidelines

We follow a structured commit message format for better changelog
generation:

### Commit Types

- `feat`: New feature (minor version)
- `fix`: Bug fix (patch version)
- `hot-fix`: Critical bug fix (patch version)
- `docs`: Documentation changes (patch version)
- `build`: Build system changes (no version)
- `style`: Code style changes (no version)
- `test`: Test additions/changes (patch version)
- `revert`: Revert previous commit (patch version)

### Commit Message Format

```
type(scope): Title in English

Body in French (optional, max 200 words)

[BREAKING CHANGE] (if applicable)
chlbri: bri_lvi@icloud.com
```

### Examples

```bash
feat(machine): Add support for dynamic role priorities

Ajout de la possibilité de modifier dynamiquement les priorités des rôles
pendant l'exécution. Cette fonctionnalité permet une gestion plus flexible
des permissions en temps réel.

chlbri: bri_lvi@icloud.com
```

```bash
fix(types): Correct RessourcePermission type parameter

Correction du type générique pour accepter les chaînes de caractères
comme second paramètre dans RessourcePermission et RessourcePermission2.

chlbri: bri_lvi@icloud.com
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch** with the latest upstream changes:

   ```bash
   git fetch upstream
   git rebase upstream/dev
   ```

2. **Run the full CI pipeline**:

   ```bash
   pnpm run ci
   ```

3. **Ensure all tests pass**:
   ```bash
   pnpm test
   ```

### PR Guidelines

1. **Title**: Use a clear, descriptive title
2. **Description**: Explain what changes were made and why
3. **Tests**: Include tests for new functionality
4. **Documentation**: Update docs if needed
5. **Breaking Changes**: Clearly mark any breaking changes

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- Bug fix (non-breaking change which fixes an issue)
- New feature (non-breaking change which adds functionality)
- Breaking change (fix or feature that would cause existing functionality
  to not work as expected)
- Documentation update

## Testing

- All existing tests pass
- New tests added for new functionality
- Manual testing completed

## Checklist

- Code follows the style guidelines
- Self-review completed
- Documentation updated if needed
- No breaking changes (or properly documented)
```

## 🐛 Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Environment**: Node.js version, package version
- **Steps to reproduce**: Clear steps to reproduce the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Code sample**: Minimal reproduction case
- **Error messages**: Full error messages and stack traces

### Feature Requests

For feature requests, please include:

- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives**: What alternatives have you considered?
- **Additional context**: Any other relevant information

## 📚 Documentation

### Code Documentation

- Use **JSDoc** for public APIs
- Include **examples** in documentation
- Document **complex algorithms** and **type transformations**

### README Updates

When adding new features:

1. Update the main **README.md**
2. Add **examples** showing usage
3. Update the **API Reference** section
4. Add entries to **Advanced Examples** if applicable

### Type Documentation

For complex types, add explanatory comments:

```typescript
/**
 * Represents a permission check function that can be either:
 * - A boolean value for simple allow/deny
 * - A function that evaluates permissions dynamically
 * - An array of allowed field names for partial permissions
 */
export type PermissionCheck<U extends User, PD extends types.TrueObject> =
  | CheckReturnType<PD>
  | ((args: {
      performer: U;
      data?: types.DeepPartial<PD>;
      owner: U;
    }) => CheckReturnType<PD>);
```

## 🙋‍♂️ Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Code Review**: Feel free to ask for feedback on your PRs

## 🎯 Areas for Contribution

We especially welcome contributions in these areas:

- **Performance optimizations**
- **Additional strategies** for permission evaluation
- **Better error messages** and debugging tools
- **Documentation improvements**
- **Example applications** and use cases
- **TypeScript type improvements**

## 👨‍💻 Maintainer

**chlbri** (bri_lvi@icloud.com)

Thank you for contributing to @bemedev/permissions! 🚀
