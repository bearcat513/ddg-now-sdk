/**
 * A stand-in for `@servicenow/glide` when a module is run outside the platform.
 *
 * The pure layers — the generator, inference, formulas, export — import
 * nothing from Glide, which is exactly why they are testable on Node at all.
 * But they sit in the same module graph as layers that do (`choices.ts`
 * reaches for `GlideRecordSecure`), and an ES module's imports are resolved
 * whether or not the code path is taken. So the import has to resolve.
 *
 * Every member here **throws when called**. That is deliberate: a stub that
 * quietly returned empty results would let a test pass while exercising
 * nothing, and the point of running these on Node is to test the parts that
 * genuinely have no platform dependency. If a test reaches Glide, it is
 * testing the wrong thing and should say so loudly.
 */

const unavailable = (name) => () => {
    throw new Error(
        `${name} is a ServiceNow platform API and is not available off-instance. ` +
            `This code path needs an instance — test the pure layer instead, or run it through the SDK.`,
    )
}

/** A constructor-shaped throw, so `new GlideRecord(...)` fails clearly. */
const stubClass = (name) =>
    new Proxy(function () {}, {
        construct: unavailable(`new ${name}()`),
        apply: unavailable(name),
        get: (_target, property) => (typeof property === 'string' ? unavailable(`${name}.${property}`) : undefined),
    })

/** An object-shaped throw, for namespaces like `gs` and `action`. */
const stubObject = (name) =>
    new Proxy(
        {},
        {
            get: (_target, property) => (typeof property === 'string' ? unavailable(`${name}.${property}`) : undefined),
        },
    )

export const GlideRecord = stubClass('GlideRecord')
export const GlideRecordSecure = stubClass('GlideRecordSecure')
export const GlideSysAttachment = stubClass('GlideSysAttachment')
export const GlideAggregate = stubClass('GlideAggregate')
export const GlideDateTime = stubClass('GlideDateTime')
export const RESTMessageV2 = stubClass('RESTMessageV2')
export const GlideAction = stubClass('GlideAction')

export const gs = stubObject('gs')
export const action = stubObject('action')
export const sn_ws = stubObject('sn_ws')

export default { GlideRecord, GlideRecordSecure, GlideSysAttachment, gs }
