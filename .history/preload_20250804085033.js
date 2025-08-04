const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    mergePDFs: (filePaths) => ipcRenderer.invoke('merge-pdfs', filePaths),
    compressPDF: (filePath) => ipcRenderer.invoke('compress-pdf', filePath),
    protectPDF: (filePath, password) => ipcRenderer.invoke('protect-pdf', filePath, password),
    splitPDF: (filePath, ranges) => ipcRenderer.invoke('split-pdf', filePath, ranges),
    rotatePDF: (filePath, angle) => ipcRenderer.invoke('rotate-pdf', filePath, angle),
    getPdfPreview: (filePath, pageNum) => ipcRenderer.invoke('get-pdf-preview', filePath, pageNum),
    
    // New APIs
    organizePDF: (filePath, pageOrder, pagesToDelete) => ipcRenderer.invoke('organize-pdf', filePath, pageOrder, pagesToDelete),
    pdfToImage: (filePath) => ipcRenderer.invoke('pdf-to-image', filePath),
    imageToPdf: (imagePaths) => ipcRenderer.invoke('image-to-pdf', imagePaths),
});