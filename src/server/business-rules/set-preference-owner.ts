/**
 * Stamps a preference row with the person saving it.
 *
 * The record layer sets `user` itself, so on the page's own path this rule
 * agrees with what is already there. It exists for the path that is not the
 * page: `/preferences` is a public endpoint like every other route here, and a
 * caller who sent `{ "user": "<someone else>" }` must not be able to write a
 * row that person will then read as their own preferences.
 *
 * An ACL condition would be the other way to say this, and a weaker one — a
 * create condition would refuse the insert rather than correct it, which turns
 * an ignorable extra field in a request body into an error. This makes `user`
 * simply not a thing the caller gets to decide, which is the truth.
 *
 * `before insert` only. An existing row keeps the owner it was created with,
 * and reaching one at all already means passing the own-row write ACL.
 */

import { gs, GlideRecord } from '@servicenow/glide'

export function setPreferenceOwner(current: GlideRecord<'x_1040823_ddg_now_user_pref'>): void {
    current.setValue('user', gs.getUserID())
}
