/**
 * A resolve hook so the local tools can import the server modules directly.
 *
 * It does two things and nothing else.
 *
 * It points `@servicenow/glide` at the throwing stub in `glide-stub.mjs`. The
 * Glide package ships type declarations only — there is no runtime to import —
 * so without that redirect any module graph touching the platform fails to
 * load, pure layers included. That is the half this file exists for.
 *
 * It also appends an extension to a relative specifier that did not resolve.
 * `src/server` now writes its own relative imports with the `.ts` extension,
 * because the platform resolves a module path exactly and the SDK's generated
 * `require()` carries the extension too — so nothing in the server modules
 * needs this any more. It stays for the loose scripts under `tools/`.
 */

import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CANDIDATES = ['.ts', '.tsx', '/index.ts', '.js']

/** `@servicenow/glide` and its namespaced subpaths. */
const GLIDE = /^@servicenow\/glide(\/.*)?$/

export function resolve(specifier, context, nextResolve) {
    if (GLIDE.test(specifier)) {
        return { url: new URL('./glide-stub.mjs', import.meta.url).href, format: 'module', shortCircuit: true }
    }
    try {
        return nextResolve(specifier, context)
    } catch (error) {
        if (!specifier.startsWith('.') || !context.parentURL) throw error
        for (const extension of CANDIDATES) {
            const candidate = new URL(specifier + extension, context.parentURL)
            if (existsSync(fileURLToPath(candidate))) {
                return { url: candidate.href, format: extension === '.js' ? 'module' : 'module-typescript', shortCircuit: true }
            }
        }
        throw error
    }
}
