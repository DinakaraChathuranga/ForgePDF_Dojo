const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    mergePDFs: (filePaths) => ipcRenderer.invoke('merge-pdfs', filePaths),
    compressPDF: (filePath) => ipcRenderer.invoke('compress-pdf', filePath),
    protectPDF: (filePath, password) => ipcRenderer.invoke('protect-pdf', filePath, password),
    splitPDF: (filePath, pageRanges) => ipcRenderer.invoke('split-pdf', filePath, pageRanges),
    rotatePDF: (filePath, angle) => ipcRenderer.invoke('rotate-pdf', filePath, angle),

    // You can add the update check here if you still need it
    checkForUpdate: () => { 
        console.log("Update check placeholder");
        return Promise.resolve({ isNewVersion: false });
    }
});
