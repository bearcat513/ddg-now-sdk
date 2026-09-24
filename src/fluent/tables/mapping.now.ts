import '@servicenow/sdk/global'
import { ChoiceColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * One cross-configuration link: a field in this schema takes its values from a
 * column of another configuration's data.
 *
 * `FieldMapping` was already modelled as a property of the configuration
 * rather than of the field, because "what does this schema borrow, and from
 * where" is one question about the schema rather than something scattered
 * across its fields. Its own small table mirrors that exactly — two reference
 * columns and two field names.
 *
 * The field names are strings rather than references to `x_..._field` rows on
 * purpose: a mapping names a field by *name* so it survives that field being
 * retyped, reordered, or replaced when the schema editor rewrites the list.
 */
export const x_1040823_ddg_now_mapping = Table({
    name: 'x_1040823_ddg_now_mapping',
    label: 'Field Mapping',
    display: 'field_name',
    allowWebServiceAccess: true,
    schema: {
        config: ReferenceColumn({
            label: 'Configuration',
            referenceTable: 'x_1040823_ddg_now_config',
            cascadeRule: 'delete',
            mandatory: true,
        }),
        field_name: StringColumn({ label: 'Field', maxLength: 255, mandatory: true }),
        from_config: ReferenceColumn({
            label: 'From configuration',
            referenceTable: 'x_1040823_ddg_now_config',
            // Not a cascade delete: losing the source configuration should
            // leave a visibly broken mapping to fix, not silently drop the
            // link and change what the next run produces.
            cascadeRule: 'none',
            mandatory: true,
        }),
        from_field: StringColumn({ label: 'From field', maxLength: 255, mandatory: true }),
        mode: ChoiceColumn({
            label: 'Mode',
            default: 'random',
            choices: {
                random: 'Random — draw freely from the pool',
                cycle: 'Cycle — walk the pool in order, wrapping',
                unique: 'Unique — one row per pool entry, then null',
            },
        }),
    },
})
