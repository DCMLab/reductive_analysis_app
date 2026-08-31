# Graphic Music Annotation App

This branch contains the frontend of the client-server version of the app. It only works in conjunction with the Reductive Analysis App Server, which is a separate repo.

This version also features substantial visualization and usability improvements, including support for the cycle detection API of the server.

## Building the app

The app resides in `/src`. Assets need to be compiled using frontend tooling, as detailed below.

### Development

1. Duplicate `.env.example` to `.env` and edit it.
2. Run `npm install` (Node > 12.13) to install all required packages and tools.
3. Run `npm run dev` and open the URL returned by the CLI.
4. **After a code merge in the main branch**, update the modified build (`npm run build`) and push it, too.

### Production

1. Duplicate `.env.example` to `.env` and edit it.
2. Run `npm install` (Node > 12.13) to install all required packages and tools.
3. Run `npm run build` to compile the app. The compiled app goes in `/public`.

### Various

- Files in `/src/public` are copied as is (respecting the directory structure in `/src/public`) in the build directory.
- Lint JavaScript: `npm run lint`.
- Run tests with `npm run test`.
