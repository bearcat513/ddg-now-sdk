/**
 * DdgGenerator — the named entry point into the generator.
 *
 * A thin bridge and nothing more: every method here does one `require()` and
 * delegates. All the logic lives in `src/server/`, where it has typed Glide
 * imports, is unit-testable, and is shared with the REST handlers and the
 * scheduled job.
 *
 * It exists because plenty of the platform still calls code by name — UI
 * Actions, GlideAjax, other scopes, extension points — and a module cannot be
 * reached that way.
 *
 * It also supplies the one capability a module genuinely cannot have: resolving
 * *another* Script Include by name. `new x_scope.Thing()` works in Script
 * Include execution context and throws in a module, so `callScriptInclude` is
 * created here and handed down. That is what makes "choices come from a script
 * include you name in the field options" work at all.
 *
 * This file is deliberately outside `src/server/`: everything under the server
 * modules directory is compiled into a sys_module, and a `Class.create` file
 * compiled that way would fail at runtime. Glide APIs are NOT imported here —
 * they are automatically available in Script Include context.
 *
 * The `require()` path below carries the package version, because that is the
 * form this SDK version emits for every require it generates itself. Do not
 * hand-edit it: `tools/sync-module-paths.mjs` runs as a prebuild step and
 * rewrites it from package.json on every build, so a version bump cannot leave
 * a wrapper that installs cleanly and fails only when someone calls it.
 */
var DdgGenerator = Class.create()

DdgGenerator.prototype = {
    initialize: function () {
        this._mod = require('x_1040823_ddg_now/ddg-now-sdk/0.0.1/src/server/bridge.ts')
    },

    /**
     * Resolves a script include by name and calls `getChoices()` on it.
     *
     * Handed to the module layer so a dynamic enum can name a script include.
     * Whoever writes that script include needs the role to create one, which
     * is exactly the authorisation boundary the old `node:vm` sandbox was
     * trying, and admittedly failing, to draw.
     */
    _choiceCaller: function () {
        return function (name) {
            var gr = new GlideRecord('sys_script_include')
            gr.addQuery('name', name)
            gr.addActiveQuery()
            gr.setLimit(1)
            gr.query()
            if (!gr.next()) throw new Error('No active script include named "' + name + '".')

            var apiName = gr.getValue('api_name') || name
            var parts = apiName.split('.')
            var scope = parts.length > 1 ? parts[0] : 'global'
            var className = parts.length > 1 ? parts[1] : parts[0]

            var container = typeof this[scope] !== 'undefined' ? this[scope] : global
            var Ctor = container ? container[className] : undefined
            if (typeof Ctor !== 'function') {
                throw new Error('Script include "' + name + '" is not reachable from this scope.')
            }

            var instance = new Ctor()
            if (typeof instance.getChoices !== 'function') {
                throw new Error('Script include "' + name + '" has no getChoices() method.')
            }
            return instance.getChoices()
        }
    },

    /** Paste JSON, a TypeScript interface or DDL; get a field list. */
    infer: function (input) {
        return this._mod.infer(input)
    },

    /** Infer and store as a new configuration in one step. */
    inferInto: function (name, input) {
        return this._mod.inferInto(name, input)
    },

    /** A handful of rows, stored nowhere. */
    preview: function (configId, rowCount) {
        return this._mod.preview(configId, rowCount, this._choiceCaller())
    },

    /**
     * Run a generation into the dataset store. Rows are stored as JSON on the
     * dataset record; ask `/dataset/{id}/export?format=` for CSV or SQL.
     */
    generate: function (configId, rowCount) {
        return this._mod.generate(configId, rowCount, this._choiceCaller())
    },

    /** Run a generation straight into a real table. */
    generateIntoTable: function (configId, table, rowCount, mapping) {
        return this._mod.generateIntoTable(configId, table, rowCount, mapping, this._choiceCaller())
    },

    /** The configured row ceiling. */
    limits: function () {
        return this._mod.limits()
    },

    type: 'DdgGenerator',
}
