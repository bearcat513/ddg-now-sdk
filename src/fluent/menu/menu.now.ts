import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'
import { ddgUser } from '../roles/roles.now'

/**
 * Navigation.
 *
 * Two ways in, and the split is deliberate.
 *
 * **Generator** is the UI Page: it owns the two things that have no record to
 * bind to and no platform component that does them — inferring a schema from
 * pasted JSON, TypeScript or DDL, and previewing rows without storing them.
 * That is the front door, so it is first.
 *
 * The **list modules** underneath it are not a lesser version of the same
 * thing; they are the platform's own lists and forms, and they are better than
 * custom UI at what they do. Someone who wants to filter every configuration
 * by locale, bulk-edit field rows inline, or export a list to Excel should use
 * them, and the page does not try to replace any of that.
 */

export const ddgMenu = ApplicationMenu({
    $id: Now.ID['ddg-menu'],
    title: 'Dummy Data Generator',
    hint: 'Infer schemas and generate realistic test data',
    description: 'Schema inference and seeded data generation.',
    roles: [ddgUser],
    active: true,
    order: 100,
})

/** The page. First, because it is the thing this application is for. */
Record({
    $id: Now.ID['ddg-module-studio'],
    table: 'sys_app_module',
    data: {
        title: 'Generator',
        application: ddgMenu,
        link_type: 'DIRECT',
        query: 'x_1040823_ddg_now_studio.do',
        hint: 'Import a structure, edit a schema, preview and generate',
        active: true,
        order: 50,
    },
})

Record({
    $id: Now.ID['ddg-module-records-sep'],
    table: 'sys_app_module',
    data: {
        title: 'Records',
        application: ddgMenu,
        link_type: 'SEPARATOR',
        active: true,
        order: 75,
    },
})

Record({
    $id: Now.ID['ddg-module-configs'],
    table: 'sys_app_module',
    data: {
        title: 'Schema Configurations',
        application: ddgMenu,
        link_type: 'LIST',
        name: 'x_1040823_ddg_now_config',
        hint: 'Every schema you can read',
        active: true,
        order: 100,
    },
})

Record({
    $id: Now.ID['ddg-module-config-new'],
    table: 'sys_app_module',
    data: {
        title: 'New Configuration',
        application: ddgMenu,
        link_type: 'NEW',
        name: 'x_1040823_ddg_now_config',
        active: true,
        order: 200,
    },
})

Record({
    $id: Now.ID['ddg-module-datasets-sep'],
    table: 'sys_app_module',
    data: {
        title: 'Datasets',
        application: ddgMenu,
        link_type: 'SEPARATOR',
        active: true,
        order: 300,
    },
})

Record({
    $id: Now.ID['ddg-module-datasets'],
    table: 'sys_app_module',
    data: {
        title: 'All Datasets',
        application: ddgMenu,
        link_type: 'LIST',
        name: 'x_1040823_ddg_now_dataset',
        active: true,
        order: 400,
    },
})

/**
 * A filtered list rather than another full one: when a run fails, the useful
 * view is the failures, and finding them by sorting a list of completed runs
 * is exactly the kind of small friction that stops people looking.
 */
Record({
    $id: Now.ID['ddg-module-datasets-failed'],
    table: 'sys_app_module',
    data: {
        title: 'Failed Runs',
        application: ddgMenu,
        link_type: 'FILTER',
        name: 'x_1040823_ddg_now_dataset',
        filter: 'state=failed^ORstate=queued',
        active: true,
        order: 500,
    },
})
