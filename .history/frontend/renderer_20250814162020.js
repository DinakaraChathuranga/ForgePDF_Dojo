document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Global state
    let currentTab = 'home';
    let currentPage = 'home';

    // Ribbon tab functionality
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
                document.getElementById('edit-file-input').click();
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

    // File handling setup (simplified version)
    setupFileHandling();

    function setupFileHandling() {
        // Setup drop areas
        const dropAreas = document.querySelectorAll('.drop-area');
        dropAreas.forEach(area => {
            const fileInput = area.querySelector('input[type="file"]');
            if (!fileInput) return;

            area.addEventListener('click', () => fileInput.click());
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.style.borderColor = var(--primary);
                area.style.backgroundColor = var(--primary-tint);
            });
            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                area.style.borderColor = '';
                area.style.backgroundColor = '';
            });
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.style.borderColor = '';
                area.style.backgroundColor = '';
                handleFiles(e.dataTransfer.files, fileInput);
            });

            fileInput.addEventListener('change', () => {
                handleFiles(fileInput.files, fileInput);
            });
        });
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
                    <button class="btn btn-sm btn-secondary" onclick="this.parentElement.remove()">
                        <i data-lucide="x"></i>
                    </button>
                `;
                fileList.appendChild(item);
            });
            lucide.createIcons();
        }
    }

    // Initialize the app
    switchPage('home');
    switchRibbonTab('home');
});