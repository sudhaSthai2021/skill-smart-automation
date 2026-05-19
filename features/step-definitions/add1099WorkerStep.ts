import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';
import { PROJECT_NAME, USERS } from '../../test-data/testData';

console.log('✅ add1099WorkerSteps loaded');


// ======================================================
// 🔐 LOGIN AS SUBCONTRACTOR
// ======================================================

Given('I login as subcontractor for 1099', async function (this: CustomWorld) {
  
  await this.login.goto();
  await this.login.login(
    USERS.subcontractor.email,
    USERS.subcontractor.password
  );

  await this.page.waitForLoadState('networkidle');
  
  
});



// ======================================================
// 📁 SELECT PROJECT
// ======================================================

Given('I select project', async function (this: CustomWorld) {
  await this.nav.selectProject(PROJECT_NAME);
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


  this.organization = await this.add1099.extractOrganization();

 const data = await this.add1099.fillBasicDetails();
 this.workerFirstName =data.firstName;
 this.workerLastName=data.lastName;
 this.workerName = `${data.firstName} ${data.lastName}`; // ✅ correct
 this.workerFullName = this.workerName;

  await this.add1099.addAddress();

  await this.add1099.selectWorkClasses();

});


// ======================================================
// 💾 SAVE
// ======================================================

When('I save the worker', async function (this: CustomWorld) {
  await this.add1099.saveWorker();

   console.log(`✅ Worker "${this.workerName}" is saved successfully`);


   
});



// ======================================================
// 🔍 SEARCH + VERIFY
// ======================================================


Then('I should find the worker in list', async function (this: CustomWorld) {
   await this.laborTracking.goToWorkerTab(); // REQUIRED

   await this.add1099.searchAndOpen(this.workerFirstName);

  
});
  


// ======================================================
// 🗂 NAVIGATE TO VIEW ALL 1099 WORKERS
// ======================================================

When('I navigate to View All 1099 Workers', async function (this: CustomWorld) {
  await this.laborTracking.goToView1099Workers();

});

// ======================================================
// ❌ DELETE WORKER
// ======================================================


Then('I delete the 1099 worker', async function (this: CustomWorld) {
  await this.laborTracking.goToView1099Workers();

  await this.add1099.searchAndOpenWorkerFromViewAll(this.workerName);
});


