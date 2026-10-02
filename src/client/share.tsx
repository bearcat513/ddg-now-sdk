/**
 * The public whiteboard page's bootstrap — `share.html`'s entry point.
 *
 * A separate bundle entry from `main.tsx` so a stranger opening a link
 * downloads the viewer and Excalidraw, not the whole studio. Shared chunks
 * (React, the stylesheet's tokens) are still shared by the build.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { SharedWhiteboard } from './components/app/SharedWhiteboard'
import './generated/app.css'

const root = document.getElementById('root')
if (root) ReactDOM.createRoot(root).render(<SharedWhiteboard />)
