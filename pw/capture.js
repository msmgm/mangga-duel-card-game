const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8910;
const GAME_DIR = path.resolve(__dirname, '../game');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

// Simple static server
const server = http.createServer((req, res) => {
  let filePath = path.join(GAME_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(GAME_DIR, 'index.html');
  }
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  if (extname === '.js') contentType = 'application/javascript';
  else if (extname === '.css') contentType = 'text/css';
  else if (extname === '.json') contentType = 'application/json';
  else if (extname === '.png') contentType = 'image/png';
  else if (extname === '.jpg') contentType = 'image/jpeg';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(504);
      res.end('Server Error: ' + error.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const shotsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../shots.json'), 'utf8'));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const consoleErrors = [];

  for (const shot of shotsData) {
    const page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const url = `http://localhost:${PORT}/index.html${shot.query}`;
    console.log(`Capturing ${shot.name} at ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for window.__shotReady === true or timeout
    try {
      await page.waitForFunction(() => window.__shotReady === true, { timeout: 5000 });
    } catch (e) {
      console.log(`Warning: __shotReady not set for ${shot.name}, proceeding anyway.`);
    }

    // Additional small delay for rendering
    await page.waitForTimeout(500);

    let quality = 80;
    let outPath = path.join(SCREENSHOTS_DIR, shot.name);
    
    while (quality >= 20) {
      await page.screenshot({ path: outPath, type: 'jpeg', quality });
      const stats = fs.statSync(outPath);
      console.log(`  ${shot.name} (quality ${quality}): ${(stats.size / 1024).toFixed(2)} KiB`);
      if (stats.size <= 256 * 1024) {
        break;
      }
      quality -= 10;
    }

    await page.close();
  }

  // Interactive play-test simulation & check
  console.log('Running interactive play-test simulation...');
  const interactivePage = await context.newPage();
  interactivePage.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await interactivePage.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' });
  await interactivePage.waitForTimeout(500);

  // Click MAIN button on title screen
  // CONFIG.WIDTH / 2 is 480 or canvas center. Canvas is 960x640 or similar. Let's click center (480, 570)
  console.log('Clicking MAIN button...');
  await interactivePage.mouse.click(480, 570);
  await interactivePage.waitForTimeout(1000);

  // Click first card in player hand (hand cards are around y=480..640)
  console.log('Clicking first player card...');
  // Let's click at x=350, y=550
  await interactivePage.mouse.click(350, 550);
  await interactivePage.waitForTimeout(1500);

  // Click again to dismiss round result overlay
  console.log('Dismissing round result...');
  await interactivePage.mouse.click(480, 300);
  await interactivePage.waitForTimeout(1000);

  console.log(`Total console errors captured: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }

  await browser.close();
  server.close();
  console.log('Capture & Play-test completed successfully.');
});
