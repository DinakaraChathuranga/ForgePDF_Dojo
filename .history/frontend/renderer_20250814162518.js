document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Global state
    let currentTab = 'home';
    let currentPage = 'home';

    // Get DOM elements
    const ribbonTabs = document.querySelectorAll('.ribbon-tab');
    const ribbonPanels = document.querySelectorAll('.ribbon-panel');
    const pages = document.querySelectorAll('.page');
    const menuItems = document.querySelectorAll('.menu-item');

    function switchRibbonTab(tabName) {
        // Update ribbon tabs
        ribbonTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update ribbon panels
        ribbonPanels.forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });

        currentTab = tabName;
    }

    function switchPage(pageName) {
        // Update pages
        pages.forEach(page => {
            page.classList.toggle('active', page.id === pageName);
        });

        // Update menu items
        menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.target === pageName);
        });

        // Update ribbon tab based on page
        const pageToTabMap = {
            'home': 'home',
            'edit': 'edit',
            'merge': 'file',
            'compress': 'file',
            'protect': 'file',
            'images': 'home'
        };

        const targetTab = pageToTabMap[pageName] || 'home';
        switchRibbonTab(targetTab);

        currentPage = pageName;
    }

    // Event listeners for ribbon tabs
    ribbonTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchRibbonTab(tab.dataset.tab);
        });
    });

    // Event listeners for menu items
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(item.dataset.target);
        });
    });

    // Ribbon button functionality
    document.addEventListener('click', (e) => {
        const ribbonBtn = e.target.closest('.ribbon-btn');
        if (!ribbonBtn) return;

        const action = ribbonBtn.dataset.action;
        handleRibbonAction(action);
    });

    function handleRibbonAction(action) {
        switch (action) {
            case 'open-pdf':
                switchPage('edit');
                const editFileInput = document.getElementById('edit-file-input');
                if (editFileInput) editFileInput.click();
                break;
            case 'new-pdf':
                // Create new PDF functionality
                console.log('Create new PDF');
                break;
            case 'save-pdf':
                // Save PDF functionality
                console.log('Save PDF');
                break;
            case 'images-to-pdf':
                switchPage('images');
                break;
            case 'merge-pdfs':
                switchPage('merge');
                break;
            case 'compress-pdf':
                switchPage('compress');
                break;
            case 'protect-pdf':
                switchPage('protect');
                break;
            case 'extract-text':
                // Extract text functionality
                console.log('Extract text');
                break;
            case 'edit-text':
                // Edit text functionality
                console.log('Edit text');
                break;
            case 'rotate-pages':
                // Rotate pages functionality
                console.log('Rotate pages');
                break;
            case 'delete-pages':
                // Delete pages functionality
                console.log('Delete pages');
                break;
            default:
                console.log('Action not implemented:', action);
        }
    }

    // File handling setup
    setupFileHandling();

    function setupFileHandling() {
        // Setup drop areas
        const dropAreas = document.querySelectorAll('.drop-zone');
        dropAreas.forEach(area => {
            const fileInput = area.querySelector('input[type="file"]');
            if (!fileInput) return;

            area.addEventListener('click', () => fileInput.click());
            
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('dragover');
            });
            
            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
            });
            
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                handleFiles(e.dataTransfer.files, fileInput);
            });

            fileInput.addEventListener('change', () => {
                handleFiles(fileInput.files, fileInput);
            });
        });

        // Setup browse buttons
        const browseButtons = document.querySelectorAll('[id$="-browse-btn"]');
        browseButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.id.replace('-browse-btn', '');
                const fileInput = document.getElementById(`${pageId}-file-input`);
                if (fileInput) fileInput.click();
            });
        });

        // Setup action buttons
        setupActionButtons();
    }

    function handleFiles(files, fileInput) {
        if (!files || files.length === 0) return;

        const pageId = fileInput.id.replace('-file-input', '');
        const fileList = document.getElementById(`${pageId}-file-list`);
        
        if (fileList) {
            fileList.innerHTML = '';
            Array.from(files).forEach(file => {
                const item = document.createElement('div');
                item.className = 'file-list-item';
                item.innerHTML = `
                    <span>${file.name}</span>
                    <button class="btn btn-sm btn-secondary remove-file" data-filename="${file.name}">
                        <i data-lucide="x"></i>
                    </button>
                `;
                fileList.appendChild(item);
            });
            lucide.createIcons();
        }

        // Enable action buttons
        const actionBtn = document.getElementById(`${pageId}-btn`);
        if (actionBtn) {
            actionBtn.disabled = false;
        }
    }

    function setupActionButtons() {
        // Merge button
        const mergeBtn = document.getElementById('merge-btn');
        if (mergeBtn) {
            mergeBtn.addEventListener('click', () => {
                const fileList = document.getElementById('merge-file-list');
                const files = fileList.querySelectorAll('.file-list-item');
                if (files.length > 1) {
                    // Call merge API
                    console.log('Merging PDFs...');
                }
            });
        }

        // Compress button
        const compressBtn = document.getElementById('compress-btn');
        if (compressBtn) {
            compressBtn.addEventListener('click', () => {
                const fileList = document.getElementById('compress-file-list');
                const files = fileList.querySelectorAll('.file-list-item');
                if (files.length > 0) {
                    // Call compress API
                    console.log('Compressing PDF...');
                }
            });
        }

        // Protect button
        const protectBtn = document.getElementById('protect-btn');
        if (protectBtn) {
            protectBtn.addEventListener('click', () => {
                const fileList = document.getElementById('protect-file-list');
                const files = fileList.querySelectorAll('.file-list-item');
                if (files.length > 0) {
                    // Call protect API
                    console.log('Protecting PDF...');
                }
            });
        }

        // Clear buttons
        const clearButtons = document.querySelectorAll('[id$="-clear-btn"]');
        clearButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.id.replace('-clear-btn', '');
                const fileList = document.getElementById(`${pageId}-file-list`);
                const fileInput = document.getElementById(`${pageId}-file-input`);
                const actionBtn = document.getElementById(`${pageId}-btn`);
                
                if (fileList) fileList.innerHTML = '';
                if (fileInput) fileInput.value = '';
                if (actionBtn) actionBtn.disabled = true;
            });
        });
    }

    // Remove file functionality
    document.addEventListener('click', (e) => {
        if (e.target.closest('.remove-file')) {
            const fileItem = e.target.closest('.file-list-item');
            if (fileItem) {
                fileItem.remove();
                
                // Check if any files remain and update button state
                const fileList = fileItem.parentElement;
                const pageId = fileList.id.replace('-file-list', '');
                const actionBtn = document.getElementById(`${pageId}-btn`);
                
                if (actionBtn && fileList.children.length === 0) {
                    actionBtn.disabled = true;
                }
            }
        }
    });

    // Initialize the app
    switchPage('home');
    switchRibbonTab('home');
});