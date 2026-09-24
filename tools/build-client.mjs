/**
 * Bundles the React client before the Fluent build runs.
 *
 * `src/fluent/ui-pages/studio.now.ts` imports `../../client/index.html`, and
 * the SDK resolves that import through `staticContent.paths` to the *built*
 * file in `dist/static/`. So this has to produce that file before the Fluent
 * compiler looks for it — hence a prebuild step rather than anything the page
 * definition could do for itself.
 *
 * This is the SDK's own scaffolded client build, kept as-is. There is no
 * webpack or vite config here and there should not be one: `servicenowFrontEndPlugins`
 * is what knows how to compile JSX, resolve `@servicenow/react-components`,
 * and emit the `<sdk:now-ux-globals>` wiring the page needs.
 */

import { servicenowFrontEndPlugins, rollup, glob } from '@servicenow/isomorphic-rollup'

export default async function buildClient({ rootDir, config, fs, path, logger, registerExplicitId }) {
    const clientDir = path.join(rootDir, config.clientDir)
    const htmlFilePattern = path.join(clientDir, '**', '*.html')

    const htmlFiles = await glob(htmlFilePattern, { fs })
    if (!htmlFiles.length) {
        logger.warn(`No HTML files found in ${clientDir}, skipping the UI build.`)
        return
    }

    const staticContentDir = path.join(rootDir, config.staticContent.buildDir)
    // A stale bundle that survives a rename is worse than a slow build.
    fs.rmSync(staticContentDir, { recursive: true, force: true })

    const bundle = await rollup({
        fs,
        input: htmlFilePattern,
        plugins: [
            servicenowFrontEndPlugins({
                scope: config.scope,
                rootDir: clientDir,
                projectRootDir: rootDir,
                registerExplicitId,
                // Ships the client source alongside the bundle so the page
                // stays editable on the instance and through Build Agent.
                editableSourceCodeOnInstance: config.packageSourceCodeOnInstance,
            }),
        ],
    })

    const output = await bundle.write({ dir: staticContentDir, sourcemap: true })

    let bytes = 0
    for (const file of output.output) {
        bytes += file.type === 'asset' ? file.source.length : file.code.length
    }
    logger.info(`Client bundle: ${output.output.length} files, ${(bytes / 1024).toFixed(1)} KB`)
}
