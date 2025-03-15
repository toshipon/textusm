# TextUSM Development Guide

## Build/Test/Lint Commands
- Build & run frontend: `cd frontend && npm run dev` or `just run`
- Build & run backend: `cd backend && just run` or `cd backend && go run cmd/api-server/main.go`
- Run elm tests: `cd frontend && npm run test` or `just test`
- Run all tests (including e2e): `just test` 
- Run single elm test: `cd frontend && npx elm-test tests/PathToTest.elm`
- Lint TypeScript: `cd frontend && npm run lint:ts` or `cd frontend && npm run lint-fix:ts`
- Lint Elm: `cd frontend && npm run lint:elm` or `cd frontend && npm run lint-fix:elm`
- Lint Go: `cd backend && just lint`

## Code Style Guidelines
- TypeScript: camelCase for variables/functions, PascalCase for types/interfaces
- Elm: camelCase for variables/functions, PascalCase for types/custom types
- Go: follow standard Go conventions with camelCase for unexported, PascalCase for exported
- Indentation: 2 spaces for TypeScript/Elm, tabs for Go
- Imports: Organized by types, no relative parent imports
- Error handling: Use Result types in Elm, proper error wrapping in Go
- No semicolons in TypeScript
- Prefer pure functions and immutable data structures
- Follow existing project patterns when adding new components/features