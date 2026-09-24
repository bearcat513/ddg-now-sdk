/**
 * Everything that has to happen before the Fluent build.
 *
 * The SDK accepts an array of prebuild functions and runs them in order, which
 * matters here, twice over: the stylesheet must be compiled before the client
 * bundle that imports it, the client bundle must exist in `dist/static/`
 * before the Fluent compiler resolves the UI page's HTML import, and the
 * Script Include require paths must match the package version the build is
 * about to stamp.
 */

import syncModulePaths from './sync-module-paths.mjs'
import buildCss from './build-css.mjs'
import buildClient from './build-client.mjs'

export default [syncModulePaths, buildCss, buildClient]
