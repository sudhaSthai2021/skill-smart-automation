import { Before, After , setDefaultTimeout } from '@cucumber/cucumber';
import { CustomWorld } from './world';

// ✅ increase timeout to 60 seconds
setDefaultTimeout(180 * 1000);

Before(async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld) {
  await this.close();
});