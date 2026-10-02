// Optional: install playwright under your OS temporary directory/fdm-browser-tools,
// install its Chromium browser, start app.py, then run node tests/browser_smoke.cjs.
const path = require('path');
const fs = require('fs');
const os = require('os');
const {chromium} = require(path.join(os.tmpdir(), 'fdm-browser-tools', 'node_modules', 'playwright'));
(async () => {
  const browser = await chromium.launch({headless: true, channel: 'chromium'});
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const directory = path.join(__dirname, '..', 'doc', 'screenshots');
  fs.mkdirSync(directory, {recursive: true});
  const metadata = await (await page.request.get('http://127.0.0.1:5000/api/model')).json();
  const assessmentResponse = await page.request.post('http://127.0.0.1:5000/api/predict', {data: metadata.example});
  if (!assessmentResponse.ok()) throw new Error('Example API prediction failed');
  const expected = await assessmentResponse.json();
  await page.goto('http://127.0.0.1:5000', {waitUntil: 'networkidle'});
  await page.screenshot({path: path.join(directory, 'desktop-form.png')});
  await page.getByRole('button', {name: 'Load example booking'}).click();
  await page.getByRole('button', {name: 'Assess cancellation risk'}).click();
  await page.locator('#prediction').waitFor({state: 'visible'});
  const probability = await page.locator('#probability').textContent();
  const expectedProbability = `${(expected.cancellation_probability * 100).toFixed(2)}%`;
  if (probability !== expectedProbability) throw new Error(`UI/API probability mismatch: ${probability} vs ${expectedProbability}`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({path: path.join(directory, 'desktop-result.png')});
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Download assessment'}).click();
  const download = await downloadPromise;
  const downloaded = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  if (downloaded.assessment.prediction !== expected.prediction ||
      Math.abs(downloaded.assessment.cancellation_probability - expected.cancellation_probability) > 1e-12) throw new Error('Download does not match prediction');
  await page.locator('#adults').fill('0');
  if (await page.locator('#prediction').isVisible()) throw new Error('Stale result remains after editing');
  await page.getByRole('button', {name: 'Assess cancellation risk'}).click();
  await page.locator('#error-adults').filter({hasText: 'at least one guest'}).waitFor();
  await page.getByRole('button', {name: 'Load example booking'}).click();
  await page.setViewportSize({width: 390, height: 844});
  await page.getByRole('button', {name: 'Assess cancellation risk'}).click();
  await page.locator('#prediction').waitFor({state: 'visible'});
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile horizontal overflow');
  await page.screenshot({path: path.join(directory, 'mobile-result.png'), fullPage: true});
  await page.getByRole('button', {name: 'Clear form'}).click();
  if (await page.locator('#prediction').isVisible()) throw new Error('Reset did not clear result');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS: desktop prediction, JSON download, stale-result clearing, backend field error, mobile prediction/layout, reset, no JavaScript errors.');
  await browser.close();
})().catch(error => {console.error(error); process.exit(1);});
