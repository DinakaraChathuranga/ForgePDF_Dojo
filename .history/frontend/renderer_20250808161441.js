const dropzone = document.getElementById('dropzone');
const functionOptions = document.querySelectorAll('.function-option');
const contentSections = document.querySelectorAll('.content-section');

// Function to handle file selection and UI updates
function handleFileSelection(inputId, textId) {
    const input = document.getElementById(inputId);
    const text = document.getElementById(textId);

    // Trigger file input click
    input.click();

    // Handle file selection
    input.addEventListener('change', () => {
        if (input.files.length > 0) {
            let fileNames = "";
            for (let i = 0; i < input.files.length; i++) {
                fileNames += input.files[i].name + "<br>";
            }
            text.innerHTML = fileNames;
        } else {
            text.innerHTML = "No file chosen";
        }
    });
}

// Add event listeners for each function
document.getElementById('compressBtn').addEventListener('click', () => {
    handleFileSelection('compress-input', 'compress-text');
});

document.getElementById('imgToPdfBtn').addEventListener('click', () => {
    handleFileSelection('imgToPdf-input', 'imgToPdf-text');
});

document.getElementById('mergeBtn').addEventListener('click', () => {
    handleFileSelection('merge-input', 'merge-text');
});

document.getElementById('organizeBtn').addEventListener('click', () => {
    handleFileSelection('organize-input', 'organize-text');
});

document.getElementById('pdfToImgBtn').addEventListener('click', () => {
    handleFileSelection('pdfToImg-input', 'pdfToImg-text');
});

document.getElementById('protectBtn').addEventListener('click', () => {
    handleFileSelection('protect-input', 'protect-text');
});

document.getElementById('rotateBtn').addEventListener('click', () => {
    handleFileSelection('rotate-input', 'rotate-text');
});

document.getElementById('splitBtn').addEventListener('click', () => {
    handleFileSelection('split-input', 'split-text');
});

document.getElementById('watermarkBtn').addEventListener('click', () => {
    handleFileSelection('watermark-input', 'watermark-text');
});


// Sidebar navigation
functionOptions.forEach(option => {
    option.addEventListener('click', () => {
        const target = option.dataset.target;

        // Deactivate all options
        functionOptions.forEach(opt => opt.classList.remove('active'));
        // Hide all content sections
        contentSections.forEach(sec => sec.classList.remove('active'));

        // Activate the clicked option
        option.classList.add('active');
        // Show the corresponding content section
        document.getElementById(target).classList.add('active');
    });
});

// Drag and drop functionality
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

        if (input && text) {
            input.files = files;
            let fileNames = "";
            for (let i = 0; i < files.length; i++) {
                fileNames += files[i].name + "<br>";
            }
            text.innerHTML = fileNames;
        }
    }
});

// Function calls to the backend
async function compressPdf() {
    const input = document.getElementById('compress-input');
    if (input.files.length > 0) {
        const filePath = input.files[0].path;
        const result = await window.electron.compressPdf(filePath);
        alert(result);
    } else {
        alert("Please select a file");
    }
}

async function convertImageToPdf() {
    const input = document.getElementById('imgToPdf-input');
    if (input.files.length > 0) {
        const filePaths = Array.from(input.files).map(file => file.path);
        const result = await window.electron.convertImageToPdf(filePaths);
        alert(result);
    } else {
        alert("Please select one or more image files");
    }
}

async function mergePdfs() {
    const input = document.getElementById('merge-input');
    if (input.files.length > 1) {
        const filePaths = Array.from(input.files).map(file => file.path);
        const result = await window.electron.mergePdfs(filePaths);
        alert(result);
    } else {
        alert("Please select at least two PDF files to merge");
    }
}

async function organizePdf() {
    const input = document.getElementById('organize-input');
    const pages = document.getElementById('organize-pages').value;
    if (input.files.length > 0) {
        const filePath = input.files[0].path;
        const result = await window.electron.organizePdf(filePath, pages);
        alert(result);
    } else {
        alert("Please select a PDF file");
    }
}

async function convertPdfToImage() {
    const input = document.getElementById('pdfToImg-input');
    if (input.files.length > 0) {
        const filePath = input.files[0].path;
        const result = await window.electron.convertPdfToImage(filePath);
        alert(result);
    } else {
        alert("Please select a PDF file");
    }
}

async function protectPdf() {
    const input = document.getElementById('protect-input');
    const password = document.getElementById('protect-password').value;
    if (input.files.length > 0) {
        const filePath = input.files[0].path;
        const result = await window.electron.protectPdf(filePath, password);
        alert(result);
    } else {
        alert("Please select a PDF file");
    }
}

async function rotatePdf() {
    const input = document.getElementById('rotate-input');
    const degrees = document.getElementById('rotate-degrees').value;
    if (input.files.length > 0) {
        const filePath = input.files[0].path;
        const result = await window.electron.rotatePdf(filePath, parseInt(degrees));
        alert(result);
    } else {
        alert("Please select a PDF file");
    }
}

async function splitPdf() {
    const input = document.getElementById('split-input');
    const ranges = document.getElementById('split-ranges').value;
    if (input.files.length > 0) {
        const filePath = input.files[0].path;
        const result = await window.electron.splitPdf(filePath, ranges);
        alert(result);
    } else {
        alert("Please select a PDF file");
    }
}

async function addWatermark() {
    const input = document.getElementById('watermark-input');
    const text = document.getElementById('watermark-text-input').value;
    if (input.files.length > 0) {
        const filePath = input.files[0].path;
        const result = await window.electron.addWatermark(filePath, text);
        alert(result);
    } else {
        alert("Please select a PDF file");
    }
}