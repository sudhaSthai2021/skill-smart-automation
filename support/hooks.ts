import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { chromium, Browser } from 'playwright';

setDefaultTimeout(180 * 1000);

let browser: Browser;

// ✅ Launch browser once
BeforeAll(async function () {
  browser = await chromium.launch({
    headless: false,
    //slowMo: 800, // ✅ reduce from 1000 → faster & more stable
  });
});

// ✅ New context per scenario
Before(async function (this: CustomWorld) {
  await this.init(browser);
});

// ✅ Proper cleanup
After(async function (this: CustomWorld) {
  if (this.context) {
    await this.context.close();
  }
});

// ✅ Close browser once
AfterAll(async function () {
  await browser.close();
});




/*


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

*/