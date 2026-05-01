import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { payrollMapping } from '../../test-data/payrollMapping';

// ✅ Debug log
console.log('✅ importPayrollSteps loaded');

// ======================================================
// ✅ LOGIN
// ======================================================

Given('I login as subcontractor', async function (this: CustomWorld) {
  await this.login.goto();
  await this.login.login('metadata@gmaiil.com', 'Govind@2003');

  //const selectButton = this.page.getByRole('button', { name: 'Select' }).first();
  //await selectButton.click();

  //await expect(this.page).toHaveURL(/dashboard/);
  await this.page.waitForLoadState('networkidle');
});

// ======================================================
// ✅ SELECT PROJECT
// ======================================================

Given('I select the project', async function (this: CustomWorld) {
  const projectName = 'CSI-000002 | WTP Access Control Systems - Phase 1';

  console.log(`--- Selecting project: ${projectName}`);

  await this.nav.selectProject(projectName);

  //await this.page.getByText(projectName, { exact: true }).click();

  console.log('--- Project selected successfully');
});

// ======================================================
// ✅ NAVIGATION
// ======================================================

When(
  'I navigate to Labor Tracking -> Payroll -> Import Payroll',
  async function (this: CustomWorld) {
    await this.laborTracking.goToImportPayroll();
  }
);

// ======================================================
// ✅ COLUMN MAPPING DATA
// ======================================================
/*
const columnMapping = [
  "First Name",
  "Last Name",
  "SSN",
  "Ethnicity",
  "Gender",
  "Street 1",
  "City",
  "State",
  "Zip Code",
  "Work Classification",
  "Job id",
  "Date",
  "Base Rate",
  "Overtime Rate",
  "Double Time Rate",
  "Regular Hours",
  "Overtime Hours",
  "Double Time Hours",
  "Regular Earnings",
  "Overtime Earnings",
  "Doubletime Earnings"
];
*/

// ======================================================
// ✅ EXISTING STEPS (UNCHANGED)
// ======================================================

When('I create a new payroll layout with name {string}', async function (this: CustomWorld, name: string) {
  await this.importPayroll.createLayout(name);
});

When('I configure column mapping from A to U', async function () {

  await this.importPayroll.mapColumns(payrollMapping);

});

When('I save the layout', async function (this: CustomWorld) {
  await this.importPayroll.saveLayout();
});

When('I select the layout {string}', async function (this: CustomWorld, name: string) {
  await this.importPayroll.selectLayout(name);
});

When('I download the template', async function (this: CustomWorld) {
  await this.importPayroll.getTemplate();
});

When('I upload the payroll file {string}', async function (this: CustomWorld, file: string) {
  await this.importPayroll.uploadFile(`test-data/${file}`);
});

When('I test import', async function (this: CustomWorld) {
  await this.importPayroll.testImport();
});

// ======================================================
// ✅ VALIDATION
// ======================================================

Then('I should not see any validation errors', async function (this: CustomWorld) {
 const hasError = await this.importPayroll.hasValidationError();

expect(hasError).toBeFalsy();
});

// ======================================================
// ✅ FINAL IMPORT
// ======================================================

Then('I import the payroll', async function (this: CustomWorld) {
  await this.importPayroll.importPayroll();
});

// Navigate to View All Payrolls
When(
  'I navigate to Labor Tracking -> Payroll -> View All Payrolls',
  async function () {
    await this.laborTracking.navigateToAllPayrolls();
  }
);

// Select latest payroll period (SIGNED)
When(
  'I select the latest payroll report period',
  async function () {
    await this.laborTracking.selectLatestSignedPayrollPeriod();
  }
);

Then('I should see the imported payroll in the list', async function () {
  await this.laborTracking.verifyPayrollCreated();
  
});

Then(
  'I extract organization and payroll period for the imported payroll',
  async function (this: CustomWorld) {

    console.log('--- Extracting payroll metadata');

    // ✅ Dates (already correct)
    const { startDate, endDate } =
      await this.laborTracking.getSelectedPayrollDates();

    this.startDate = startDate;
    this.endDate = endDate;

    // ✅ Wait for table to be ready
    const row = this.page.locator('.ReactTable .rt-tr-group').first();
    await row.waitFor({ state: 'visible' });

    // ✅ Extract organization from row (NOT global page)
   const org = await this.page
  .locator('label:has-text("Organization")')
  .locator('xpath=following::div[@role="button"][1]//p')
  .innerText();
    this.organization = org.trim();

    console.log(`--- Dates: ${this.startDate} → ${this.endDate}`);
    console.log(`--- Organization: ${this.organization}`);
  }
);
Then('I logout', async function (this: CustomWorld) {
  await this.nav.logout();
});
Then('I login as admin', async function (this: CustomWorld) {
  await this.login.goto();
  await this.login.login('nikhil.k@sthai.co.in', 'Password');

  await this.page.waitForLoadState('networkidle');

// Accept BOTH possibilities
await expect(this.page).toHaveURL(/dashboard|project\/select/);
});

Then(
  'I delete the payroll using extracted data',
  async function (this: CustomWorld) {

    console.log(
      `--- Deleting payroll: ${this.organization} ${this.startDate} ${this.endDate}`
    );

    await this.laborTracking.deletePayroll(
      this.organization!,
      this.startDate!,
      this.endDate!
    );
  }
);
