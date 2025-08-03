const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    mergePDFs: (filePaths) => ipcRenderer.invoke('pdf:merge', filePaths),
    compressPDF: (filePath) => ipcRenderer.invoke('pdf:compress', filePath),
    protectPDF: (filePath, password) => ipcRenderer.invoke('pdf:protect', filePath, password),
    checkForUpdate: () => ipcRenderer.invoke('app:check-update'),
    on: (channel, callback) => {
        const validChannels = ['update-notification'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },
});
