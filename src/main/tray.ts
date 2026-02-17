import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron'
import { join } from 'path'
import { getSettings, getQueue } from './store'
import { setPaused } from './queue'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let isQuitting = false

const defaultIconPath = join(__dirname, '../../resources/trayIconDefault.png')
const encodingIconPath = join(__dirname, '../../resources/trayIconEncoding.png')

export function getIsQuitting(): boolean {
  return isQuitting
}

export function rebuildTrayMenu(): void {
  if (!tray || !mainWindow) return

  const settings = getSettings()
  const queue = getQueue()
  const pendingOrEncoding = queue.filter(
    (item) => item.status === 'pending' || item.status === 'encoding'
  )
  const count = pendingOrEncoding.length
  const isEncoding = queue.some((item) => item.status === 'encoding')
  const iconPath = isEncoding ? encodingIconPath : defaultIconPath
  tray.setImage(nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }))
  const win = mainWindow

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Drift',
      click: (): void => {
        win.show()
        win.focus()
      }
    },
    { type: 'separator' },
    {
      label: `${count} item${count === 1 ? '' : 's'} queued`,
      enabled: false
    },
    {
      label: settings.paused ? 'Resume Encoding' : 'Pause Encoding',
      click: (): void => {
        setPaused(!settings.paused)
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: (): void => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

export function createTray(win: BrowserWindow): void {
  const icon = nativeImage.createFromPath(defaultIconPath).resize({ width: 16, height: 16 })

  mainWindow = win
  tray = new Tray(icon)
  tray.setToolTip('Drift')

  rebuildTrayMenu()

  tray.on('click', () => {
    win.show()
    win.focus()
  })

  app.on('before-quit', () => {
    isQuitting = true
  })
}
