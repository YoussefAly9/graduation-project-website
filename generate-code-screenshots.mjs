import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const codeFiles = [
  {
    name: 'Server Entry Point',
    file: 'server/src/index.js',
    description: 'Main Express.js server configuration and startup'
  },
  {
    name: 'Database Configuration',
    file: 'server/src/config/database.js',
    description: 'MongoDB connection setup using Mongoose'
  },
  {
    name: 'API Routes',
    file: 'server/src/routes/index.js',
    description: 'Main router configuration for all API endpoints'
  },
  {
    name: 'Product Controller',
    file: 'server/src/controllers/productController.js',
    description: 'Product CRUD operations and filtering logic'
  },
  {
    name: 'Order Controller - Create Order',
    file: 'server/src/controllers/orderController.js',
    description: 'Order creation with stock management and robot task queuing',
    startLine: 57,
    endLine: 134
  },
  {
    name: 'Robot Controller',
    file: 'server/src/controllers/robotController.js',
    description: 'Robot task orchestration and YOLOv8 detection handling'
  }
];

const htmlTemplate = (title, code, description) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 40px;
      line-height: 1.6;
    }
    .header {
      background: #252526;
      padding: 20px 30px;
      border-left: 4px solid #007acc;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .header h1 {
      color: #4ec9b0;
      font-size: 24px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .header p {
      color: #858585;
      font-size: 14px;
    }
    .code-container {
      background: #252526;
      border-radius: 6px;
      padding: 0;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .code-header {
      background: #2d2d30;
      padding: 12px 20px;
      border-bottom: 1px solid #3e3e42;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .code-header .file-icon {
      width: 16px;
      height: 16px;
      background: #007acc;
      border-radius: 2px;
    }
    .code-header .file-name {
      color: #cccccc;
      font-size: 13px;
      font-weight: 500;
    }
    pre {
      margin: 0;
      padding: 20px 30px;
      overflow-x: auto;
      font-size: 14px;
      line-height: 1.8;
    }
    code {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
    .line-number {
      color: #858585;
      margin-right: 20px;
      user-select: none;
      display: inline-block;
      width: 40px;
      text-align: right;
    }
    .keyword { color: #569cd6; }
    .string { color: #ce9178; }
    .function { color: #dcdcaa; }
    .comment { color: #6a9955; font-style: italic; }
    .number { color: #b5cea8; }
    .operator { color: #d4d4d4; }
    .punctuation { color: #d4d4d4; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>${description}</p>
  </div>
  <div class="code-container">
    <div class="code-header">
      <div class="file-icon"></div>
      <span class="file-name">${title.replace(/\s+/g, '_').toLowerCase()}.js</span>
    </div>
    <pre><code>${code}</code></pre>
  </div>
</body>
</html>
`;

function highlightCode(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (match) => `<span class="comment">${match}</span>`)
    .replace(/\/\/.*$/gm, (match) => `<span class="comment">${match}</span>`)
    .replace(/\b(import|export|from|const|let|var|function|async|await|return|if|else|try|catch|new|class|extends|this|static|default)\b/g, (match) => `<span class="keyword">${match}</span>`)
    .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, (match, name) => {
      if (!['if', 'else', 'for', 'while', 'switch', 'catch'].includes(name)) {
        return `<span class="function">${name}</span>(`;
      }
      return match;
    })
    .replace(/(['"`])(?:(?=(\\?))\2.)*?\1/g, (match) => `<span class="string">${match}</span>`)
    .replace(/\b(\d+\.?\d*)\b/g, (match) => `<span class="number">${match}</span>`)
    .replace(/([{}()\[\];,=+\-*/%<>!&|])/g, (match) => `<span class="punctuation">${match}</span>`);
}

function addLineNumbers(code) {
  const lines = code.split('\n');
  return lines.map((line, index) => {
    const lineNum = String(index + 1).padStart(3, ' ');
    return `<span class="line-number">${lineNum}</span>${line}`;
  }).join('\n');
}

async function generateScreenshot(fileInfo) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let codeContent = fs.readFileSync(fileInfo.file, 'utf-8');
  
  // If specific lines are requested, extract them
  if (fileInfo.startLine && fileInfo.endLine) {
    const lines = codeContent.split('\n');
    codeContent = lines.slice(fileInfo.startLine - 1, fileInfo.endLine).join('\n');
  }
  
  const highlightedCode = highlightCode(codeContent);
  const numberedCode = addLineNumbers(highlightedCode);
  const html = htmlTemplate(fileInfo.name, numberedCode, fileInfo.description);
  
  // Write HTML to temp file
  const tempHtml = path.join(process.cwd(), 'temp_code.html');
  fs.writeFileSync(tempHtml, html);
  
  await page.goto(`file://${tempHtml}`);
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  const screenshotPath = path.join(process.cwd(), 'code-screenshots', `${fileInfo.name.replace(/\s+/g, '_').toLowerCase()}.png`);
  
  // Ensure directory exists
  if (!fs.existsSync(path.dirname(screenshotPath))) {
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  }
  
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true
  });
  
  await browser.close();
  fs.unlinkSync(tempHtml);
  
  console.log(`✅ Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function main() {
  console.log('📸 Generating backend code screenshots...\n');
  
  for (const fileInfo of codeFiles) {
    try {
      await generateScreenshot(fileInfo);
    } catch (error) {
      console.error(`❌ Error generating screenshot for ${fileInfo.name}:`, error.message);
    }
  }
  
  console.log('\n✨ All screenshots generated successfully!');
  console.log('📁 Location: code-screenshots/');
}

main().catch(console.error);
