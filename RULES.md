# Project Development Rules

## Package Manager

**IMPORTANT: Always use pnpm for dependency management. Never use npm or yarn.**

### Required Commands
- Install dependencies: `pnpm install`
- Add dependency: `pnpm add <package>`
- Add dev dependency: `pnpm add -D <package>`
- Remove dependency: `pnpm remove <package>`

### Prohibited Commands
- ❌ `npm install`
- ❌ `npm add`
- ❌ `yarn add`
- ❌ Any other package manager commands

### Rationale
- Maintains consistency with pnpm-lock.yaml
- Leverages pnpm's disk space optimization and faster installation
- Ensures development environment consistency across the team
