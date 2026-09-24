/**
 * React bootstrap.
 *
 * The SDK's rollup pipeline bundles this file; there is no webpack or vite
 * config and there should not be one. The stylesheet it imports is Tailwind's
 * compiled output — `tools/build-css.mjs` writes it before this is bundled,
 * because the pipeline understands plain CSS and nothing more.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'
import './generated/app.css'

const root = document.getElementById('root')
if (root) ReactDOM.createRoot(root).render(<App />)
