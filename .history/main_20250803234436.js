const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// --- Helper to get the correct path for bundled or dev environment ---
function getScriptPath(scriptName) {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'backend', scriptName);
    }
    return path.join(__dirname, 'backend', scriptName);
}

// --- Generic Python script runner ---
function runPythonScript(scriptName, args) {
    return new Promise((resolve) => {
        const scriptPath = getScriptPath(scriptName);
        const pythonProcess = spawn('python', [scriptPath, ...args]);

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            // Resolve with an error message if stderr produces data
            resolve({ success: false, message: `Script error: ${data}` });
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0 && output === '') {
                resolve({ success: false, message: `Python script exited with code ${code}` });
                return;
            }
            try {
                // The output from python is a string, needs to be parsed
                const result = JSON.parse(output.replace(/'/g, '"'));
                resolve(result);
            } catch (e) {
                resolve({ success: false, message: 'Failed to parse Python script output.' });
            }
        });
    });
}


function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.loadFile('frontend/index.html');
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


// --- IPC Handlers ---

async function handleFileOperation(operation, scriptName, ...args) {
    const defaultPath = `result_${operation}.pdf`;
    const { filePath } = await dialog.showSaveDialog({ defaultPath });
    if (!filePath) return { success: false, message: 'Save cancelled.' };
    
    return runPythonScript(scriptName, [...args, filePath]);
}

ipcMain.handle('merge-pdfs', (event, filePaths) => 
    handleFileOperation('merged', 'merge.py', filePaths.join(','))
);

ipcMain.handle('compress-pdf', (event, filePath) => 
    handleFileOperation('compressed', 'compress.py', filePath)
);

ipcMain.handle('protect-pdf', (event, filePath, password) => 
    handleFileOperation('protected', 'protect.py', filePath, password)
);

ipcMain.handle('split-pdf', (event, filePath, pageRanges) => 
    handleFileOperation('split', 'split.py', filePath, pageRanges)
);

ipcMain.handle('rotate-pdf', (event, filePath, angle) => 
    handleFileOperation('rotated', 'rotate.py', filePath, angle)
);