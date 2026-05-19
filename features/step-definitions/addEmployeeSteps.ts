import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { PROJECT_NAME, USERS } from '../../test-data/testData';

console.log('✅ reportVerificationSteps loaded');

//let firstName: string;

// ======================================================

Given('I login to the application', async function (this: CustomWorld) {
  await this.login.goto();

  await this.login.login(
    USERS.subcontractor1.email,
    USERS.subcontractor1.password
  );

  await this.nav.selectProject(PROJECT_NAME);

  await expect(this.page).toHaveURL(/dashboard/);
});





// ======================================================
When('I navigate to Add Employee page', async function (this: CustomWorld) {
  await this.laborTracking.goToAddEmployeeAndVerify();
});



// ======================================================


When('I create a new employee', async function (this: CustomWorld) {
  const data = await this.addEmp.fillBasicDetails();

  this.workerFirstName = data.firstName;
  this.workerLastName = data.lastName;
  this.workerFullName = `${data.firstName} ${data.lastName}`;
});



// ======================================================

When('I fill employee details', async function (this: CustomWorld) {
  await this.addEmp.fillEmployeeDetails('Male', 'Asian');
});



//============================================================

When('I add address details', async function (this: CustomWorld) {
  await this.addEmp.addAddressDetails(
    '19th Street',
    'Chicago',
    'IL',
    '60611',
    '03/20/2022'
  );
});

//=======================================================================
// ✅ NEW STEP
When('I save address details', async function (this: CustomWorld) {
  await this.addEmp.clickSave();
});
//=======================================================================


When('I fill work info', async function (this: CustomWorld) {
  await this.addEmp.fillWorkInfo();
});

// ✅ NEW STEP
When('I save work info', async function (this: CustomWorld) {
  await this.addEmp.clickSave();
})

//========================================================================

When('I add pay rates', async function (this: CustomWorld) {
  await this.addEmp.addPayRates();
});

// ========================================================================



Then('I should be able to search the employee', async function (this: CustomWorld) {
  
    
   // ✅ mimic working flow
  await this.addEmp.clickEmployeesTab();

  await this.page.waitForURL(/employees\/all/);

  await this.page.waitForSelector('.ReactTable', { timeout: 20000 });

  // ✅ ADD THIS (important)
  await this.page.waitForTimeout(3000); // allow backend sync
 

   // ✅ Use your POM method (clean & reusable)
  await this.addEmp.searchAndOpenEmployee(this.workerFirstName);
});

// ======================================================

Then('I delete the employee', async function (this: CustomWorld) {
  
  
  await this.addEmp.deleteEmployee();
  
});