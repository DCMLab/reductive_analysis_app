[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.6395095.svg)](https://doi.org/10.5281/zenodo.6395095)

This branch contains the actively maintained version of the app. Rarely used features are removed or disabled, with focus shifted towards bug fixes, usability, and core annotation features.

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
