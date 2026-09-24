import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'

/**
 * The fields, mappings and datasets of a configuration, as related lists on
 * its form.
 *
 * This is the whole UI bet of the port, made concrete. The React SPA's schema
 * editor was ~40 components; what it fundamentally did was let someone add a
 * row, pick a type from a list, and fill in a few options. A related list on
 * the parent form does that natively, with inline editing, filtering, sorting
 * and per-row ACLs already attached.
 *
 * All three relationships are **implicit**: each child table has a
 * `ReferenceColumn` pointing at the configuration, so no `sys_relationship`
 * record is needed — only the list container and one entry per relationship,
 * named in `table.reference_field` form.
 */

const configLists = Record({
    $id: Now.ID['config-related-lists'],
    table: 'sys_ui_related_list',
    data: {
        name: 'x_1040823_ddg_now_config',
        view: 'Default view',
    },
})

/** First, because editing the field list is the main thing you come here for. */
Record({
    $id: Now.ID['config-related-list-fields'],
    table: 'sys_ui_related_list_entry',
    data: {
        list_id: configLists,
        position: 0,
        related_list: 'x_1040823_ddg_now_field.config',
    },
})

Record({
    $id: Now.ID['config-related-list-mappings'],
    table: 'sys_ui_related_list_entry',
    data: {
        list_id: configLists,
        position: 1,
        related_list: 'x_1040823_ddg_now_mapping.config',
    },
})

/** Runs of this configuration, newest first — the history of what it produced. */
Record({
    $id: Now.ID['config-related-list-datasets'],
    table: 'sys_ui_related_list_entry',
    data: {
        list_id: configLists,
        position: 2,
        related_list: 'x_1040823_ddg_now_dataset.config',
    },
})
