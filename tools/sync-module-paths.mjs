/**
 * Keeps the Script Include wrappers' `require()` paths in step with the build.
 *
 * Wired as `scripts.prebuild` in `now.config.json`, so it runs before every
 * `now-sdk build` and there is no state where the wrappers are stale.
 *
 * ## Why this exists
 *
 * The SDK docs describe the bridge pattern as `require('./dist/modules/<path>.js')`.
 * That is not what this SDK version emits. Every `require()` the build
 * generates for itself — in business rules, UI actions, REST operations,
 * scheduled jobs — takes the form:
 *
 *     require('<scope>/<package>/<version>/src/server/<path>.ts')
 *
 * Source path, `.ts` extension, and **the package version baked in**. A
 * hand-written wrapper is the one place the build does not generate that
 * string, so it is the one place that silently breaks on the next version
 * bump: the Script Include still installs, still registers, and fails only
 * when someone calls it. That is exactly the failure mode the SDK docs warn
 * about for hook bodies, arriving by a different route.
 *
 * So the version is not written by hand. This rewrites it from `package.json`
 * every build, and reports what it changed.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const WRAPPER_DIR = 'src/script-includes'

/** `require('<scope>/<pkg>/<version>/src/server/…')`, version captured. */
const REQUIRE_PATTERN = /require\('([a-z0-9_]+)\/([^/']+)\/([^/']+)\/(src\/server\/[^']+)'\)/g

export default async function syncModulePaths({ rootDir, config, fs, path, logger }) {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
    const expected = { scope: config.scope, name: pkg.name, version: pkg.version }

    const dir = path.join(rootDir, WRAPPER_DIR)
    let files = []
    try {
        files = fs.readdirSync(dir).filter((file) => file.endsWith('.js'))
    } catch {
        logger.warn(`No ${WRAPPER_DIR} directory; nothing to sync.`)
        return
    }

    for (const file of files) {
        const full = path.join(dir, file)
        const before = fs.readFileSync(full, 'utf8')
        let changed = 0

        const after = before.replace(REQUIRE_PATTERN, (whole, scope, name, version, tail) => {
            if (scope === expected.scope && name === expected.name && version === expected.version) return whole
            changed++
            return `require('${expected.scope}/${expected.name}/${expected.version}/${tail}')`
        })

        if (changed) {
            fs.writeFileSync(full, after)
            logger.info(`${WRAPPER_DIR}/${file}: rewrote ${changed} require path(s) to ${expected.version}`)
        }
    }
}

/* Also runnable directly: `node tools/sync-module-paths.mjs` */
if (import.meta.url === `file://${process.argv[1]}`) {
    const config = JSON.parse(readFileSync('now.config.json', 'utf8'))
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    for (const file of readdirSync(WRAPPER_DIR).filter((f) => f.endsWith('.js'))) {
        const full = join(WRAPPER_DIR, file)
        const before = readFileSync(full, 'utf8')
        const after = before.replace(
            REQUIRE_PATTERN,
            (_whole, _scope, _name, _version, tail) => `require('${config.scope}/${pkg.name}/${pkg.version}/${tail}')`,
        )
        if (after !== before) {
            writeFileSync(full, after)
            console.log(`${full}: require paths set to ${pkg.version}`)
        }
    }
}
