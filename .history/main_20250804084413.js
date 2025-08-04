const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// ... (getScriptPath and runPythonScript functions remain the same)

// --- IPC Handlers ---

// ... (existing handlers for merge, compress, protect, split, rotate)

ipcMain.handle('organize-pdf', (event, filePath, pageOrder, pagesToDelete) => 
    handleFileOperation('organized', 'organize.py', filePath, pageOrder.join(','), pagesToDelete.join(','))
);

ipcMain.handle('pdf-to-image', async (event, filePath) => {
    const { filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (!filePaths || filePaths.length === 0) return { success: false, message: 'No output directory selected.' };
    
    return runPythonScript('pdf_to_image.py', [filePath, filePaths[0]]);
});

ipcMain.handle('image-to-pdf', async (event, imagePaths) => {
    const defaultPath = 'converted_images.pdf';
    const { filePath } = await dialog.showSaveDialog({ defaultPath });
    if (!filePath) return { success: false, message: 'Save cancelled.' };
    
    return runPythonScript('image_to_pdf.py', [imagePaths.join(','), filePath]);
});