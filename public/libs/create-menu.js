const {
  Menu,
  clipboard,
  ipcMain,
  shell,
} = require('electron');

const aboutWindow = require('../windows/about');
const addWorkspaceWindow = require('../windows/add-workspace');
const codeInjectionWindow = require('../windows/code-injection');
const customUserAgentWindow = require('../windows/custom-user-agent');
const displayMediaWindow = require('../windows/display-media');
const editWorkspaceWindow = require('../windows/edit-workspace');
const licenseRegistrationWindow = require('../windows/license-registration');
const mainWindow = require('../windows/main');
const notificationsWindow = require('../windows/notifications');
const preferencesWindow = require('../windows/preferences');

const { getPreference } = require('./preferences');
const formatBytes = require('./format-bytes');

const {
  getWorkspaces,
  getActiveWorkspace,
  getNextWorkspace,
  getPreviousWorkspace,
} = require('./workspaces');

const {
  setActiveWorkspaceView,
  removeWorkspaceView,
} = require('./workspaces-views');

const {
  getView,
} = require('./views');

const FIND_IN_PAGE_HEIGHT = 42;

function createMenu() {
  const registered = getPreference('registered');
  const updaterEnabled = process.env.SNAP == null && !process.mas && !process.windowsStore;

  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            const win = mainWindow.get();
            if (win) {
              win.send('open-find-in-page');

              const contentSize = win.getContentSize();
              const view = win.getBrowserView();

              const offsetTitlebar = process.platform !== 'darwin' || global.showSidebar || global.attachToMenubar ? 0 : 22;
              const x = global.showSidebar ? 68 : 0;
              const y = global.showNavigationBar ? 36 + offsetTitlebar : 0 + offsetTitlebar;

              view.setBounds({
                x,
                y: y + FIND_IN_PAGE_HEIGHT,
                height: contentSize[1] - y - FIND_IN_PAGE_HEIGHT,
                width: contentSize[0] - x,
              });
            }
          },
        },
        {
          label: 'Find Next',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            const win = mainWindow.get();
            win.send('request-back-find-in-page', true);
          },
        },
        {
          label: 'Find Previous',
          accelerator: 'Shift+CmdOrCtrl+G',
          click: () => {
            const win = mainWindow.get();
            win.send('request-back-find-in-page', false);
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Show Sidebar',
          type: 'checkbox',
          checked: global.showSidebar,
          accelerator: 'CmdOrCtrl+Alt+S',
          click: () => {
            ipcMain.emit('request-set-preference', null, 'sidebar', !global.showSidebar);
            ipcMain.emit('request-realign-active-workspace');
          },
        },
        {
          label: 'Show Navigation Bar',
          type: 'checkbox',
          checked: global.showNavigationBar,
          accelerator: 'CmdOrCtrl+Alt+N',
          click: () => {
            ipcMain.emit('request-set-preference', null, 'navigationBar', !global.showNavigationBar);
            ipcMain.emit('request-realign-active-workspace');
          },
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            const win = mainWindow.get();

            if (win != null) {
              const contents = win.getBrowserView().webContents;
              contents.setZoomFactor(1);
            }
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            const win = mainWindow.get();

            if (win != null) {
              const contents = win.getBrowserView().webContents;
              contents.getZoomFactor((zoomFactor) => {
                contents.setZoomFactor(zoomFactor + 0.1);
              });
            }
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const win = mainWindow.get();

            if (win != null) {
              const contents = win.getBrowserView().webContents;
              contents.getZoomFactor((zoomFactor) => {
                contents.setZoomFactor(zoomFactor - 0.1);
              });
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Reload This Workspace',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            const win = mainWindow.get();

            if (win != null) {
              win.getBrowserView().webContents.reload();
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Developer Tools',
          submenu: [
            {
              label: 'Main Window',
              click: () => {
                const win = mainWindow.get();
                if (win != null) {
                  if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                  } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                  }
                }
              },
            },
            {
              label: 'About Window',
              click: () => {
                const win = aboutWindow.get();
                if (win != null) {
                  if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                  } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                  }
                }
              },
            },
            {
              label: 'Preferences Window',
              click: () => {
                const win = preferencesWindow.get();
                if (win != null) {
                  if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                  } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                  }
                }
              },
            },
            {
              label: 'Code Injection Window',
              click: () => {
                const win = codeInjectionWindow.get();
                if (win != null) {
                  if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                  } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                  }
                }
              },
            },
            {
              label: 'Custom User Agent Window',
              click: () => {
                const win = customUserAgentWindow.get();
                if (win != null) {
                  if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                  } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                  }
                }
              },
            },
            {
              label: 'Add Workspace Window',
              click: () => {
                const win = addWorkspaceWindow.get();
                if (win != null) {
                  if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                  } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                  }
                }
              },
            },
            {
              label: 'Edit Workspace Window',
              click: () => {
                const win = editWorkspaceWindow.get();
                if (win != null) {
                  if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                  } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                  }
                }
              },
            },
            {
              label: 'Notifications Window',
              click: () => {
                const win = notificationsWindow.get();
                if (win != null) {
                  if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                  } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                  }
                }
              },
            },
            {
              label: 'Display Media Window',
              click: () => {
                const win = displayMediaWindow.get();
                if (win != null) {
                  if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                  } else {
                    win.webContents.openDevTools({ mode: 'detach' });
                  }
                }
              },
            },
            { type: 'separator' },
          ],
        },
      ],
    },
    {
      label: 'History',
      submenu: [
        {
          label: 'Home',
          accelerator: 'Shift+CmdOrCtrl+H',
          click: () => ipcMain.emit('request-go-home'),
        },
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click: () => ipcMain.emit('request-go-back'),
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: () => ipcMain.emit('request-go-forward'),
        },
        { type: 'separator' },
        {
          label: 'Copy URL',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            const win = mainWindow.get();

            if (win != null) {
              const url = win.getBrowserView().webContents.getURL();
              clipboard.writeText(url);
            }
          },
        },
      ],
    },
    {
      label: 'Workspaces',
      submenu: [],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Singlebox Support',
          click: () => shell.openExternal('https://singleboxapp.com/support'),
        },
        {
          label: 'Report a Bug via GitHub...',
          click: () => shell.openExternal('https://github.com/quanglam2807/singlebox/issues'),
        },
        {
          label: 'Request a New Feature via GitHub...',
          click: () => shell.openExternal('https://github.com/quanglam2807/singlebox/issues/new?template=feature.md&title=feature%3A+'),
        },
        {
          label: 'Submit New App to Catalog...',
          click: () => shell.openExternal('https://github.com/quanglam2807/singlebox/issues/new?template=app.md&title=app%3A+'),
        },
        {
          label: 'Learn More...',
          click: () => shell.openExternal('https://singleboxapp.com'),
        },
      ],
    },
  ];

  const updaterMenuItem = {
    label: 'Check for Updates...',
    click: () => ipcMain.emit('request-check-for-updates'),
    visible: updaterEnabled,
  };
  if (global.updaterObj && global.updaterObj.status === 'update-downloaded') {
    updaterMenuItem.label = 'Restart to Apply Updates...';
  } else if (global.updaterObj && global.updaterObj.status === 'update-available') {
    updaterMenuItem.label = 'Downloading Updates...';
    updaterMenuItem.enabled = false;
  } else if (global.updaterObj && global.updaterObj.status === 'download-progress') {
    const { transferred, total, bytesPerSecond } = global.updaterObj.info;
    updaterMenuItem.label = `Downloading Updates (${formatBytes(transferred)}/${formatBytes(total)} at ${formatBytes(bytesPerSecond)}/s)...`;
    updaterMenuItem.enabled = false;
  } else if (global.updaterObj && global.updaterObj.status === 'checking-for-update') {
    updaterMenuItem.label = 'Checking for Updates...';
    updaterMenuItem.enabled = false;
  }

  if (process.platform === 'darwin') {
    template.unshift({
      label: 'Singlebox',
      submenu: [
        {
          label: 'About Singlebox',
          click: () => aboutWindow.show(),
        },
        { type: 'separator' },
        {
          label: registered ? 'Registered' : 'Registration...',
          enabled: !registered,
          click: registered ? null : () => licenseRegistrationWindow.show(),
        },
        { type: 'separator' },
        updaterMenuItem,
        { type: 'separator' },
        {
          label: 'Preferences...',
          click: () => preferencesWindow.show(),
        },
        { type: 'separator' },
        {
          label: 'Notifications...',
          click: () => notificationsWindow.show(),
        },
        { type: 'separator' },
        {
          label: 'Clear Browsing Data...',
          click: () => ipcMain.emit('request-clear-browsing-data'),
        },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  } else {
    template.unshift({
      label: 'File',
      submenu: [
        {
          label: 'About',
          click: () => aboutWindow.show(),
        },
        { type: 'separator' },
        {
          label: registered ? 'Registered' : 'Registration...',
          enabled: !registered,
          click: registered ? null : () => licenseRegistrationWindow.show(),
        },
        { type: 'separator' },
        updaterMenuItem,
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => preferencesWindow.show(),
        },
        { type: 'separator' },
        {
          label: 'Notifications...',
          click: () => notificationsWindow.show(),
        },
        { type: 'separator' },
        {
          label: 'Clear Browsing Data...',
          accelerator: 'CmdOrCtrl+Shift+Delete',
          click: () => ipcMain.emit('request-clear-browsing-data'),
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' },
      ],
    });
  }

  Object.values(getWorkspaces())
    .sort((a, b) => a.order - b.order)
    .forEach((workspace, i) => {
      template[4].submenu.push({
        label: workspace.name || `Workspace ${i + 1}`,
        type: 'checkbox',
        checked: workspace.active,
        click: () => {
          setActiveWorkspaceView(workspace.id);
          createMenu();
        },
        accelerator: `CmdOrCtrl+${i + 1}`,
      });

      template[2].submenu[template[2].submenu.length - 1].submenu.push({
        label: workspace.name || `Workspace ${i + 1}`,
        click: () => {
          const v = getView(workspace.id);
          v.webContents.toggleDevTools();
        },
      });
    });

  template[4].submenu.push(
    { type: 'separator' },
    {
      label: 'Select Next Workspace',
      click: () => {
        const currentActiveWorkspace = getActiveWorkspace();
        const nextWorkspace = getNextWorkspace(currentActiveWorkspace.id);
        setActiveWorkspaceView(nextWorkspace.id);
        createMenu();
      },
      accelerator: 'CmdOrCtrl+Shift+]',
    },
    {
      label: 'Select Previous Workspace',
      click: () => {
        const currentActiveWorkspace = getActiveWorkspace();
        const previousWorkspace = getPreviousWorkspace(currentActiveWorkspace.id);
        setActiveWorkspaceView(previousWorkspace.id);
        createMenu();
      },
      accelerator: 'CmdOrCtrl+Shift+[',
    },
    { type: 'separator' },
    {
      label: 'Edit Current Workspace',
      click: () => {
        const activeWorkspace = getActiveWorkspace();
        editWorkspaceWindow.show(activeWorkspace.id);
      },
    },
    {
      label: 'Remove Current Workspace',
      click: () => {
        const activeWorkspace = getActiveWorkspace();
        removeWorkspaceView(activeWorkspace.id);
        createMenu();
      },
    },
    { type: 'separator' },
    {
      label: 'Add Workspace',
      click: () => {
        addWorkspaceWindow.show();
      },
    },
  );

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = createMenu;
