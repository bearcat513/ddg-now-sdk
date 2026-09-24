import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'

/**
 * One worked example, installed as demo data.
 *
 * `installMethod: 'demo'` so it lands on a development instance and can be
 * left out of a real one — this is a thing to look at and run, not something
 * the app depends on.
 *
 * It is deliberately a *support ticket* shape rather than a generic one. It
 * exercises the features that are easy to get wrong and hard to discover from
 * an empty form: a weighted enum, a bundle spreading into correlated columns,
 * a derived timestamp ordered against another, a calculated field, and a
 * `when` predicate. Someone who reads these records learns most of what the
 * schema editor can do.
 *
 * The seed is fixed, so running it twice produces the same rows — which is
 * both the point of the feature and the quickest way to confirm the generator
 * survived the move to Rhino.
 *
 * Each field is its own `Record()` call rather than a loop over a list:
 * Fluent files admit only the declarative API calls, so a helper function
 * here is a build error rather than a tidier version of the same thing.
 * Orders step in hundreds so a field can be slipped between two later.
 */

export const demoConfig = Record({
    $id: Now.ID['demo-config-tickets'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_config',
    data: {
        name: 'Support tickets (example)',
        description:
            'A worked example covering weighted enums, correlated bundles, ordered timestamps, calculated fields and conditional blanking. Fixed seed, so every run produces the same rows.',
        row_count: 500,
        seed: 'support-tickets-v1',
        locale: 'en',
        metadata: JSON.stringify({ purpose: 'example', owner: 'ddg' }),
    },
})

// Row index plus a base, so the numbers march INC1000001, INC1000002, … the
// way a real record-number sequence does.
Record({
    $id: Now.ID['demo-field-number'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'number',
        field_type: 'nowRecordNumber',
        order: 100,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({ variant: 'INC', min: 1000001 }),
    },
})

// A bundle spreads into reporter.first_name, reporter.email and so on, all
// drawn from one coherent person rather than six unrelated ones.
Record({
    $id: Now.ID['demo-field-reporter'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'reporter',
        field_type: 'bundle',
        order: 200,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({ bundle: 'person' }),
    },
})

// Weights matter here: a priority column that is uniformly distributed looks
// nothing like a real queue, and test data that is not shaped like production
// hides exactly the bugs it was meant to surface.
Record({
    $id: Now.ID['demo-field-priority'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'priority',
        field_type: 'enum',
        order: 300,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({
            values: ['1 - Critical', '2 - High', '3 - Moderate', '4 - Low'],
            weights: [2, 12, 56, 30],
        }),
    },
})

Record({
    $id: Now.ID['demo-field-state'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'state',
        field_type: 'enum',
        order: 400,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({
            values: ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'],
            weights: [14, 26, 8, 32, 20],
        }),
    },
})

Record({
    $id: Now.ID['demo-field-short-desc'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'short_description',
        field_type: 'sentence',
        order: 500,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({ min: 5, max: 12 }),
    },
})

// Sequential rather than random, so `opened_at` across the run reads as a
// ticket queue filling up over working hours instead of as noise.
Record({
    $id: Now.ID['demo-field-opened'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'opened_at',
        field_type: 'sequentialDate',
        order: 600,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({ step: 5400, jitter: 40, businessHours: true, format: 'datetime' }),
    },
})

// `after` pushes this past `opened_at`, so closure never precedes opening —
// the kind of invariant a naive generator breaks on about half the rows.
Record({
    $id: Now.ID['demo-field-closed'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'closed_at',
        field_type: 'futureDate',
        order: 700,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({ after: 'opened_at', format: 'datetime' }),
    },
})

// Log-normal, because time-spent has a long right tail: most tickets are
// quick and a few are catastrophes. A uniform draw would flatten that away.
Record({
    $id: Now.ID['demo-field-minutes'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'minutes_spent',
        field_type: 'integer',
        order: 800,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({ distribution: 'lognormal', mean: 45, stddev: 1.1, min: 1 }),
    },
})

Record({
    $id: Now.ID['demo-field-rate'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'hourly_rate',
        field_type: 'float',
        order: 900,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({ min: 60, max: 180, decimals: 2 }),
    },
})

// Reads two other columns; the dependency sort runs it after both, whatever
// order the fields are listed in.
Record({
    $id: Now.ID['demo-field-cost'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'cost',
        field_type: 'computed',
        order: 1000,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({ expression: 'minutes_spent / 60 * hourly_rate', decimals: 2 }),
    },
})

// Only tickets that took real time get a satisfaction score. That is what
// `when` is for: a column that is legitimately blank rather than zero.
Record({
    $id: Now.ID['demo-field-csat'],
    $meta: { installMethod: 'demo' },
    table: 'x_1040823_ddg_now_field',
    data: {
        config: demoConfig,
        field_name: 'csat',
        field_type: 'integer',
        order: 1100,
        null_percent: 0,
        is_unique: false,
        options: JSON.stringify({ min: 1, max: 5, when: 'minutes_spent > 30' }),
    },
})
