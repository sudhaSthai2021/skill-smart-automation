import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
// ✅ ADD HERE (top level, not inside any function)
console.log('✅ reportVerificationSteps loaded');

let firstName: string;

// ======================================================

Given('I login to the application', async function (this: CustomWorld) {
  await this.login.goto();
  await this.login.login('360today@gmail.com', 'password');

  const selectButton = this.page.getByRole('button', { name: 'Select' }).first();
  await selectButton.click();

  await expect(this.page).toHaveURL(/dashboard/);
});

// ======================================================

Given('I navigate to Add Employee page', async function (this: CustomWorld) {
  await this.page.goto(
    'https://apr2026.skillsmart.us/#/insight/employees/editor/employee/000000000000000000000000'
  );

  await expect(this.page).toHaveURL(/employee\/000000/);
});

// ======================================================

When('I create a new employee', async function (this: CustomWorld) {
  const data = await this.addEmp.fillBasicDetails();
  firstName = data.firstName;
});

// ======================================================

When('I fill employee details', async function (this: CustomWorld) {
  await this.addEmp.selectGender('Male');
  await this.addEmp.selectEthnicity('Asian');
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



// ======================================================

Then('I should be able to search the employee', async function (this: CustomWorld) {
  //await this.page.pause();
    
   // ✅ mimic working flow
  await this.addEmp.clickEmployeesTab();

  await this.page.waitForURL(/employees\/all/);

  await this.page.waitForSelector('.ReactTable', { timeout: 20000 });

  // ✅ ADD THIS (important)
  await this.page.waitForTimeout(3000); // allow backend sync
 

   // ✅ Use your POM method (clean & reusable)
  await this.addEmp.searchAndOpenEmployee(firstName);
});

// ======================================================

Then('I delete the employee', async function (this: CustomWorld) {
  //await this.page.pause();
  
  await this.addEmp.deleteEmployee();
  //await this.page.pause();
});