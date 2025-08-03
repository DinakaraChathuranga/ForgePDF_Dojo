const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');

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

async function runPythonScript(scriptName, args) {
    const pythonExe = 'python';
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
