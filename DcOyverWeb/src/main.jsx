import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Console'u temizle - hiçbir log veya hata gösterilmesin
const noop = () => {}
Object.defineProperty(window, 'console', {
  value: {
    log: noop,
    warn: noop,
    error: noop,
    info: noop,
    debug: noop,
    trace: noop,
    dir: noop,
    dirxml: noop,
    group: noop,
    groupCollapsed: noop,
    groupEnd: noop,
    time: noop,
    timeEnd: noop,
    timeStamp: noop,
    profile: noop,
    profileEnd: noop,
    count: noop,
    clear: noop,
    assert: noop,
    table: noop,
    exception: noop,
    markTimeline: noop,
    timeline: noop,
    timelineEnd: noop
  },
  writable: false,
  configurable: false
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
