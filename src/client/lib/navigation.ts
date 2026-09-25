/**
 * URL-based navigation.
 *
 * The Bun app kept which schema was open in React state and nothing else; it
 * was one page on a server of its own, and the address bar never moved. On the
 * platform that is not good enough — a UI Page is reached through the
 * application navigator, sits in a breadcrumb, and gets bookmarked and pasted
 * into tickets — so every state worth returning to has a URL here.
 *
 * `URLSearchParams`, no router library and no hash routing. The state is small
 * and flat: which configuration is open, which dataset the data pane is
 * showing, which script template is being edited, and which tab is in front.
 *
 * The iframe check is the part that is easy to leave out and wrong to: a UI
 * Page opened from the navigator runs inside the Polaris frame, where
 * `history.pushState` updates an address bar nobody can see. The frame has to
 * be told separately, or the breadcrumb and title go stale while the page
 * underneath them changes.
 */

/** The editor's panes, in the order they are drawn — what the arrows walk. */
export const TABS = ['import', 'schema', 'scripts'] as const

export type Tab = (typeof TABS)[number]

/**
 * Which of the two things the main pane is: the editor, or settings.
 *
 * Settings is a view rather than a dialog, so it is addressable like the rest —
 * someone can send a colleague the link and it opens there. It keeps whatever
 * `config` and `dataset` were in the query while it is on screen, so closing it
 * lands back on the schema that was open rather than on an empty editor.
 */
export const VIEWS = ['editor', 'settings'] as const

export type View = (typeof VIEWS)[number]

export type WorkspaceState = {
    /** The configuration being edited, or null for an unsaved one. */
    configId: string | null
    /** The dataset the data pane is showing, or null when it is empty. */
    datasetId: string | null
    /**
     * The script template open in the scripts pane, or null for an unsaved one.
     *
     * It rides beside the configuration rather than replacing it because the
     * two are independent: a template is not a child of a schema, and someone
     * who opens one has not closed the schema they were working on.
     */
    templateId: string | null
    tab: Tab
    view: View
}

const isTab = (value: string | null): value is Tab => TABS.includes(value as Tab)

export function getStateFromUrl(): WorkspaceState {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    const configId = params.get('config')
    const templateId = params.get('template')
    return {
        configId,
        datasetId: params.get('dataset'),
        templateId,
        // A saved schema opens on its fields; an empty editor opens on the
        // paste box, because there is nothing else to look at yet. A link that
        // names a template is asking for the scripts pane whatever else it
        // carries.
        tab: isTab(tab) ? tab : templateId ? 'scripts' : configId ? 'schema' : 'import',
        // Anything but the one named view is the editor, so a mangled query
        // opens the app rather than an error.
        view: params.get('view') === 'settings' ? 'settings' : 'editor',
    }
}

export function pathFor(state: WorkspaceState): string {
    const params = new URLSearchParams()
    if (state.configId) params.set('config', state.configId)
    if (state.datasetId) params.set('dataset', state.datasetId)
    if (state.templateId) params.set('template', state.templateId)
    params.set('tab', state.tab)
    // Absent for the editor: the default view does not need to name itself, and
    // the links already in circulation stay the shape they were.
    if (state.view !== 'editor') params.set('view', state.view)
    return `${window.location.pathname}?${params.toString()}`
}

/** The document title for a state, so titles are written in one place. */
export function titleFor(state: WorkspaceState, configName?: string): string {
    if (state.view === 'settings') return 'Dummy Data Generator — Settings'
    // The scripts pane is about the template rather than the schema behind it,
    // so the label the caller passes is the template's name while it is in
    // front — and an unsaved template does not have one yet.
    if (state.tab === 'scripts' && !configName) return 'Dummy Data Generator — Scripts'
    if (configName) return `Dummy Data Generator — ${configName}`
    if (state.configId) return 'Dummy Data Generator — Configuration'
    return 'Dummy Data Generator'
}

/** Tells whichever shell is hosting the page that the location changed. */
export function setLocation(relativePath: string, title: string): void {
    if (window.self !== window.top) {
        // Inside Polaris: the frame owns the address bar and the breadcrumb.
        ;(window as unknown as { CustomEvent: { fireTop(name: string, detail: unknown): void } }).CustomEvent.fireTop(
            'magellanNavigator.permalink.set',
            { relativePath, title },
        )
    }

    // Still pushed in both cases: inside the frame this is what makes the
    // browser's own back button step through the app's views.
    window.history.pushState({}, '', relativePath)
    document.title = title
}
