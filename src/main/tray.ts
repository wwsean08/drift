import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron'
import { join } from 'path'

let tray: Tray | null = null
let isQuitting = false

export function getIsQuitting(): boolean {
  return isQuitting
}

export function createTray(mainWindow: BrowserWindow): void {
  const iconPath = join(__dirname, '../../resources/trayIcon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('Drift')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Drift',
      click: (): void => {
        mainWindow.show()
        mainWindow.focus()
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

  tray.on('click', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  app.on('before-quit', () => {
    isQuitting = true
  })
}
