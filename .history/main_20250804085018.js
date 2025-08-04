const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// Function to get the correct path to the python executable
function getPythonPath() {
    const isDev = process.env.NODE_ENV !== 'production';
    if (process.platform === 'win32') {
        return isDev ? 'python' : path.join(process.resourcesPath, 'python', 'python.exe');
    }
    return isDev ? 'python3' : path.join(process.resourcesPath, 'python', 'bin', 'python3');
}

// Function to get the correct path to the python script
function getScriptPath(scriptName) {
    const isDev = process.env.NODE_ENV !== 'production';
    return isDev ? path.join(__dirname, 'backend', scriptName) : path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', scriptName);
}

// Function to run a python script and return the result as a promise
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
                    reject({ success: false, message: 'Failed to parse python script output.' });
                }
            } else {
                reject({ success: false, message: `Python script exited with code ${code}: ${error}` });
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
    });
    win.loadFile(path.join(__dirname, 'frontend', 'index.html'));
};

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers ---

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

ipcMain.handle('split-pdf', async (event, filePath, ranges) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `split_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('split.py', [filePath, ranges, savePath]);
});

ipcMain.handle('rotate-pdf', async (event, filePath, angle) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `rotated_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('rotate.py', [filePath, angle, savePath]);
});

ipcMain.handle('get-pdf-preview', async (event, filePath, pageNum) => {
    try {
        const previewDir = path.join(app.getPath('temp'), 'pdf_previews');
        if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir);

        const result = await runPythonScript('preview.py', [filePath, pageNum, previewDir]);
        if (result.success) {
            return result;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// --- NEW IPC HANDLERS ---
ipcMain.handle('organize-pdf', async (event, filePath, pageOrder, pagesToDelete) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `organized_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('organize.py', [filePath, pageOrder.join(','), pagesToDelete.join(','), savePath]);
});

ipcMain.handle('pdf-to-image', async (event, filePath) => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Select Output Directory',
        properties: ['openDirectory']
    });
    if (!filePaths || filePaths.length === 0) return { success: false, message: 'No output directory selected.' };
    return runPythonScript('pdf_to_image.py', [filePath, filePaths[0]]);
});

ipcMain.handle('image-to-pdf', async (event, imagePaths) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', 'converted_from_images.pdf');
    const { filePath } = await dialog.showSaveDialog({ defaultPath });
    if (!filePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('image_to_pdf.py', [imagePaths.join(','), filePath]);
});