// The staged desktop the creature roams across: a wallpaper and two neutral
// app windows. Skeleton lines only — nothing readable, nothing personal.
const { app, BrowserWindow } = require('electron')

const page = (body, bg) =>
  'data:text/html;charset=utf-8,' +
  encodeURIComponent(`<!doctype html><html><body style="margin:0;height:100vh;overflow:hidden;${bg}">${body}</body></html>`)

const titlebar = (label, fg, line) => `
  <div style="height:34px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid ${line};font:500 11px monospace;letter-spacing:.08em;color:${fg}">
    <span style="width:9px;height:9px;border-radius:50%;border:1px solid ${fg};opacity:.5"></span>${label}
  </div>`

const bars = (n, colour, widths) =>
  Array.from({ length: n }, (_, i) =>
    `<div style="height:9px;border-radius:4px;background:${colour};width:${widths[i % widths.length]}%"></div>`
  ).join('')

app.whenReady().then(() => {
  const win = (opts) =>
    new BrowserWindow({ frame: false, focusable: false, skipTaskbar: true, resizable: false, ...opts })

  win({ x: 0, y: 0, width: 1920, height: 1080 }).loadURL(
    page('', 'background: radial-gradient(120% 90% at 24% 12%, #2b2f3a 0%, #171a21 52%, #101218 100%);')
  )

  win({ x: 700, y: 150, width: 620, height: 360 }).loadURL(
    page(
      titlebar('notes', '#8a8578', '#e3ddcf') +
        `<div style="display:flex;flex-direction:column;gap:12px;padding:22px 24px">${bars(11, '#e7e1d2', [62, 84, 74, 91, 55, 78, 68, 88])}</div>`,
      'background:#f4efe2;border:1px solid #d8d2c2;border-radius:10px;'
    )
  )

  win({ x: 780, y: 600, width: 620, height: 380 }).loadURL(
    page(
      titlebar('reader', '#6d7280', '#262a33') +
        `<div style="display:flex;flex-direction:column;gap:11px;padding:20px 22px">${bars(10, '#232833', [70, 88, 58, 80, 92, 64])}</div>`,
      'background:#14161c;border:1px solid #262a33;border-radius:10px;'
    )
  )
})
