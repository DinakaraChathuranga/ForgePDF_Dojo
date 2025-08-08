const lottie = require('lottie-web');

document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const toolCardContainer = document.querySelector('.tools-list');

    // --- Lottie Animation Setup ---
    const animationContainer = document.getElementById('lottie-animation');
    if (animationContainer) {
        lottie.loadAnimation({
            container: animationContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'assets/animation.json' 
        });
    }
    // --- End Lottie Animation Setup ---

    const tools = [
        { id: 'merge', icon: 'fas fa-object-union', title: 'Merge PDF', description: 'Combine multiple PDFs into one.', colors: ['#4A00E0', '#8E2DE2'] },
        { id: 'split', icon: 'fas fa-object-group', title: 'Split PDF', description: 'Extract pages from a PDF.', colors: ['#00B4DB', '#0083B0'] },
        { id: 'compress', icon: 'fas fa-compress-arrows-alt', title: 'Compress PDF', description: 'Reduce the file size of your PDF.', colors: ['#f7971e', '#ffd200'] },
        { id: 'protect', icon: 'fas fa-lock', title: 'Protect PDF', description: 'Add a password to your PDF.', colors: ['#ED213A', '#93291E'] },
        { id: 'watermark', icon: 'fas fa-copyright', title: 'Watermark', description: 'Add a text or image watermark.', colors: ['#11998e', '#38ef7d'] },
        { id: 'rotate', icon: 'fas fa-sync-alt', title: 'Rotate PDF', description: 'Rotate pages in your PDF.', colors: ['#00c6ff', '#0072ff'] },
        { id: 'edit-organize', icon: 'fas fa-edit', title: 'Edit & Organize', description: 'Delete and reorder pages.', colors: ['#6a11cb', '#2575fc'] },
        { id: 'pdf-to-image', icon: 'fas fa-file-image', title: 'PDF to Image', description: 'Convert PDF pages to images.', colors: ['#FC5C7D', '#6A82FB'] },
        { id: 'image-to-pdf', icon: 'fas fa-image', title: 'Image to PDF', description: 'Convert images to a PDF file.', colors: ['#764ba2', '#667eea'] },
    ];

    function createToolCards() {
        if (!toolCardContainer) return;
        toolCardContainer.innerHTML = '';
        tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.dataset.page = tool.id;
            card.innerHTML = `
                <div class="tool-card-icon-wrapper" style="background: linear-gradient(135deg, ${tool.colors[0]}, ${tool.colors[1]})">
                    <i class="${tool.icon} tool-card-icon"></i>
                </div>
                <h3 class="tool-card-title">${tool.title}</h3>
                <p class="tool-card-description">${tool.description}</p>
            `;
            card.addEventListener('click', () => switchPage(tool.id));
            toolCardContainer.appendChild(card);
        });
    }

    function switchPage(pageId) {
        pages.forEach(page => {
            page.classList.toggle('active', page.id === pageId);
        });
        menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(item.dataset.page);
        });
    });

    // Drag and drop functionality for merge page
    const mergeDropArea = document.getElementById('merge-drop-area');
    const mergeFileList = document.getElementById('merge-file-list');
    const mergeBtn = document.getElementById('merge-btn');
    let mergeFiles = [];

    if (mergeDropArea) {
        mergeDropArea.addEventListener('click', () => {
            window.electron.openFile().then(files => {
                if (files) {
                    handleMergeFiles(files);
                }
            });
        });

        mergeDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mergeDropArea.classList.add('highlight');
        });

        mergeDropArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mergeDropArea.classList.remove('highlight');
        });

        mergeDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mergeDropArea.classList.remove('highlight');
            const files = [...e.dataTransfer.files].map(f => f.path);
            handleMergeFiles(files);
        });
    }

    function handleMergeFiles(files) {
        mergeFiles.push(...files);
        renderMergeFileList();
    }

    function renderMergeFileList() {
        mergeFileList.innerHTML = '';
        mergeFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="file-list-item-content">
                    <i class="fas fa-grip-vertical drag-handle"></i>
                    <span>${file.split(/[\\/]/).pop()}</span>
                </div>
                <button class="remove-file-btn" data-index="${index}"><i class="fas fa-times"></i></button>
            `;
            mergeFileList.appendChild(li);
        });
        updateMergeButtonState();
    }
    
    function updateMergeButtonState() {
        mergeBtn.disabled = mergeFiles.length < 2;
    }

    if (mergeFileList) {
        mergeFileList.addEventListener('click', (e) => {
            if (e.target.closest('.remove-file-btn')) {
                const index = parseInt(e.target.closest('.remove-file-btn').dataset.index, 10);
                mergeFiles.splice(index, 1);
                renderMergeFileList();
            }
        });
    }

    if (mergeBtn) {
        mergeBtn.addEventListener('click', async () => {
            if (mergeFiles.length > 1) {
                const outputPath = await window.electron.saveFile();
                if (outputPath) {
                    const result = await window.electron.merge(mergeFiles, outputPath);
                    if (result.success) {
                        alert(`Successfully merged files to: ${result.path}`);
                        mergeFiles = [];
                        renderMergeFileList();
                    } else {
                        alert(`Error merging files: ${result.error}`);
                    }
                }
            }
        });
    }
    
    // Initial setup
    createToolCards();
    switchPage('home');
});