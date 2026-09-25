import '@servicenow/sdk/global'
import { StringColumn, Table } from '@servicenow/sdk/core'

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
    },
    index: [{ name: 'ddg_whiteboard_name', unique: false, element: 'name' }],
})
