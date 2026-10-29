const path = require('node:path')
const { app, BrowserWindow, Menu, session, shell } = require('electron')
const { parseStartUrl, isAllowedUrl } = require('./url')

const APP_ID = 'top.lime-store.client'
const startUrl = parseStartUrl(process.argv)
const icon = path.join(__dirname, '..', 'build', 'icon.png')
const webPreferences = { contextIsolation: true, nodeIntegration: false, sandbox: true }

let mainWindow = null

function openMainWindow () {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: '#ffffff',
    icon,
    webPreferences
  })
  mainWindow.loadURL(startUrl.href)
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => { mainWindow = null })
}

function focusedContents () {
  return BrowserWindow.getFocusedWindow()?.webContents ?? mainWindow?.webContents
}

/** Выход за пределы своего домена — в системный браузер, а не внутри окна. */
function openExternal (url) {
  if (url.startsWith('http:') || url.startsWith('https:')) shell.openExternal(url)
}

function buildMenu () {
  return Menu.buildFromTemplate([
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Печать',
          accelerator: 'CmdOrCtrl+P',
          click: () => focusedContents()?.print({ silent: false })
        },
        { type: 'separator' },
        { label: 'Выход', accelerator: 'Alt+F4', role: 'quit' }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { label: 'Назад', accelerator: 'Alt+Left', click: () => {
          const contents = focusedContents()
          if (contents?.navigationHistory.canGoBack()) contents.navigationHistory.goBack()
        } },
        { label: 'Обновить', accelerator: 'CmdOrCtrl+R', click: () => focusedContents()?.reload() }
      ]
    }
  ])
}

function guardContents (contents) {
  contents.setWindowOpenHandler(({ url }) => {
    // Печать идёт через window.open('', '_blank') + document.write: окно должно быть настоящим.
    if (url === 'about:blank' || isAllowedUrl(url, startUrl)) {
      return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, icon, webPreferences } }
    }
    openExternal(url)
    return { action: 'deny' }
  })

  const keepInside = (event, url) => {
    if (isAllowedUrl(url, startUrl)) return
    event.preventDefault()
    openExternal(url)
  }
  contents.on('will-navigate', keepInside)
  contents.on('will-redirect', keepInside)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.setAppUserModelId(APP_ID)

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.on('web-contents-created', (_event, contents) => guardContents(contents))

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
    Menu.setApplicationMenu(buildMenu())
    openMainWindow()
  })

  app.on('window-all-closed', () => app.quit())
}
