const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const next = require('next');
const { createServer } = require('http');

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Fix: Disable Chrome's internet connectivity checks so localhost works offline
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('HostResolverRules', 'MAP * 127.0.0.1');

const isDev = !app.isPackaged;
const port = 4200;
const hostname = '127.0.0.1';

let mainWindow;

// Register custom protocol
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('alkaysan-pos', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('alkaysan-pos');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }

        // Handle deep link on Windows
        const url = commandLine.pop();
        if (url && url.startsWith('alkaysan-pos://')) {
            handleDeepLink(url);
        }
    });

    const nextApp = next({
        dev: isDev,
        dir: __dirname,
        hostname: hostname,
        port: port
    });
    const handle = nextApp.getRequestHandler();

    async function createWindow() {
        await nextApp.prepare();

        const server = createServer((req, res) => {
            handle(req, res);
        });

        server.listen(port, hostname, (err) => {
            if (err) throw err;
            console.log(`> Ready on http://${hostname}:${port}`);
        });

        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });

        const appUrl = `http://${hostname}:${port}`;
        const loadApp = (url, retries = 5) => {
            mainWindow.loadURL(url).catch((err) => {
                console.error(`Failed to load ${url}:`, err.message);
                if (retries > 0) {
                    setTimeout(() => loadApp(url, retries - 1), 1000);
                }
            });
        };
        loadApp(appUrl);

        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            if (errorCode === -3) return;
            if (validatedURL && (validatedURL.startsWith(`http://${hostname}:${port}`) || validatedURL.startsWith('http://localhost:'))) {
                setTimeout(() => {
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.loadURL(validatedURL).catch(() => {});
                    }
                }, 1000);
            }
        });

        if (isDev) {
            mainWindow.webContents.openDevTools();
        }

        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    }

    app.whenReady().then(() => {
        // Initialize Local SQLite Database
        const { initDatabase, setupIpcHandlers } = require('./lib/sqlite');
        try {
            initDatabase();
            setupIpcHandlers();
        } catch (err) {
            console.error('Failed to initialize local database:', err);
        }

        createWindow().catch((err) => {
            console.error('FAILED TO CREATE WINDOW:', err);
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
}

// Global deep link handler
app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
});

function handleDeepLink(url) {
    if (!mainWindow) return;
    mainWindow.webContents.send('deep-link-callback', url);
}

// Additional IPC Handlers
ipcMain.on('open-sso-external', (event, url) => {
    shell.openExternal(url);
});
