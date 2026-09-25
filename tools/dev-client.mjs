/**
 * Watch mode for the client.
 *
 * `npm run dev` — rebuilds the bundle on every save and pushes it to the
 * instance, so UI work does not need a full `build` + `deploy` per change.
 * Fluent changes (tables, ACLs, REST routes) still need the real cycle; this
 * only watches `src/client`.
 *
 * Two watchers, not one. Tailwind watches the sources for class names and
 * rewrites `generated/app.css`; rollup watches everything including that file
 * and rebundles. Chaining them this way means a class typed into a component
 * reaches the instance the same way an edit to the component does, rather than
 * needing the stylesheet rebuilt by hand.
 */

import { servicenowFrontEndPlugins, watch } from '@servicenow/isomorphic-rollup'
import { compileCss, copyExcalidrawCss } from './build-css.mjs'

export default async function devClient({ rootDir, config, fs, path, logger, credential }) {
    const clientDir = path.join(rootDir, config.clientDir)
    const staticContentDir = path.join(rootDir, config.staticContent.buildDir)
    fs.rmSync(staticContentDir, { recursive: true, force: true })

    // Once up front and awaited, so the first bundle never races a stylesheet
    // that does not exist yet; then a watcher that outlives this call.
    copyExcalidrawCss({ rootDir })
    await compileCss({ rootDir })
    compileCss({ rootDir, args: ['--watch'] }).catch((error) => logger.warn(`Tailwind stopped: ${error.message}`))

    const watcher = watch({
        fs,
        input: path.join(clientDir, '**', '*.html'),
        plugins: servicenowFrontEndPlugins({
            dev: true,
            scope: config.scope,
            rootDir: clientDir,
            watchPaths: [staticContentDir],
            credential,
        }),
        output: { dir: staticContentDir, sourcemap: true },
    })

    // Never resolves on purpose: the task ends when the watcher errors or the
    // process is interrupted.
    return new Promise((resolve, reject) => {
        watcher.on('event', (event) => {
            if (event.error) {
                reject(event.error)
            } else if (event.result) {
                logger.info(`Rebuilt the client in ${event.duration}ms`)
                event.result.close()
            }
        })
    })
}
