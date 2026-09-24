import '@servicenow/sdk/global'
import { BooleanColumn, IntegerColumn, JsonColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * One row per field of a schema.
 *
 * This is the shape change that pays for itself. PocketBase stored the whole
 * `Field[]` array as a single 2 MB JSON column because it could; on ServiceNow
 * that choice costs list views, filtering, per-field ACLs, and the ability to
 * reference a field from anywhere else. One row per field is the
 * platform-shaped version, and it is what makes the schema editor a standard
 * related list on the configuration form rather than custom UI.
 *
 * **`field_type` is a String, not a ChoiceColumn, on purpose.** The `FieldType`
 * union in `src/server/lib/types.ts` has roughly 195 members. Expressing that
 * as a `choices` object would be 195 lines of Fluent kept in lockstep with the
 * TypeScript union by hand, and every added generator would become a schema
 * migration. The union stays the single source of truth in the module layer;
 * the business rule in `validate-field.now.ts` enforces it on write, and
 * `tools/sync-field-choices.mjs` regenerates the form's picker from
 * `FIELD_TYPES` when you want one.
 *
 * `options` legitimately stays JSON. `FieldOptions` is a heterogeneous bag —
 * `min`/`max` for numerics, `values`/`weights` for enums, `pattern` for
 * templates, `refDataset`/`refField` for references — and flattening 40-odd
 * optional properties into columns would produce a table that is mostly null.
 *
 * The column is `is_unique`, not `unique`: `unique` is a reserved word in
 * every SQL dialect the platform sits on, and a column name that has to be
 * quoted forever is not worth the four saved characters.
 */
export const x_1040823_ddg_now_field = Table({
    name: 'x_1040823_ddg_now_field',
    label: 'Schema Field',
    display: 'field_name',
    allowWebServiceAccess: true,
    schema: {
        config: ReferenceColumn({
            label: 'Configuration',
            referenceTable: 'x_1040823_ddg_now_config',
            // Deleting a configuration takes its fields with it. They have no
            // meaning on their own.
            cascadeRule: 'delete',
            mandatory: true,
        }),
        field_name: StringColumn({
            label: 'Field name',
            maxLength: 255,
            mandatory: true,
            // Free-form, and nests as a dot path: "user.address.city" nests in
            // JSON and stays flat as a column in CSV.
        }),
        field_type: StringColumn({ label: 'Type', maxLength: 60, mandatory: true, default: 'word' }),
        order: IntegerColumn({ label: 'Order', default: 100 }),
        null_percent: IntegerColumn({ label: 'Null %', default: 0 }),
        is_unique: BooleanColumn({ label: 'Unique' }),
        options: JsonColumn({ label: 'Options' }),
    },
    index: [{ name: 'ddg_field_config', unique: false, element: ['config', 'order'] }],
})
