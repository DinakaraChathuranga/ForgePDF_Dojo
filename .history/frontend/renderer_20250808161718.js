document.addEventListener('DOMContentLoaded', () => {
    const functionOptions = document.querySelectorAll('.function-option');
    const contentSections = document.querySelectorAll('.content-section');
    const dropzone = document.getElementById('dropzone');

    // --- Sidebar Navigation ---
    functionOptions.forEach(option => {
        option.addEventListener('click', () => {
            const target = option.dataset.target;

            functionOptions.forEach(opt => opt.classList.remove('active'));
            contentSections.forEach(sec => sec.classList.remove('active'));

            option.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // --- Generic File Input Handling ---
    // This setup function handles file selection for all sections
    const setupFileInput = (buttonId, inputId, textId) => {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        const text = document.getElementById(textId);

        if (button) {
            button.addEventListener('click', () => {
                input.click();
            });
        }

        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                let fileNames = Array.from(input.files).map(file => file.name).join('<br>');
                text.innerHTML = fileNames;
            } else {
                text.innerHTML = "No file chosen";
            }
        });
    };

    // An array to define all the sections that need file input handling
    const fileInputSections = [
        { btn: 'compressBtn', input: 'compress-input', text: 'compress-text' },
        { btn: 'imgToPdfBtn', input: 'imgToPdf-input', text: 'imgToPdf-text' },
        { btn: 'mergeBtn', input: 'merge-input', text: 'merge-text' },
        { btn: 'organizeBtn', input: 'organize-input', text: 'organize-text' },
        { btn: 'pdfToImgBtn', input: 'pdfToImg-input', text: 'pdfToImg-text' },
        { btn: 'protectBtn', input: 'protect-input', text: 'protect-text' },
        { btn: 'rotateBtn', input: 'rotate-input', text: 'rotate-text' },
        { btn: 'splitBtn', input: 'split-input', text: 'split-text' },
        { btn: 'watermarkBtn', input: 'watermark-input', text: 'watermark-text' }
    ];

    // Apply the setup to each section
    fileInputSections.forEach(section => {
        setupFileInput(section.btn, section.input, section.text);
    });

    // --- Drag and Drop Functionality ---
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');

            const files = e.dataTransfer.files;
            const activeContent = document.querySelector('.content-section.active');

            if (activeContent) {
                const input = activeContent.querySelector('input[type="file"]');
                const text = activeContent.querySelector('.file-name');

                if (input && text && files.length > 0) {
                    input.files = files;
                    let fileNames = Array.from(files).map(file => file.name).join('<br>');
                    text.innerHTML = fileNames;
                }
            }
        });
    }

    // --- IPC Function Calls to Backend ---
    window.compressPdf = async function() {
        const input = document.getElementById('compress-input');
        if (input.files.length > 0) {
            const filePath = input.files[0].path;
            const result = await window.electron.compressPdf(filePath);
            alert(result);
        } else {
            alert("Please select a file");
        }
    };

    window.convertImageToPdf = async function() {
        const input = document.getElementById('imgToPdf-input');
        if (input.files.length > 0) {
            const filePaths = Array.from(input.files).map(file => file.path);
            const result = await window.electron.convertImageToPdf(filePaths);
            alert(result);
        } else {
            alert("Please select one or more image files");
        }
    };

    window.mergePdfs = async function() {
        const input = document.getElementById('merge-input');
        if (input.files.length > 1) {
            const filePaths = Array.from(input.files).map(file => file.path);
            const result = await window.electron.mergePdfs(filePaths);
            alert(result);
        } else {
            alert("Please select at least two PDF files to merge");
        }
    };

    window.organizePdf = async function() {
        const input = document.getElementById('organize-input');
        const pages = document.getElementById('organize-pages').value;
        if (input.files.length > 0) {
            const filePath = input.files[0].path;
            const result = await window.electron.organizePdf(filePath, pages);
            alert(result);
        } else {
            alert("Please select a PDF file");
        }
    };

    window.convertPdfToImage = async function() {
        const input = document.getElementById('pdfToImg-input');
        if (input.files.length > 0) {
            const filePath = input.files[0].path;
            const result = await window.electron.convertPdfToImage(filePath);
            alert(result);
        } else {
            alert("Please select a PDF file");
        }
    };

    window.protectPdf = async function() {
        const input = document.getElementById('protect-input');
        const password = document.getElementById('protect-password').value;
        if (input.files.length > 0) {
            const filePath = input.files[0].path;
            const result = await window.electron.protectPdf(filePath, password);
            alert(result);
        } else {
            alert("Please select a PDF file");
        }
    };

    window.rotatePdf = async function() {
        const input = document.getElementById('rotate-input');
        const degrees = document.getElementById('rotate-degrees').value;
        if (input.files.length > 0) {
            const filePath = input.files[0].path;
            const result = await window.electron.rotatePdf(filePath, parseInt(degrees));
            alert(result);
        } else {
            alert("Please select a PDF file");
        }
    };

    window.splitPdf = async function() {
        const input = document.getElementById('split-input');
        const ranges = document.getElementById('split-ranges').value;
        if (input.files.length > 0) {
            const filePath = input.files[0].path;
            const result = await window.electron.splitPdf(filePath, ranges);
            alert(result);
        } else {
            alert("Please select a PDF file");
        }
    };

    window.addWatermark = async function() {
        const input = document.getElementById('watermark-input');
        const text = document.getElementById('watermark-text-input').value;
        if (input.files.length > 0) {
            const filePath = input.files[0].path;
            const result = await window.electron.addWatermark(filePath, text);
            alert(result);
        } else {
            alert("Please select a PDF file");
        }
    };
});