import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import page from '../../client/index.html'

/**
 * The application's own page.
 *
 * Lists and forms cover most of this app, and the port started there on
 * purpose — but two things have no record to bind to and no platform
 * component that does them: inferring a schema from pasted JSON, TypeScript or
 * DDL, and previewing the rows a configuration would produce without storing
 * any. Those are the features the tool is named after, and they are what this
 * page exists for. Everything record-shaped inside it still goes through
 * `NowRecordListConnected` and `RecordProvider` rather than being rebuilt.
 *
 * Three properties carry the whole contract:
 *
 *   - `endpoint` must start with the scope prefix, hence the long name.
 *   - `html` is an **import of the client entry point**, not a string. The
 *     build system bundles `main.tsx` and everything it reaches; that import
 *     is what connects the two.
 *   - `direct: true` is required — without it the platform wraps the output in
 *     its own chrome and the React root never mounts.
 */
export const x_1040823_ddg_now_studio = UiPage({
    $id: Now.ID['ddg-studio-page'],
    endpoint: 'x_1040823_ddg_now_studio.do',
    description: 'Dummy Data Generator — import a structure, edit a schema, preview and generate data.',
    category: 'general',
    html: page,
    direct: true,
})
