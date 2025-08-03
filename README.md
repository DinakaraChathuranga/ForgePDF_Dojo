# ForgePDF Dojo

ForgePDF Dojo is a cross-platform desktop utility built with Electron and Python for performing common PDF tasks such as merging, compressing, watermarking and password protecting files.

## Setup

### Prerequisites
- **Node.js** and **npm**
- **Python 3**

### Node dependencies
Install JavaScript dependencies from the project root:

```bash
npm install
```

### Python dependencies
Install the required Python packages:

```bash
pip install pikepdf pymupdf packaging
```

## Build Commands

- `npm start` – Run the application in development.
- `npm run pack` – Create an unpacked build.
- `npm run dist` – Generate a distributable package.

## Usage

After installing dependencies, launch the app with `npm start` and use the interface to choose actions like merge, compress or watermark PDFs.

## Contributing

1. Fork the repository and create your feature branch.
2. Commit your changes with clear messages.
3. Open a pull request and describe your modifications.

Please ensure your contributions adhere to existing code style and run available checks before submitting.

## License

This project is released under the MIT License.

