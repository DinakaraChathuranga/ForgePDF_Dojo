const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');
const { execSync } = require('child_process');

let mainWindow;
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        title: 'PDF Toolkit',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile('frontend/index.html');
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function getPythonPath() {
    // Attempt to read a configured path
    try {
        const cfgPath = path.join(app.getAppPath(), 'config', 'settings.json');
        if (fs.existsSync(cfgPath)) {
            const { pythonPath } = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
            if (pythonPath && fs.existsSync(pythonPath)) {
                return pythonPath;
            }
        }
    } catch (err) {
        console.warn('Failed to read python path from config:', err);
    }

    // Check for a bundled interpreter
    const bundled = path.join(process.resourcesPath, 'python', process.platform === 'win32' ? 'python.exe' : 'bin/python3');
    if (fs.existsSync(bundled)) {
        return bundled;
    }

    // Try environment variable
    if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
        return process.env.PYTHON_PATH;
    }

    // Fall back to system python if available
    try {
        const command = process.platform === 'win32'
            ? 'where python'
            : 'which python3 || which python';
        const which = execSync(command, { encoding: 'utf-8' })
            .split(/\r?\n/)[0]
            .trim();
        if (which) {
            return which;
        }
    } catch (err) {
        // ignore
    }

    return null;
}

async function runPythonScript(scriptName, args) {
    const pythonExe = getPythonPath();
    if (!pythonExe) {
        const message = 'Python interpreter not found. Please install Python or set the pythonPath in config/settings.json.';
        console.error(message);
        return { success: false, message };
    }

    const scriptFolder = path.join(app.getAppPath(), 'backend');
    const options = {
        mode: 'json',
        pythonPath: pythonExe,
        scriptPath: scriptFolder,
        args: args,
    };
    try {
        const results = await PythonShell.run(scriptName, options);
        return results[0];
    } catch (err) {
        console.error(`Error running ${scriptName}:`, err);
        return { success: false, message: `An internal error occurred: ${err.message}` };
    }
}

ipcMain.handle('pdf:merge', async (event, filePaths) => {
    const { filePath, canceled } = await dialog.showSaveDialog({ title: 'Save Merged PDF', buttonLabel: 'Save', defaultPath: `merged-${Date.now()}.pdf`, filters: [{ name: 'PDFs', extensions: ['pdf'] }] });
    if (canceled || !filePath) return { success: false, message: 'Save operation canceled.' };
    return await runPythonScript('merge.py', [JSON.stringify(filePaths), filePath]);
});

ipcMain.handle('pdf:compress', async (event, filePath) => {
    const defaultPath = filePath.replace('.pdf', '-compressed.pdf');
    const { filePath: outputPath, canceled } = await dialog.showSaveDialog({ title: 'Save Compressed PDF', buttonLabel: 'Save', defaultPath: defaultPath, filters: [{ name: 'PDFs', extensions: ['pdf'] }] });
    if (canceled || !outputPath) return { success: false, message: 'Save operation canceled.' };
    return await runPythonScript('compress.py', [filePath, outputPath]);
});

ipcMain.handle('pdf:protect', async (event, filePath, password) => {
    const defaultPath = filePath.replace('.pdf', '-protected.pdf');
    const { filePath: outputPath, canceled } = await dialog.showSaveDialog({ title: 'Save Protected PDF', buttonLabel: 'Save', defaultPath: defaultPath, filters: [{ name: 'PDFs', extensions: ['pdf'] }] });
    if (canceled || !outputPath) return { success: false, message: 'Save operation canceled.' };
    return await runPythonScript('protect.py', [filePath, outputPath, password]);
});

ipcMain.handle('pdf:watermark', async (event, filePath, options) => {
    const defaultPath = filePath.replace('.pdf', '-watermarked.pdf');
    const { filePath: outputPath, canceled } = await dialog.showSaveDialog({ title: 'Save Watermarked PDF', buttonLabel: 'Save', defaultPath: defaultPath, filters: [{ name: 'PDFs', extensions: ['pdf'] }] });
    if (canceled || !outputPath) return { success: false, message: 'Save operation canceled.' };
    return await runPythonScript('watermark.py', [filePath, outputPath, JSON.stringify(options)]);
});

ipcMain.handle('app:check-update', async () => {
    const updateUrl = 'https://your-domain.com/path/to/update.json';
    return await runPythonScript('notify.py', [updateUrl]);
});

module.exports = { getPythonPath, runPythonScript };
