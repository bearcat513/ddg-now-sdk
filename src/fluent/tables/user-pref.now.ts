import '@servicenow/sdk/global'
import { BooleanColumn, ChoiceColumn, IntegerColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * One row per person: how they like the workspace arranged.
 *
 * The Bun app stored these as a JSON blob on the account's own `users` record,
 * which is the shape PocketBase made easy. The platform equivalent would be a
 * `sys_user_preference` entry or a column on `sys_user`, and this application
 * does neither — at the user's direction it gets a table of its own. That is
 * the better answer here for reasons the blob could not give: a preference is
 * queryable and reportable, an admin can see what someone's page is set to
 * without parsing a string, the app's own ACLs decide who reads it rather than
 * `sys_user`'s, and uninstalling the application takes its preferences with it
 * instead of leaving a column behind on a core table.
 *
 * **Real columns, not a JSON blob.** It is the same judgement `config.now.ts`
 * makes about the field list: a fixed, known set of values belongs in columns,
 * where list views, filtering and a form come free. `FieldOptions` stays JSON
 * over in `field.now.ts` because it is a genuinely heterogeneous bag of forty
 * optional properties; eight named preferences are not that.
 *
 * Every column has a default equal to `DEFAULT_PREFERENCES` in
 * `src/server/lib/preferences.ts`, so a row created through a form rather than
 * through the page is already a valid set. The normalizer is what guarantees
 * that either way — these defaults are the platform saying the same thing.
 */
export const x_1040823_ddg_now_user_pref = Table({
    name: 'x_1040823_ddg_now_user_pref',
    label: 'User preference',
    display: 'user',
    allowWebServiceAccess: true,
    schema: {
        /**
         * Who these belong to.
         *
         * Written by the `set-preference-owner` business rule rather than by
         * the caller, so a request cannot claim someone else's row. The unique
         * index is what keeps a second row from ever existing for one person —
         * two concurrent first-saves would otherwise both insert.
         */
        user: ReferenceColumn({
            label: 'User',
            referenceTable: 'sys_user',
            mandatory: true,
            // The preferences have no meaning without the person: removing the
            // user should take the row with them.
            cascadeRule: 'delete',
        }),
        theme: ChoiceColumn({
            label: 'Theme',
            default: 'system',
            choices: {
                system: 'Follow the operating system',
                light: 'Light',
                dark: 'Dark',
            },
        }),
        sidebar_collapsed: BooleanColumn({ label: 'Sidebar collapsed' }),
        /**
         * The folded nav lists, comma-separated.
         *
         * A short list of known names, so a string reads and filters in a
         * list view where a JSON array would not. `normalizePreferences`
         * accepts this form and the page's array form alike.
         */
        collapsed_nav_sections: StringColumn({ label: 'Collapsed nav sections', maxLength: 100 }),
        editor_split_percent: IntegerColumn({ label: 'Editor split %', default: 50 }),
        default_row_count: IntegerColumn({ label: 'Default row count', default: 25 }),
        /**
         * A String, not a ChoiceColumn, for the same reason `field_type` is one
         * in `field.now.ts`: the `FieldType` union lives in
         * `src/server/lib/types.ts` and a choice list here would be a second
         * copy of it to drift. The normalizer validates against the union.
         */
        default_field_type: StringColumn({ label: 'Default field type', maxLength: 60, default: 'word' }),
        default_export_format: ChoiceColumn({
            label: 'Default export format',
            default: 'csv',
            choices: {
                csv: 'CSV',
                json: 'JSON',
                sql: 'SQL inserts',
            },
        }),
        /**
         * The script template preselected beside the preview.
         *
         * A reference, so the form offers the templates that exist and the row
         * says which one by name. Emptied rather than cascaded when that
         * template goes: a preference pointing at nothing means "the first
         * one", which is what it meant before anybody chose.
         */
        default_template: ReferenceColumn({
            label: 'Default script template',
            referenceTable: 'x_1040823_ddg_now_template',
            cascadeRule: 'clear',
        }),
        preview_row_limit: IntegerColumn({ label: 'Preview row limit', default: 200 }),
    },
    index: [{ name: 'ddg_pref_user', unique: true, element: 'user' }],
})
