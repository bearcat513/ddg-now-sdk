import '@servicenow/sdk/global'
import { BooleanColumn, StringColumn, Table } from '@servicenow/sdk/core'

/**
 * A whiteboard: one Excalidraw scene, stored whole.
 *
 * The drawing is a column rather than an attachment for the reason the
 * dataset's rows are: a record whose content is *in* the record is one thing
 * to read, one thing to move in an update set, and one thing to look at on a
 * form, where `json_view` shows the scene as formatted JSON. The scene is the
 * text Excalidraw writes for a `.excalidraw` file, pasted images included,
 * which is why the ceiling is the same 16,000,000 characters the dataset
 * allows — `MAX_WHITEBOARD_SCENE_LENGTH` mirrors it so a save that would not
 * fit is refused rather than truncated into something that no longer parses.
 *
 * `audit` is off on purpose, unlike the template table. A board saves itself
 * as it is drawn on, and auditing a column this size would copy the whole
 * scene into `sys_audit` every few seconds.
 *
 * `allowWebServiceAccess` is on for the same reason the other tables have it.
 *
 * The `share_*` columns are the board's public link. `share_token` is the
 * secret in the URL; `share_password` holds a salted hash, never the password,
 * and a field ACL keeps even that unreadable. `share_protected` says whether
 * there is one, because the owner's page needs to know that and must not be
 * able to read the hash to find out. Only the `DdgPublicWhiteboard` Script
 * Include reads these without the caller's ACLs, and only by exact token.
 */
export const x_1040823_ddg_now_whiteboard = Table({
    name: 'x_1040823_ddg_now_whiteboard',
    label: 'Whiteboard',
    display: 'name',
    allowWebServiceAccess: true,
    schema: {
        name: StringColumn({ label: 'Name', maxLength: 120, mandatory: true }),
        scene: StringColumn({
            label: 'Scene (JSON)',
            maxLength: 16000000,
            attributes: { json_view: true },
        }),
        share_enabled: BooleanColumn({ label: 'Shared publicly', default: false }),
        share_token: StringColumn({ label: 'Share token', maxLength: 64 }),
        share_password: StringColumn({ label: 'Share password hash', maxLength: 255 }),
        share_protected: BooleanColumn({ label: 'Share password set', default: false }),
    },
    index: [
        { name: 'ddg_whiteboard_name', unique: false, element: 'name' },
        { name: 'ddg_whiteboard_share_token', unique: false, element: 'share_token' },
    ],
})
