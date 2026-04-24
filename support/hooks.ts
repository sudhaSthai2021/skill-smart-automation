import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { chromium, Browser } from 'playwright';

setDefaultTimeout(180 * 1000);

let browser: Browser;

// ✅ Launch browser once
BeforeAll(async function () {
  browser = await chromium.launch({ headless: false, slowMo: 1000 });
});

// ✅ New context per scenario (NO storageState)
Before(async function (this: CustomWorld) {
  await this.init(browser);
});

// ✅ Close only context
After(async function (this: CustomWorld) {
  await this.page.context().close();
});

// ✅ Close browser once
AfterAll(async function () {
  await browser.close();
});


// ✅ Close browser once
AfterAll(async function () {
  await browser.close();
});