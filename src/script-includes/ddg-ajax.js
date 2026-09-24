/**
 * DdgAjax — the client-callable face of the generator.
 *
 * Separate from `DdgGenerator` because the two have different audiences and
 * different security postures: this one is reachable from any client script in
 * the instance, so it is kept to the operations that are safe to expose and
 * returns strings rather than objects, as GlideAjax requires.
 *
 * Glide APIs are NOT imported here — they are automatically available in
 * Script Include execution context.
 */
var DdgAjax = Class.create()

DdgAjax.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
    /** Infer a field list from pasted text. Used by the schema form. */
    infer: function () {
        var input = this.getParameter('sysparm_input') || ''
        var mod = require('x_1040823_ddg_now/ddg-now-sdk/0.0.1/src/server/bridge.ts')
        return JSON.stringify(mod.infer(input))
    },

    /**
     * A small preview of what a configuration would generate.
     *
     * Capped at twenty rows regardless of what the client asks for: this is a
     * look, and an unbounded preview from a client script is a denial of
     * service with extra steps.
     */
    preview: function () {
        var configId = this.getParameter('sysparm_config_id') || ''
        var requested = parseInt(this.getParameter('sysparm_row_count') || '10', 10)
        var rowCount = isNaN(requested) ? 10 : Math.max(1, Math.min(requested, 20))

        var generator = new DdgGenerator()
        return JSON.stringify(generator.preview(configId, rowCount))
    },

    type: 'DdgAjax',
})
