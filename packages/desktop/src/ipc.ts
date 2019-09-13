import { app, dialog, ipcMain, Notification } from 'electron'

import { ItemPushNotification } from '@devhub/core'
import * as config from './config'
import * as constants from './constants'
import { getDock } from './dock'
import * as helpers from './helpers'
import { playAudioFile } from './libs/play-sound'
import * as tray from './tray'
import * as window from './window'

export function register() {
  ipcMain.setMaxListeners(50)

  ipcMain.removeAllListeners('can-open-url')
  ipcMain.addListener('can-open-url', (e: any, uri?: string) => {
    let returnValue = false

    if (!(e && uri && typeof uri === 'string')) returnValue = false
    else if (uri.startsWith('http://') || uri.startsWith('https://'))
      returnValue = true
    else if (uri.startsWith(`${constants.shared.APP_DEEP_LINK_SCHEMA}://`))
      returnValue = helpers.isDefaultAppSchema()

    e.returnValue = returnValue
  })

  ipcMain.removeAllListeners('open-url')
  ipcMain.addListener('open-url', (_e: any, uri?: string) => {
    const mainWindow = window.getMainWindow()
    if (!mainWindow) return

    if (
      !(
        uri &&
        typeof uri === 'string' &&
        uri.startsWith(`${constants.shared.APP_DEEP_LINK_SCHEMA}://`)
      )
    )
      return

    mainWindow.webContents.send('open-url', uri)
  })

  ipcMain.removeAllListeners('post-message')
  ipcMain.addListener('post-message', (_e: any, data: any) => {
    const mainWindow = window.getMainWindow()
    if (!mainWindow) return

    mainWindow.webContents.send('post-message', data)
  })

  ipcMain.removeAllListeners('exit-full-screen')
  ipcMain.addListener('exit-full-screen', () => {
    const mainWindow = window.getMainWindow()
    if (!mainWindow) return
    mainWindow.setFullScreen(false)
  })

  ipcMain.removeAllListeners('unread-counter')
  ipcMain.addListener(
    'unread-counter',
    async (_e: any, unreadCount: number) => {
      tray.updateUnreadState(unreadCount)

      const dock = getDock()

      if (dock) dock.setBadge(unreadCount > 0 ? `${unreadCount}` : '')
    },
  )

  ipcMain.removeAllListeners('get-all-settings')
  ipcMain.addListener('get-all-settings', async (e: any) => {
    if (!e) return

    e.returnValue = {
      enablePushNotifications: config.store.get('enablePushNotifications'),
      enablePushNotificationsSound: config.store.get(
        'enablePushNotificationsSound',
      ),
      isMenuBarMode: config.store.get('isMenuBarMode'),
      lockOnCenter: config.store.get('lockOnCenter'),
      openAtLogin: config.store.get('openAtLogin'),
    }
  })

  ipcMain.removeAllListeners('update-settings')
  ipcMain.addListener(
    'update-settings',
    async (_e: any, payload: Parameters<typeof emit>[1]) => {
      const settings = payload && payload.settings
      const value = payload && payload.value

      const mainWindow = window.getMainWindow()

      switch (settings) {
        case 'enablePushNotifications': {
          config.store.set('enablePushNotifications', value)
          if (value && config.store.get('enablePushNotificationsSound'))
            playAudioFile(constants.notificationSoundPath)
          break
        }

        case 'enablePushNotificationsSound': {
          config.store.set('enablePushNotificationsSound', value)

          if (value) playAudioFile(constants.notificationSoundPath)

          break
        }

        case 'isMenuBarMode': {
          if (value) {
            config.store.set('isMenuBarMode', true)

            if (mainWindow.isFullScreen()) {
              mainWindow.setFullScreen(false)
              setTimeout(window.updateOrRecreateWindow, 1000)
            } else {
              window.updateOrRecreateWindow()
            }
          } else {
            config.store.set('isMenuBarMode', false)

            if (mainWindow.isFullScreen()) {
              mainWindow.setFullScreen(false)
              setTimeout(window.updateOrRecreateWindow, 1000)
            } else {
              window.updateOrRecreateWindow()
            }
          }
          break
        }

        case 'lockOnCenter': {
          config.store.set('lockOnCenter', value)

          if (value) {
            if (!config.store.get('isMenuBarMode')) {
              mainWindow.setMovable(false)
            }

            window.center(mainWindow)
          } else {
            if (!config.store.get('isMenuBarMode')) {
              mainWindow.setMovable(
                window.getBrowserWindowOptions().movable !== false,
              )
            }
          }
          break
        }

        case 'openAtLogin': {
          const openAtLoginChangeCount =
            ((config.store.get('openAtLoginChangeCount') as number) || 0) + 1

          config.store.set('openAtLoginChangeCount', openAtLoginChangeCount)

          app.setLoginItemSettings({
            openAtLogin: value,
            openAsHidden: openAtLoginChangeCount > 1,
          })
          break
        }
      }

      mainWindow.webContents.send('update-settings', payload)
    },
  )

  ipcMain.removeAllListeners('show-notification')
  ipcMain.addListener(
    'show-notification',
    async (_e: any, payload: ItemPushNotification) => {
      if (!payload) {
        console.error('[show-notification] Invalid payload.', payload)
        return
      }

      if (config.store.get('enablePushNotifications') === false) {
        return
      }

      const { title, subtitle, body, imageURL } = payload

      let icon
      try {
        if (imageURL) icon = await helpers.imageURLToNativeImage(imageURL)
      } catch (error) {
        console.error(error)
        dialog.showMessageBox(window.getMainWindow(), { message: `${error}` })
      }

      const notification = new Notification({
        title,
        subtitle,
        body,
        icon,
        silent: true,
      })

      if (payload.onClickDispatchAction) {
        notification.addListener('click', e => {
          e.preventDefault()

          window
            .getMainWindow()
            .webContents.send('redux', payload.onClickDispatchAction)
        })
      }

      notification.show()

      if (config.store.get('enablePushNotificationsSound') !== false) {
        playAudioFile(constants.notificationSoundPath)
      }
    },
  )
}

export function emit(
  event: 'update-settings',
  payload: {
    settings:
      | 'enablePushNotifications'
      | 'enablePushNotificationsSound'
      | 'isMenuBarMode'
      | 'lockOnCenter'
      | 'openAtLogin'
    value: boolean
  },
): void
export function emit(event: string, payload: any): void {
  ipcMain.emit(event, null, payload)
}
