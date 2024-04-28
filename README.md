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

- `npm run build` -> Runs the typescript compiler against the typescript
  codebase. Displays any errors if they occur.
- `npm build-watch` -> Runs the typescript compiler every time you make
  changes to a file.
- `npm run clean` -> Removes build files by deleting the dist folder.
- `npm run dev` -> Running the code while developing. It watches changes 
  you make to your typescript codebase and automatically rebuilds the project. 
- `npm start` -> Runs the code.
- `npm run test` -> Runs test cases under 'test' folder.
- `npm run test-watch` -> Runs test cases every time you make
  changes to a test file.

### VSCode Debugging Code

- Build code
- Open code and set breakpoints in /src/index.ts.
- Start debugging with "Run and Debug" or F5.