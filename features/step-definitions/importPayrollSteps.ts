import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { payrollMapping } from '../../test-data/payrollMapping';

const PAYROLL_FILE_PATH = 'test-data/payroll.xlsx';

const cleanText = (value: string = '') =>
  value.replace(/\s+/g, ' ').trim();

// ======================================================
// ✅ LOGIN
// ======================================================



Given('I login as subcontractor', async function (this: CustomWorld) {
  await this.login.goto();
  await this.login.login('metadata@gmaiil.com', 'Govind@2003');

  await this.page.waitForLoadState('networkidle');
});

// ======================================================
// ✅ SELECT PROJECT
// ======================================================

Given('I select the project', async function (this: CustomWorld) {
  await this.nav.selectProject('CSI-000002 | WTP Access Control Systems - Phase 1');
});

// ======================================================
// ✅ NAVIGATION
// ======================================================

When(
  'I navigate to Labor Tracking -> Payroll -> Import Payroll', async function (this: CustomWorld) {
    await this.laborTracking.goToImportPayroll();
  }
);



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

When(
  'I select the imported payroll report period', async function (this: CustomWorld) {
    const period = await this.importPayroll.getImportedPayrollPeriodFromFile(
      'test-data/payroll.xlsx'
    );

    await this.laborTracking.selectPayrollPeriodByText(period);

    const [startDate, endDate] = period.split('-').map(x => x.trim());

    this.startDate = startDate;
    this.endDate = endDate;

    console.log(`Selected imported payroll period: ${period}`);
  }
);


Then('I should see the imported payroll in the list', async function () {
  await this.laborTracking.verifyPayrollCreated();
  
});

Then('I extract organization and payroll period for the imported payroll', async function (this: CustomWorld) {
  const { startDate, endDate } = await this.laborTracking.getSelectedPayrollDates();

  this.startDate = cleanText(startDate.split('\n')[0]);
  this.endDate = cleanText(endDate.split('\n')[0]);

  this.organization = cleanText(
    await this.page
      .locator('label:has-text("Organization")')
      .locator('xpath=following::div[@role="button"][1]//p')
      .innerText()
  );

  console.log('✅ Imported Payroll Stored:', {
    organization: this.organization,
    startDate: this.startDate,
    endDate: this.endDate,
  });
});

/*

Then(
  'I extract organization and payroll period for the imported payroll', async function (this: CustomWorld) {

    console.log('--- Extracting payroll metadata');

    // ✅ Dates (already correct)
    const { startDate, endDate } = await this.laborTracking.getSelectedPayrollDates();
    this.startDate = startDate.split('\n')[0].trim();
    this.endDate = endDate.split('\n')[0].trim();

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
*/
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

Then('I delete the payroll using extracted data', async function (this: CustomWorld) {
  await this.laborTracking.deletePayroll(
    this.organization!,
    this.startDate!,
    this.endDate!
  );
});
