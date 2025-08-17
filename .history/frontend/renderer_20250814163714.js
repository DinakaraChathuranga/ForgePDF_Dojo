// Global logging system
const Logger = {
    logs: [],
    maxLogs: 1000,
    
    log: function(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            page: currentPage || 'unknown',
            userAgent: navigator.userAgent
        };
        
        this.logs.push(logEntry);
        
        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Console output with color coding
        const colors = {
            'INFO': 'color: #0066cc',
            'WARN': 'color: #ff6600',
            'ERROR': 'color: #cc0000',
            'DEBUG': 'color: #666666',
            'SUCCESS': 'color: #00cc00'
        };
        
        console.log(
            `%c[${level}]%c ${timestamp} - ${message}`,
            `font-weight: bold; ${colors[level] || 'color: #000000'}`,
            'color: #000000',
            data ? data : ''
        );
        
        // Also log to localStorage for persistence
        try {
            localStorage.setItem('pdfDojoLogs', JSON.stringify(this.logs));
        } catch (e) {
            console.warn('Could not save logs to localStorage:', e);
        }
    },
    
    info: function(message, data) { this.log('INFO', message, data); },
    warn: function(message, data) { this.log('WARN', message, data); },
    error: function(message, data) { this.log('ERROR', message, data); },
    debug: function(message, data) { this.log('DEBUG', message, data); },
    success: function(message, data) { this.log('SUCCESS', message, data); },
    
    // Export logs for debugging
    exportLogs: function() {
        const logText = this.logs.map(log => 
            `[${log.timestamp}] [${log.level}] ${log.message} ${log.data ? JSON.stringify(log.data) : ''}`
        ).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pdf-dojo-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.success('Logs exported successfully');
    },
    
    // Clear logs
    clearLogs: function() {
        this.logs = [];
        localStorage.removeItem('pdfDojoLogs');
        this.info('Logs cleared');
    }
};

// Load existing logs from localStorage
try {
    const savedLogs = localStorage.getItem('pdfDojoLogs');
    if (savedLogs) {
        Logger.logs = JSON.parse(savedLogs);
        Logger.info('Loaded existing logs from localStorage', { count: Logger.logs.length });
    }
} catch (e) {
    Logger.warn('Could not load logs from localStorage', e);
}

document.addEventListener('DOMContentLoaded', () => {
    Logger.info('Application starting...');
    
    // Initialize Lucide icons
    try {
        lucide.createIcons();
        Logger.success('Lucide icons initialized');
    } catch (e) {
        Logger.error('Failed to initialize Lucide icons', e);
    }

    // Global state
    let currentTab = 'home';
    let currentPage = 'home';

    // Get DOM elements
    const ribbonTabs = document.querySelectorAll('.ribbon-tab');
    const ribbonPanels = document.querySelectorAll('.ribbon-panel');
    const pages = document.querySelectorAll('.page');
    const menuItems = document.querySelectorAll('.nav-item');

    Logger.info('DOM elements found', {
        ribbonTabs: ribbonTabs.length,
        ribbonPanels: ribbonPanels.length,
        pages: pages.length,
        menuItems: menuItems.length
    });

    function switchRibbonTab(tabName) {
        Logger.debug('Switching ribbon tab', { from: currentTab, to: tabName });
        
        // Update ribbon tabs
        ribbonTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update ribbon panels
        ribbonPanels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });

        currentTab = tabName;
        Logger.success('Ribbon tab switched', { tab: tabName });
    }

    function switchPage(pageName) {
        Logger.info('Switching page', { from: currentPage, to: pageName });

        // Update pages
        pages.forEach(page => {
            const wasActive = page.classList.contains('active');
            page.classList.toggle('active', page.id === pageName);
            if (wasActive !== page.classList.contains('active')) {
                Logger.debug('Page visibility changed', { 
                    pageId: page.id, 
                    isActive: page.classList.contains('active') 
                });
            }
        });

        // Update menu items
        menuItems.forEach(item => {
            const wasActive = item.classList.contains('active');
            item.classList.toggle('active', item.dataset.page === pageName);
            if (wasActive !== item.classList.contains('active')) {
                Logger.debug('Menu item state changed', { 
                    item: item.textContent.trim(), 
                    isActive: item.classList.contains('active') 
                });
            }
        });

        // Update page title
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            const titleMap = {
                'home': 'Home',
                'editor': 'PDF Editor',
                'merge': 'Merge PDFs',
                'split': 'Split PDF',
                'compress': 'Compress PDF',
                'protect': 'Protect PDF',
                'convert': 'Convert Files'
            };
            const newTitle = titleMap[pageName] || 'Home';
            pageTitle.textContent = newTitle;
            Logger.debug('Page title updated', { title: newTitle });
        }

        // Update ribbon tab based on page
        const pageToTabMap = {
            'home': 'home',
            'editor': 'edit',
            'merge': 'file',
            'split': 'file',
            'compress': 'file',
            'protect': 'file',
            'convert': 'home'
        };

        const targetTab = pageToTabMap[pageName] || 'home';
        switchRibbonTab(targetTab);

        currentPage = pageName;
        Logger.success('Page switched successfully', { page: pageName, tab: targetTab });
    }

    // Event listeners for ribbon tabs
    ribbonTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            Logger.info('Ribbon tab clicked', { tab: tab.dataset.tab });
            switchRibbonTab(tab.dataset.tab);
        });
    });

    // Event listeners for menu items
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.dataset.page;
            Logger.info('Menu item clicked', { 
                item: item.textContent.trim(), 
                targetPage: targetPage 
            });
            
            if (targetPage) {
                switchPage(targetPage);
            } else {
                Logger.warn('Menu item has no target page', { item: item.textContent.trim() });
            }
        });
    });

    // Action card functionality
    document.addEventListener('click', (e) => {
        const actionCard = e.target.closest('.action-card');
        if (actionCard) {
            const action = actionCard.dataset.action;
            Logger.info('Action card clicked', { action: action });
            handleActionCard(action);
        }

        const ribbonBtn = e.target.closest('.ribbon-btn');
        if (ribbonBtn) {
            const action = ribbonBtn.dataset.action;
            Logger.info('Ribbon button clicked', { action: action });
            handleRibbonAction(action);
        }
    });

    function handleActionCard(action) {
        Logger.debug('Handling action card', { action: action });
        
        switch (action) {
            case 'open-pdf':
                Logger.info('Opening PDF editor');
                switchPage('editor');
                break;
            case 'create-pdf':
                Logger.info('Create PDF action triggered');
                console.log('Create new PDF');
                break;
            case 'merge-pdfs':
                Logger.info('Opening merge page');
                switchPage('merge');
                break;
            case 'convert-images':
                Logger.info('Opening convert page');
                switchPage('convert');
                break;
            default:
                Logger.warn('Unknown action card action', { action: action });
                console.log('Action not implemented:', action);
        }
    }

    function handleRibbonAction(action) {
        Logger.debug('Handling ribbon action', { action: action });
        
        switch (action) {
            case 'open-pdf':
                Logger.info('Opening PDF file');
                switchPage('editor');
                const editFileInput = document.getElementById('editor-file-input');
                if (editFileInput) {
                    editFileInput.click();
                    Logger.success('File input triggered');
                } else {
                    Logger.error('Editor file input not found');
                }
                break;
            case 'new-pdf':
                Logger.info('Create new PDF action');
                console.log('Create new PDF');
                break;
            case 'save-pdf':
                Logger.info('Save PDF action');
                console.log('Save PDF');
                break;
            case 'images-to-pdf':
                Logger.info('Images to PDF action');
                switchPage('convert');
                break;
            case 'merge-pdfs':
                Logger.info('Merge PDFs action');
                switchPage('merge');
                break;
            case 'compress-pdf':
                Logger.info('Compress PDF action');
                switchPage('compress');
                break;
            case 'protect-pdf':
                Logger.info('Protect PDF action');
                switchPage('protect');
                break;
            case 'extract-text':
                Logger.info('Extract text action');
                console.log('Extract text');
                break;
            case 'edit-text':
                Logger.info('Edit text action');
                console.log('Edit text');
                break;
            case 'rotate-pages':
                Logger.info('Rotate pages action');
                console.log('Rotate pages');
                break;
            case 'delete-pages':
                Logger.info('Delete pages action');
                console.log('Delete pages');
                break;
            default:
                Logger.warn('Unknown ribbon action', { action: action });
                console.log('Action not implemented:', action);
        }
    }

    // File handling setup
    setupFileHandling();

    function setupFileHandling() {
        Logger.info('Setting up file handling');
        
        // Setup drop areas
        const dropAreas = document.querySelectorAll('.drop-zone');
        Logger.info('Found drop zones', { count: dropAreas.length });
        
        dropAreas.forEach((area, index) => {
            const fileInput = area.querySelector('input[type="file"]');
            if (!fileInput) {
                Logger.warn('Drop zone has no file input', { index: index });
                return;
            }

            Logger.debug('Setting up drop zone', { 
                index: index, 
                id: area.id, 
                inputId: fileInput.id 
            });

            area.addEventListener('click', () => {
                Logger.info('Drop zone clicked', { zoneId: area.id });
                fileInput.click();
            });
            
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('dragover');
                Logger.debug('File drag over', { zoneId: area.id });
            });
            
            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                Logger.debug('File drag leave', { zoneId: area.id });
            });
            
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                Logger.info('Files dropped', { 
                    zoneId: area.id, 
                    fileCount: e.dataTransfer.files.length 
                });
                handleFiles(e.dataTransfer.files, fileInput);
            });

            fileInput.addEventListener('change', () => {
                Logger.info('File input changed', { 
                    inputId: fileInput.id, 
                    fileCount: fileInput.files.length 
                });
                handleFiles(fileInput.files, fileInput);
            });
        });

        // Setup browse buttons
        const browseButtons = document.querySelectorAll('[id$="-browse-btn"]');
        Logger.info('Found browse buttons', { count: browseButtons.length });
        
        browseButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.id.replace('-browse-btn', '');
                const fileInput = document.getElementById(`${pageId}-file-input`);
                Logger.info('Browse button clicked', { 
                    buttonId: btn.id, 
                    pageId: pageId, 
                    fileInputFound: !!fileInput 
                });
                
                if (fileInput) {
                    fileInput.click();
                } else {
                    Logger.error('File input not found for browse button', { 
                        buttonId: btn.id, 
                        expectedInputId: `${pageId}-file-input` 
                    });
                }
            });
        });

        // Setup action buttons
        setupActionButtons();
    }

    function handleFiles(files, fileInput) {
        if (!files || files.length === 0) {
            Logger.warn('No files provided to handleFiles');
            return;
        }

        Logger.info('Handling files', { 
            fileCount: files.length, 
            inputId: fileInput.id,
            fileNames: Array.from(files).map(f => f.name)
        });

        const pageId = fileInput.id.replace('-file-input', '');
        const fileList = document.getElementById(`${pageId}-file-list`);
        
        if (fileList) {
            fileList.innerHTML = '';
            Array.from(files).forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'file-list-item';
                item.innerHTML = `
                    <span>${file.name}</span>
                    <button class="btn btn-sm btn-secondary remove-file" data-filename="${file.name}">
                        <i data-lucide="x"></i>
                    </button>
                `;
                fileList.appendChild(item);
                Logger.debug('File added to list', { 
                    fileName: file.name, 
                    fileSize: file.size,
                    fileType: file.type 
                });
            });
            
            try {
                lucide.createIcons();
                Logger.debug('Icons refreshed for file list');
            } catch (e) {
                Logger.error('Failed to refresh icons', e);
            }
        } else {
            Logger.error('File list element not found', { pageId: pageId });
        }

        // Enable action buttons
        const actionBtn = document.getElementById(`${pageId}-btn`);
        if (actionBtn) {
            actionBtn.disabled = false;
            Logger.success('Action button enabled', { buttonId: actionBtn.id });
        } else {
            Logger.warn('Action button not found', { expectedId: `${pageId}-btn` });
        }
    }

    function setupActionButtons() {
        Logger.info('Setting up action buttons');
        
        // Merge button
        const mergeBtn = document.getElementById('merge-btn');
        if (mergeBtn) {
            mergeBtn.addEventListener('click', () => {
                Logger.info('Merge button clicked');
                const fileList = document.getElementById('merge-file-list');
                const files = fileList.querySelectorAll('.file-list-item');
                Logger.info('Merge operation', { fileCount: files.length });
                
                if (files.length > 1) {
                    Logger.success('Starting merge operation');
                    console.log('Merging PDFs...');
                    // Call merge API
                } else {
                    Logger.warn('Not enough files for merge', { fileCount: files.length });
                }
            });
        } else {
            Logger.error('Merge button not found');
        }

        // Compress button
        const compressBtn = document.getElementById('compress-btn');
        if (compressBtn) {
            compressBtn.addEventListener('click', () => {
                Logger.info('Compress button clicked');
                const fileList = document.getElementById('compress-file-list');
                const files = fileList.querySelectorAll('.file-list-item');
                Logger.info('Compress operation', { fileCount: files.length });
                
                if (files.length > 0) {
                    Logger.success('Starting compress operation');
                    console.log('Compressing PDF...');
                    // Call compress API
                } else {
                    Logger.warn('No files to compress');
                }
            });
        } else {
            Logger.error('Compress button not found');
        }

        // Protect button
        const protectBtn = document.getElementById('protect-btn');
        if (protectBtn) {
            protectBtn.addEventListener('click', () => {
                Logger.info('Protect button clicked');
                const fileList = document.getElementById('protect-file-list');
                const files = fileList.querySelectorAll('.file-list-item');
                Logger.info('Protect operation', { fileCount: files.length });
                
                if (files.length > 0) {
                    Logger.success('Starting protect operation');
                    console.log('Protecting PDF...');
                    // Call protect API
                } else {
                    Logger.warn('No files to protect');
                }
            });
        } else {
            Logger.error('Protect button not found');
        }

        // Convert button
        const convertBtn = document.getElementById('convert-btn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => {
                Logger.info('Convert button clicked');
                const fileList = document.getElementById('convert-file-list');
                const files = fileList.querySelectorAll('.file-list-item');
                Logger.info('Convert operation', { fileCount: files.length });
                
                if (files.length > 0) {
                    Logger.success('Starting convert operation');
                    console.log('Converting files...');
                    // Call convert API
                } else {
                    Logger.warn('No files to convert');
                }
            });
        } else {
            Logger.error('Convert button not found');
        }

        // Clear buttons
        const clearButtons = document.querySelectorAll('[id$="-clear-btn"]');
        Logger.info('Found clear buttons', { count: clearButtons.length });
        
        clearButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.id.replace('-clear-btn', '');
                Logger.info('Clear button clicked', { pageId: pageId });
                
                const fileList = document.getElementById(`${pageId}-file-list`);
                const fileInput = document.getElementById(`${pageId}-file-input`);
                const actionBtn = document.getElementById(`${pageId}-btn`);
                
                if (fileList) fileList.innerHTML = '';
                if (fileInput) fileInput.value = '';
                if (actionBtn) actionBtn.disabled = true;
                
                Logger.success('Files cleared', { pageId: pageId });
            });
        });
    }

    // Remove file functionality
    document.addEventListener('click', (e) => {
        if (e.target.closest('.remove-file')) {
            const fileItem = e.target.closest('.file-list-item');
            if (fileItem) {
                const fileName = fileItem.querySelector('span').textContent;
                Logger.info('Removing file', { fileName: fileName });
                
                fileItem.remove();
                
                // Check if any files remain and update button state
                const fileList = fileItem.parentElement;
                const pageId = fileList.id.replace('-file-list', '');
                const actionBtn = document.getElementById(`${pageId}-btn`);
                
                if (actionBtn && fileList.children.length === 0) {
                    actionBtn.disabled = true;
                    Logger.debug('Action button disabled - no files remaining', { pageId: pageId });
                }
            }
        }
    });

    // Convert tabs functionality
    const convertTabs = document.querySelectorAll('.convert-tab');
    const convertContents = document.querySelectorAll('.convert-content');
    
    Logger.info('Found convert tabs', { count: convertTabs.length });
    
    convertTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.convert;
            Logger.info('Convert tab clicked', { target: target });
            
            // Update active tab
            convertTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content
            convertContents.forEach(content => {
                content.style.display = content.id === target ? 'block' : 'none';
            });
            
            Logger.success('Convert tab switched', { target: target });
        });
    });

    // Add logging controls to window for debugging
    window.Logger = Logger;
    window.exportLogs = () => Logger.exportLogs();
    window.clearLogs = () => Logger.clearLogs();
    
    // Add keyboard shortcut for log export (Ctrl+Shift+L)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            Logger.info('Log export shortcut triggered');
            Logger.exportLogs();
        }
    });

    // Initialize the app
    Logger.info('Initializing application');
    switchPage('home');
    switchRibbonTab('home');
    Logger.success('Application initialized successfully');
});