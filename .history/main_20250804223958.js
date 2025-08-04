const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

/**
 * Gets the correct path to the Python executable, handling packaged vs. dev environments.
 */
function getPythonPath() {
    const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;
    if (process.platform === 'win32') {
        return isDev ? 'python' : path.join(process.resourcesPath, 'python', 'python.exe');
    }
    return isDev ? 'python3' : path.join(process.resourcesPath, 'python', 'bin', 'python3');
}

/**
 * Gets the correct path to a backend Python script.
 */
function getScriptPath(scriptName) {
    const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;
    if (isDev) {
        return path.join(__dirname, 'backend', scriptName);
    }
    // In a packaged app, scripts are in the 'app.asar.unpacked' directory
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', scriptName);
}

/**
 * Runs a Python script with given arguments and returns a Promise with the JSON output.
 * @param {string} scriptName The name of the script in the 'backend' folder.
 * @param {string[]} args An array of command-line arguments for the script.
 * @returns {Promise<object>} A promise that resolves with the parsed JSON output from the script.
 */
function runPythonScript(scriptName, args) {
    return new Promise((resolve, reject) => {
        const pythonPath = getPythonPath();
        const scriptPath = getScriptPath(scriptName);
        const pythonProcess = spawn(pythonPath, [scriptPath, ...args]);

        let result = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    reject({ success: false, message: `Failed to parse Python script output: ${e.message}` });
                }
            } else {
                console.error(`Python script ${scriptName} exited with code ${code}. Stderr: ${error}`);
                reject({ success: false, message: `Python script error: ${error}` });
            }
        });
    });
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 940,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, 'frontend', 'assets', 'logo.png'),
        title: "ForgePDF Dojo"
    });

    win.loadFile(path.join(__dirname, 'frontend', 'index.html'));
};

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

// --- IPC Handlers for PDF Operations ---

ipcMain.handle('get-pdf-preview', async (event, filePath, pageNum) => {
    try {
        const previewDir = path.join(app.getPath('temp'), 'pdf_previews');
        if (!fs.existsSync(previewDir)) {
            fs.mkdirSync(previewDir, { recursive: true });
        }
        return await runPythonScript('preview.py', [filePath, pageNum, previewDir]);
    } catch (error) {
        return { success: false, message: error.message };
    }
});

ipcMain.handle('merge-pdfs', async (event, filePaths) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', 'merged_document.pdf');
    const { filePath } = await dialog.showSaveDialog({ defaultPath });
    if (!filePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('merge.py', [filePaths.join(','), filePath]);
});

ipcMain.handle('compress-pdf', async (event, filePath) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `compressed_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('compress.py', [filePath, savePath]);
});

ipcMain.handle('protect-pdf', async (event, filePath, password) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `protected_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('protect.py', [filePath, password, savePath]);
});

ipcMain.handle('organize-pdf', async (event, filePath, pageOrder, pagesToDelete) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `organized_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('organize_pdf.py', [filePath, pageOrder.join(','), pagesToDelete.join(','), savePath]);
});

ipcMain.handle('split-pdf', async (event, filePath, ranges) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `split_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('split.py', [filePath, ranges, savePath]);
});

ipcMain.handle('rotate-pdf', async (event, filePath, rotationsJson) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `rotated_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('rotate.py', [filePath, rotationsJson, savePath]);
});