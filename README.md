# SumIt - Web Content Q&A Extension

SumIt is a Chrome extension that enables intelligent Q&A interactions with web page content using Google's Gemini AI. The extension extracts content from web pages and allows users to ask questions about the content, receiving AI-generated answers.

## Features

- **Content Extraction**: Automatically extracts and structures content from web pages
- **Q&A Interface**: Interactive interface for asking questions about the page content
- **AI-Powered Answers**: Uses Google's Gemini AI to generate accurate and contextual answers
- **Code Formatting**: Preserves and properly formats code snippets in responses
- **Markdown Support**: Rich text formatting for better readability of answers

## Technologies Used

- **Google Gemini AI**: For generating intelligent responses
- **Chrome Extension APIs**: For content extraction and side panel functionality
- **Rollup**: For building and bundling the extension

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/SumIt.git
   cd SumIt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory from the project

## Usage

1. **Setup API Key**:
   - Open the extension side panel
   - Enter your Google Gemini API key in the settings section
   - Click "Save" to store the API key

2. **Using the Q&A Feature**:
   - Navigate to any web page
   - Click the extension icon to open the side panel
   - The page content will be automatically extracted
   - Type your question in the input field
   - Click "Ask" to get an AI-generated answer

3. **Viewing Answers**:
   - Answers are displayed in a formatted, easy-to-read style
   - Code snippets are properly formatted with syntax highlighting
   - Lists and headings are properly structured
   - Long answers are scrollable

## Development

The project structure:
```
SumIt/
├── dist/           # Built extension files
├── sidepanel/      # Side panel UI components
├── scripts/        # Utility scripts
├── background.js   # Extension background script
├── manifest.json   # Extension configuration
└── rollup.config.mjs # Build configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI for providing the AI capabilities
- Chrome Extension APIs for the extension functionality
