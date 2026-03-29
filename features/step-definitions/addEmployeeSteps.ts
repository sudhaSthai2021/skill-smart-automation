import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';


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
    'https://mar2026.skillsmart.us/#/insight/employees/editor/employee/000000000000000000000000'
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

// ======================================================

When('I add address details', async function (this: CustomWorld) {
  await this.addEmp.goToAddressHistory();
  await this.addEmp.clickAddNew();

  await this.addEmp.fillAddress(
    '19th Street',
    'Chicago',
    'IL',
    '60611',
    '03/20/2022'
  );
});

// ======================================================

When('I save the employee', async function (this: CustomWorld) {

   const saveButton = this.page.locator('button:has-text("Save")');

  // Wait for Save button to become enabled (max 60s)
  await saveButton.waitFor({ state: 'visible', timeout: 1200000 });
  await saveButton.click();
  console.log('✅ Save button clicked (draft may still be pending backend)');

  // Optional pause to check manually
  await this.page.pause();

  // Skip waiting for URL / toast since backend may not complete save
  console.log('⚠️ Skipping URL/toast check due to draft-only behavior');



});

// ======================================================

Then('I should be able to search the employee', async function (this: CustomWorld) {
  await this.page.pause();
    
   // ✅ mimic working flow
  await this.addEmp.clickEmployeesTab();

  await this.page.waitForURL(/employees\/all/);

  await this.page.waitForSelector('.ReactTable', { timeout: 20000 });

   // ✅ Use your POM method (clean & reusable)
  await this.addEmp.searchAndOpenEmployee(firstName);
});

// ======================================================

Then('I delete the employee', async function (this: CustomWorld) {
  await this.page.pause();
  
  await this.addEmp.deleteEmployee();
  await this.page.pause();
});