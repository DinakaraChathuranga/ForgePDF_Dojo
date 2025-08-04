const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

/**
 * Gets the correct path to the Python executable.
 * In development, it assumes 'python' or 'python3' is in the system's PATH.
 * In production, it points to the executable bundled with the app.
 * @returns {string} The path to the Python executable.
 */
function getPythonPath() {
    // A simple check for development environment.
    // You might want a more robust check like `!app.isPackaged`.
    const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;
    if (process.platform === 'win32') {
        // In development, use 'python'. In production, find the bundled python.exe.
        return isDev ? 'python' : path.join(process.resourcesPath, 'python', 'python.exe');
    }
    // For macOS and Linux.
    return isDev ? 'python3' : path.join(process.resourcesPath, 'python', 'bin', 'python3');
}

/**
 * Gets the correct path to a Python script.
 * In development, it points to the 'backend' folder in your project root.
 * In production, it points to the script inside the unpacked asar archive.
 * @param {string} scriptName - The name of the script (e.g., 'merge.py').
 * @returns {string} The full path to the Python script.
 */
function getScriptPath(scriptName) {
    const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;
    if (isDev) {
        return path.join(__dirname, 'backend', scriptName);
    }
    // In production, scripts are often in 'app.asar.unpacked' if they need to be accessed as raw files.
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', scriptName);
}

/**
 * Runs a Python script with the given arguments and returns a Promise.
 * @param {string} scriptName - The name of the Python script to run.
 * @param {string[]} args - An array of string arguments to pass to the script.
 * @returns {Promise<object>} A promise that resolves with the JSON output of the script.
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
                    // The script should print a single JSON string to stdout.
                    resolve(JSON.parse(result));
                } catch (e) {
                    reject({ success: false, message: `Failed to parse Python script output: ${e.message}` });
                }
            } else {
                // Log the error for easier debugging from the terminal.
                console.error(`Python script ${scriptName} exited with code ${code}. Stderr: ${error}`);
                reject({ success: false, message: `Python script error: ${error}` });
            }
        });
    });
}

/**
 * Creates the main application window.
 */
const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 940,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Recommended for security
            nodeIntegration: false,   // Recommended for security
        },
        icon: path.join(__dirname, 'frontend', 'assets', 'logo.png'),
        title: "ForgePDF Dojo"
    });

    win.loadFile(path.join(__dirname, 'frontend', 'index.html'));

    // Optional: Open DevTools in development
    // if (process.env.NODE_ENV !== 'production') {
    //     win.webContents.openDevTools();
    // }
};

// --- App Lifecycle ---

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Quit when all windows are closed, except on macOS.
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


// --- IPC Handlers for PDF Operations ---

// Handler to get PDF page previews (single or all)
ipcMain.handle('get-pdf-preview', async (event, filePath, pageNum) => {
    try {
        const previewDir = path.join(app.getPath('temp'), 'pdf_previews');
        // Ensure the temporary directory for previews exists
        if (!fs.existsSync(previewDir)) {
            fs.mkdirSync(previewDir, { recursive: true });
        }
        return await runPythonScript('preview.py', [filePath, pageNum, previewDir]);
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// Handler for Merging PDFs
ipcMain.handle('merge-pdfs', async (event, filePaths) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', 'merged_document.pdf');
    const { filePath } = await dialog.showSaveDialog({ defaultPath });
    if (!filePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('merge.py', [filePaths.join(','), filePath]);
});

// Handler for Compressing a PDF
ipcMain.handle('compress-pdf', async (event, filePath) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `compressed_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('compress.py', [filePath, savePath]);
});

// Handler for Protecting a PDF with a password
ipcMain.handle('protect-pdf', async (event, filePath, password) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `protected_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('protect.py', [filePath, password, savePath]);
});

// Handler for Organizing a PDF (reorder/delete pages)
ipcMain.handle('organize-pdf', async (event, filePath, pageOrder, pagesToDelete) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `organized_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('organize.py', [filePath, pageOrder.join(','), pagesToDelete.join(','), savePath]);
});

// Handler for Splitting a PDF
ipcMain.handle('split-pdf', async (event, filePath, ranges) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `split_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('split.py', [filePath, ranges, savePath]);
});

// Handler for Rotating a PDF
ipcMain.handle('rotate-pdf', async (event, filePath, angle) => {
    const defaultPath = path.join(os.homedir(), 'Downloads', `rotated_${path.basename(filePath)}`);
    const { filePath: savePath } = await dialog.showSaveDialog({ defaultPath });
    if (!savePath) return { success: false, message: 'Save cancelled.' };
    return runPythonScript('rotate.py', [filePath, angle, savePath]);
});