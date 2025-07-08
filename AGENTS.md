# Agent Guidelines for ScrapeSlayer

## Build/Test Commands
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run CLI in development mode with ts-node
- `npm start` - Run compiled CLI from dist/
- No test framework configured (tests show "Error: no test specified")

## Code Style & Conventions
- **Language**: TypeScript with strict mode enabled
- **Module System**: CommonJS (`"type": "commonjs"`)
- **Target**: ES2020 with DOM libs
- **Imports**: Use ES6 imports (`import { } from ''`)
- **Classes**: PascalCase (e.g., `ScrapeSlayer`, `BatchProcessor`)
- **Interfaces**: PascalCase with descriptive names (e.g., `CreatorData`, `ScrapingResult`)
- **Variables**: camelCase with descriptive names
- **Error Handling**: Use try/catch blocks, return structured error objects with `success: boolean`
- **Async/Await**: Prefer async/await over promises
- **Optional Properties**: Use `?:` for optional interface properties
- **Type Safety**: Export all types from `types.ts`, use proper typing throughout

## File Structure
- Source files in `src/` directory
- Compiled output in `dist/` directory
- Main entry point: `src/cli.ts` (CLI) and `dist/cli.js` (compiled)
- Types defined in `src/types.ts`