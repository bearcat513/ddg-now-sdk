import '@servicenow/sdk/global'
import { Acl } from '@servicenow/sdk/core'
import { ddgUser } from '../roles/roles.now'

/**
 * Access control.
 *
 * This is the part of the original design that translates most cleanly,
 * because the Bun app already got it right: the server held no credentials and
 * granted nothing on its own — every request carried the caller's own token
 * and PocketBase's collection rules decided what they could see. ServiceNow
 * works the same way, so the principle is kept and only the mechanism changes.
 * The record layer reads and writes through `GlideRecordSecure`; these rules
 * are what it enforces.
 *
 * One difference from PocketBase to be explicit about: **per-record ownership
 * is not automatic.** PocketBase rules compared the record's owner field to
 * the caller. Here `sys_created_by` gives the equivalent, and it has to be
 * written as an ACL condition — which is what the write and delete rules below
 * do. Read stays app-wide for anyone with the role: a schema is a description
 * of shapes, not data, and making them readable is what lets a team reuse one.
 *
 * The `sharedWith` array and the `/api/ddg/shares/...` hook routes did not come
 * across. Group-based ACLs and an app-wide read cover what that model was for,
 * and a custom sharing table on a platform that already has groups is a
 * liability rather than a feature.
 */

/**
 * Only the creator may change or remove a record.
 *
 * `sys_created_by` holds a user *name*, not a sys_id, so this compares against
 * `gs.getUserName()` rather than using the `DYNAMIC` "Me" filter — that filter
 * yields `gs.getUserID()` and would silently never match on a string column.
 */
const OWN_RECORD = 'sys_created_by=javascript:gs.getUserName()'

/* ----------------------------- configurations ---------------------------- */

Acl({
    $id: Now.ID['config-read'],
    type: 'record',
    operation: 'read',
    table: 'x_1040823_ddg_now_config',
    roles: [ddgUser],
    description: 'Anyone with the DDG role can read any schema configuration.',
})

Acl({
    $id: Now.ID['config-create'],
    type: 'record',
    operation: 'create',
    table: 'x_1040823_ddg_now_config',
    roles: [ddgUser],
})

Acl({
    $id: Now.ID['config-write'],
    type: 'record',
    operation: 'write',
    table: 'x_1040823_ddg_now_config',
    roles: [ddgUser],
    condition: OWN_RECORD,
    description: 'Editing a configuration is the creator’s, standing in for PocketBase’s owner rule.',
})

Acl({
    $id: Now.ID['config-delete'],
    type: 'record',
    operation: 'delete',
    table: 'x_1040823_ddg_now_config',
    roles: [ddgUser],
    condition: OWN_RECORD,
})

/* --------------------------------- fields -------------------------------- */

/**
 * Fields follow their configuration rather than carrying rules of their own.
 *
 * A field row has no meaning apart from the schema it belongs to, so the
 * useful question is always "may you edit that configuration" — and the
 * condition here asks it of the parent rather than of the field row, which a
 * `sys_created_by` check would get wrong the moment someone else edits a
 * schema they are allowed to edit.
 */
const OWN_PARENT_CONFIG = 'config.sys_created_by=javascript:gs.getUserName()'

Acl({
    $id: Now.ID['field-read'],
    type: 'record',
    operation: 'read',
    table: 'x_1040823_ddg_now_field',
    roles: [ddgUser],
})

Acl({
    $id: Now.ID['field-create'],
    type: 'record',
    operation: 'create',
    table: 'x_1040823_ddg_now_field',
    roles: [ddgUser],
})

Acl({
    $id: Now.ID['field-write'],
    type: 'record',
    operation: 'write',
    table: 'x_1040823_ddg_now_field',
    roles: [ddgUser],
    condition: OWN_PARENT_CONFIG,
})

Acl({
    $id: Now.ID['field-delete'],
    type: 'record',
    operation: 'delete',
    table: 'x_1040823_ddg_now_field',
    roles: [ddgUser],
    condition: OWN_PARENT_CONFIG,
})

/* -------------------------------- mappings ------------------------------- */

Acl({
    $id: Now.ID['mapping-read'],
    type: 'record',
    operation: 'read',
    table: 'x_1040823_ddg_now_mapping',
    roles: [ddgUser],
})

Acl({
    $id: Now.ID['mapping-create'],
    type: 'record',
    operation: 'create',
    table: 'x_1040823_ddg_now_mapping',
    roles: [ddgUser],
})

Acl({
    $id: Now.ID['mapping-write'],
    type: 'record',
    operation: 'write',
    table: 'x_1040823_ddg_now_mapping',
    roles: [ddgUser],
    condition: OWN_PARENT_CONFIG,
})

Acl({
    $id: Now.ID['mapping-delete'],
    type: 'record',
    operation: 'delete',
    table: 'x_1040823_ddg_now_mapping',
    roles: [ddgUser],
    condition: OWN_PARENT_CONFIG,
})

/* -------------------------------- datasets ------------------------------- */

/**
 * Generated data is narrower than the schema that produced it.
 *
 * A configuration describes shapes and is worth sharing; a dataset is actual
 * rows, and in the Bun app it was never shared with anyone — "generated data
 * is never shared, so this is always the caller". Read is kept to the creator
 * to preserve that, and the rows are a column on the record, so they are
 * covered by the same decision rather than by a second one.
 */
Acl({
    $id: Now.ID['dataset-read'],
    type: 'record',
    operation: 'read',
    table: 'x_1040823_ddg_now_dataset',
    roles: [ddgUser],
    condition: OWN_RECORD,
})

Acl({
    $id: Now.ID['dataset-create'],
    type: 'record',
    operation: 'create',
    table: 'x_1040823_ddg_now_dataset',
    roles: [ddgUser],
})

Acl({
    $id: Now.ID['dataset-write'],
    type: 'record',
    operation: 'write',
    table: 'x_1040823_ddg_now_dataset',
    roles: [ddgUser],
    condition: OWN_RECORD,
})

Acl({
    $id: Now.ID['dataset-delete'],
    type: 'record',
    operation: 'delete',
    table: 'x_1040823_ddg_now_dataset',
    roles: [ddgUser],
    condition: OWN_RECORD,
})

/* ---------------------------- script templates --------------------------- */

/**
 * A template is read like a configuration and written like one.
 *
 * Both are descriptions rather than data — a schema describes shapes, a
 * template describes what to do with rows — and both are worth a team sharing.
 * So read is app-wide for anyone with the role and editing stays the
 * creator's, which is also what the Bun app's sharing model amounted to once
 * `sharedWith` was read-only. Someone who wants to change a colleague's
 * template saves their own copy, exactly as they would with a schema.
 */
Acl({
    $id: Now.ID['template-read'],
    type: 'record',
    operation: 'read',
    table: 'x_1040823_ddg_now_template',
    roles: [ddgUser],
    description: 'Anyone with the DDG role can read any script template.',
})

Acl({
    $id: Now.ID['template-create'],
    type: 'record',
    operation: 'create',
    table: 'x_1040823_ddg_now_template',
    roles: [ddgUser],
})

Acl({
    $id: Now.ID['template-write'],
    type: 'record',
    operation: 'write',
    table: 'x_1040823_ddg_now_template',
    roles: [ddgUser],
    condition: OWN_RECORD,
})

Acl({
    $id: Now.ID['template-delete'],
    type: 'record',
    operation: 'delete',
    table: 'x_1040823_ddg_now_template',
    roles: [ddgUser],
    condition: OWN_RECORD,
})

/* ------------------------------ preferences ------------------------------ */

/**
 * A preference row is the one record here that is nobody else's business.
 *
 * A configuration is readable app-wide because a schema is a description of
 * shapes worth reusing, and a dataset is readable by its creator because it is
 * their data. How someone likes their panes arranged is neither: it is theirs,
 * and there is no version of "a colleague may read it" that is useful.
 *
 * `user` is a reference and holds a sys_id, so this compares against
 * `gs.getUserID()` — the opposite of `OWN_RECORD` above, which compares a
 * *name* because `sys_created_by` stores one. Getting these two the wrong way
 * round yields a condition that silently never matches.
 *
 * Create carries no condition on purpose. The `set-preference-owner` business
 * rule overwrites `user` before the insert lands, so the row is the caller's
 * whatever they asked for; a condition here would refuse the insert instead of
 * correcting it, and would be evaluating a field the caller does not control.
 */
const OWN_PREFERENCE = 'user=javascript:gs.getUserID()'

Acl({
    $id: Now.ID['pref-read'],
    type: 'record',
    operation: 'read',
    table: 'x_1040823_ddg_now_user_pref',
    roles: [ddgUser],
    condition: OWN_PREFERENCE,
    description: 'Preferences are private to the person they belong to.',
})

Acl({
    $id: Now.ID['pref-create'],
    type: 'record',
    operation: 'create',
    table: 'x_1040823_ddg_now_user_pref',
    roles: [ddgUser],
})

Acl({
    $id: Now.ID['pref-write'],
    type: 'record',
    operation: 'write',
    table: 'x_1040823_ddg_now_user_pref',
    roles: [ddgUser],
    condition: OWN_PREFERENCE,
})

Acl({
    $id: Now.ID['pref-delete'],
    type: 'record',
    operation: 'delete',
    table: 'x_1040823_ddg_now_user_pref',
    roles: [ddgUser],
    condition: OWN_PREFERENCE,
    description: 'Resetting writes the defaults rather than deleting, but the row stays the owner’s to remove.',
})

/* -------------------------------- the page ------------------------------- */

/**
 * The UI Page itself.
 *
 * A `direct` UI Page is otherwise reachable by any authenticated user. The
 * tables underneath are role-gated, so without this someone who lacks the role
 * would reach a working page showing nothing — which reads as a broken
 * application rather than as a permissions answer. Gating the entry point says
 * the true thing at the door.
 */
Acl({
    $id: Now.ID['studio-page-execute'],
    type: 'ui_page',
    operation: 'execute',
    name: 'x_1040823_ddg_now_studio.do',
    roles: [ddgUser],
    description: 'Only holders of the DDG role can open the generator page.',
})
