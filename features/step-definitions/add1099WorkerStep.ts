import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';


// ======================================================
// 🔐 LOGIN AS SUBCONTRACTOR
// ======================================================

Given('I login as subcontractor for 1099', async function (this: CustomWorld) {
  //await this.login.navigateToLoginPage();

  await this.login.goto();
  await this.login.login('metadata@gmaiil.com', 'Govind@2003');

  await this.page.waitForLoadState('networkidle');
  
  
});



// ======================================================
// 📁 SELECT PROJECT
// ======================================================

Given('I select project', async function (this: CustomWorld) {
  const projectName = 'CSI-000002 | WTP Access Control Systems - Phase 1';

  console.log(`--- Selecting project: ${projectName}`);

  await this.nav.selectProject(projectName);

  //await this.page.getByText(projectName, { exact: true }).click();

  console.log('--- Project selected successfully');
});

// ======================================================
// ➕ NAVIGATE TO ADD 1099 WORKER
// ======================================================


When('I navigate to Add 1099 Worker page', async function (this: CustomWorld) {
  await this.laborTracking.goToAdd1099Worker();

});




// ======================================================
// 🧾 CREATE WORKER
// ======================================================

When('I create 1099 worker', async function (this: CustomWorld) {

  // Extract org (optional but useful)
  this.organization = await this.add1099.extractOrganization();

 const data = await this.add1099.fillBasicDetails();
 this.workerFirstName =data.firstName;
 this.workerLastName=data.lastName;
 this.workerName = `${data.firstName} ${data.lastName}`; // ✅ correct

  await this.add1099.addAddress();

  await this.add1099.selectWorkClasses();
//await this.page.pause();
});


// ======================================================
// 💾 SAVE
// ======================================================

When('I save the worker', async function (this: CustomWorld) {
  await this.add1099.saveWorker();

  // capture full name before toast disappears
  this.workerFullName = this.workerName;
   console.log(`✅ Worker "${this.workerName}" is saved successfully`);

   //await this.add1099.goToWorkersListFromAddPage();

   
});



// ======================================================
// 🔍 SEARCH + VERIFY
// ======================================================


Then('I should find the worker in list', async function (this: CustomWorld) {
   await this.laborTracking.goToWorkerTab(); // REQUIRED

   await this.add1099.searchAndOpen(this.workerFirstName);

  
});
  





// ======================================================
// 🚪 LOGOUT
// ======================================================



// ======================================================
// 🔐 LOGIN AS ADMIN
// ======================================================



// ======================================================
// 🗂 NAVIGATE TO VIEW ALL 1099 WORKERS
// ======================================================

When('I navigate to View All 1099 Workers', async function (this: CustomWorld) {
  await this.laborTracking.goToView1099Workers();

  //await this.page.getByText('1099 Management').click();

 // await expect(this.page.locator('text=1099 Worker List')).toBeVisible();
});

// ======================================================
// ❌ DELETE WORKER
// ======================================================

Then('I delete the 1099 worker', async function (this: CustomWorld) {
  // navigate if needed
  await this.laborTracking.goToView1099Workers();

  await this.page.getByText('1099 Management').click();

  // search worker
  const search = this.page.locator('input[placeholder="Search"]');
  await search.fill(this.workerName);

  await this.page.waitForTimeout(2000);

  const row = this.page.locator(`.rt-tr-group:has-text("${this.workerName}")`);

  await expect(row).toBeVisible({ timeout: 10000 });

  // open row
  await row.first().click();

  
});

