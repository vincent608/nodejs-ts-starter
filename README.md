# Node.js Typescript Jest Starter

Simple NodeJs Typescript starter with Jest, nodeman, ts-node, VSCode debug support.

## Quickstart

- Clone the repo `git clone https://github.com/vincent608/nodejs-ts-starter.git`
- Install dependencies `npm install`
- Build code `npm run build`
- Run code `npm start`
- Run test `npm test`

## Scripts and their explanation

All scripts can be found inside the package.json file under the "scripts"
attribute.

- `npm run build` -> Runs the typescript compiler against the typescript codebase. Displays any errors if they occur.
- `npm build-watch` -> Runs the typescript compiler every time you make changes to a file.
- `npm run clean` -> Removes build files by deleting the dist folder.
- `npm run dev` -> Running the code while developing. It watches changes you make to your typescript codebase and automatically rebuilds the project. 
- `npm start` -> Runs the code.
- `npm run test` -> Runs test cases under 'test' folder.
- `npm run test-watch` -> Runs test cases every time you make changes to a test file.

### Dependences update

Use `npm-check-updates`:

```bash
npm install -g npm-check-updates

ncu            # shows which deps can be upgraded
ncu -u         # updates package.json with latest versions
npm install    # actually install them
```

### tsconfig.json

- `target` controls what JavaScript features TypeScript outputs (class fields, async/await, etc.).
  Choose based on the Node.js version you’re running:
  - Node 18+ → use "ES2022" (or "ESNext" if you want the latest).
  - Node 16 → use "ES2021".
- `module` controls how imports/exports are emitted
  - CommonJS ("module": "CommonJS")
    - Default for Node.js (require/exports).
    - Works with most npm libraries.
    - Good if your project uses require(...).
  - ESNext / NodeNext ("module": "NodeNext")
    - Lets you use import/export syntax (ESM).
    - Needed if your `"type": "module"` is set in `package.json`.
    - "NodeNext" is better than "ESNext" since it respects Node’s rules for .js, .cjs, and .mjs.
- `"esModuleInterop": true` makes CommonJS modules behave like ES modules, so you can use default-style imports (import express from "express") instead of namespace imports.

### VSCode Debugging Code

- Build code
- Open code and set breakpoints in /src/index.ts.
- Start debugging with "Run and Debug" or F5.