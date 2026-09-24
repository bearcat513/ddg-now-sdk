/**
 * Compiles the Tailwind stylesheet before the client bundle is built.
 *
 * `servicenowFrontEndPlugins` bundles plain CSS and nothing more — there is no
 * PostCSS step in it, and adding one would mean a bundler config, which this
 * repository does not have and should not grow. So Tailwind runs *ahead* of
 * rollup instead of inside it: this reads `src/client/styles/globals.css`,
 * scans the client sources named by its `@source` directive, and writes plain
 * CSS to `src/client/generated/app.css`, which `main.tsx` then imports like
 * any other stylesheet.
 *
 * It is a prebuild function rather than an npm script so `npm run build` stays
 * one command and the ordering is expressed where the other ordering already
 * is — this has to finish before `build-client.mjs` runs, which has to finish
 * before the Fluent compiler resolves the UI page's HTML import.
 *
 * Running the CLI as a child process is deliberate. Tailwind v4's compiler is
 * reached through the CLI or through a bundler plugin; there is no stable
 * programmatic entry point, and shelling out to the binary that ships with the
 * dependency is the documented path. This is design-time code on a laptop, so
 * `node:` built-ins are fine here in a way they are not under `src/server`.
 */

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/** Where the CLI lives once `npm install` has run. */
const CLI = fileURLToPath(new URL('../node_modules/@tailwindcss/cli/dist/index.mjs', import.meta.url))

export const INPUT = 'src/client/styles/globals.css'
export const OUTPUT = 'src/client/generated/app.css'

/**
 * Runs the Tailwind CLI once and resolves when it has written the file.
 *
 * A failure here is fatal on purpose. The alternative — carrying on with a
 * stale or missing stylesheet — produces a bundle that installs cleanly and
 * renders as unstyled HTML on the instance, which is a much more expensive way
 * to find out that the CSS did not compile.
 */
export function compileCss({ rootDir, args = [] }) {
    return new Promise((resolve, reject) => {
        const child = spawn(
            process.execPath,
            [CLI, '--input', INPUT, '--output', OUTPUT, '--minify', ...args],
            { cwd: rootDir, stdio: ['ignore', 'pipe', 'pipe'] },
        )

        // The CLI writes its progress line to stderr, so neither stream is an
        // error on its own; what it exits with is.
        let stderr = ''
        child.stderr.on('data', (chunk) => {
            stderr += chunk
        })
        child.on('error', reject)
        child.on('close', (code) => {
            if (code === 0) return resolve()
            reject(new Error(`Tailwind exited with ${code}.\n${stderr.trim()}`))
        })
    })
}

export default async function buildCss({ rootDir, fs, path, logger }) {
    await compileCss({ rootDir })

    const output = path.join(rootDir, OUTPUT)
    const bytes = fs.statSync(output).size
    logger.info(`Stylesheet: ${(bytes / 1024).toFixed(1)} KB`)
}
