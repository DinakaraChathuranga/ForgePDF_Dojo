const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // PDF modification APIs
    mergePDFs: (filePaths) => ipcRenderer.invoke('merge-pdfs', filePaths),
    compressPDF: (filePath) => ipcRenderer.invoke('compress-pdf', filePath),
    protectPDF: (filePath, password) => ipcRenderer.invoke('protect-pdf', filePath, password),

    // APIs for the Edit & Organize workspace
    getPdfPreview: (filePath, pageNum) => ipcRenderer.invoke('get-pdf-preview', filePath, pageNum),
    organizePDF: (filePath, pageOrder, pagesToDelete) => ipcRenderer.invoke('organize-pdf', filePath, pageOrder, pagesToDelete),
    splitPDF: (filePath, ranges) => ipcRenderer.invoke('split-pdf', filePath, ranges),
    rotatePDF: (filePath, rotationsJson) => ipcRenderer.invoke('rotate-pdf', filePath, rotationsJson),
    
    // REMOVED pdfToImage and imageToPdf
    imageToPDF: (imagePaths) => ipcRenderer.invoke('image-to-pdf', imagePaths),
    extractPdfText: (filePath) => ipcRenderer.invoke('extract-pdf-text', filePath),
    replacePdfText: (filePath, replacementsJson) => ipcRenderer.invoke('replace-pdf-text', filePath, replacementsJson),
});