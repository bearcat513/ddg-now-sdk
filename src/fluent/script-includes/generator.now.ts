import '@servicenow/sdk/global'
import { ScriptInclude } from '@servicenow/sdk/core'

/**
 * The named entry points into the generator.
 *
 * `ScriptInclude`'s `script` property is string-only — it does not accept a
 * module import the way `BusinessRule` and REST route handlers do — so the
 * source is kept in its own `.js` file and pulled in with `Now.include()`.
 * Both files are thin bridges that `require()` the real module; see
 * `src/script-includes/ddg-generator.js` for why the bridge layer exists at
 * all rather than everything being modules.
 */

export const DdgGenerator = ScriptInclude({
    $id: Now.ID['DdgGenerator'],
    name: 'DdgGenerator',
    script: Now.include('../../script-includes/ddg-generator.js'),
    description: 'Named entry point into the data generator: infer, preview, generate.',
    // Public so a pipeline in another scope, or a UI Action on someone else's
    // table, can call it. The ACLs underneath still decide what it can see.
    accessibleFrom: 'public',
    callerAccess: 'tracking',
})

export const DdgAjax = ScriptInclude({
    $id: Now.ID['DdgAjax'],
    name: 'DdgAjax',
    script: Now.include('../../script-includes/ddg-ajax.js'),
    description: 'Client-callable face of the generator: inference and small previews.',
    clientCallable: true,
    accessibleFrom: 'public',
})
