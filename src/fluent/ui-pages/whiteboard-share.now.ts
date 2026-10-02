import '@servicenow/sdk/global'
import { Record, UiPage } from '@servicenow/sdk/core'
import page from '../../client/share.html'

/**
 * Where a whiteboard's public link lands: one board, read only, for anyone.
 *
 * A second page rather than a view of the studio, because the studio is the
 * whole application — the nav, the editor, every request a signed-in user
 * makes — and none of that has any business loading for someone without an
 * account. This page knows one route, `POST /public/whiteboard/{token}`, and
 * Excalidraw.
 *
 * `direct: true` for the same reason the studio page needs it. The
 * `sys_public` record below is what lets it render without a session; the
 * name it lists is the endpoint without `.do`, the form every entry on that
 * table uses. Change the two together, and `WHITEBOARD_SHARE_PAGE` with them.
 */
export const x_1040823_ddg_now_whiteboard_share = UiPage({
    $id: Now.ID['ddg-whiteboard-share-page'],
    endpoint: 'x_1040823_ddg_now_whiteboard_share.do',
    description: 'A publicly shared whiteboard, read only. Opened by a link the board’s owner hands out.',
    category: 'general',
    html: page,
    direct: true,
})

Record({
    $id: Now.ID['ddg-whiteboard-share-public'],
    table: 'sys_public',
    data: {
        page: 'x_1040823_ddg_now_whiteboard_share',
        active: true,
    },
})
