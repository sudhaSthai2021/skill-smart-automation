import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';

// ======================================================
// COMMON STEPS
// ======================================================

Given('I navigate to the application login page', async function (this: CustomWorld) {
  await this.login.goto();
});

When('I login as user {string} with password {string}', async function (this: CustomWorld, email: string, pass: string) {
  await this.login.login(email, pass);

  await this.page.waitForLoadState('networkidle');

  // ✅ Handle both possible landings
  await Promise.race([
    this.page.waitForURL('**/project/select', { timeout: 30000 }),
    this.page.waitForURL('**/dashboard', { timeout: 30000 })
  ]);
});

When('I navigate to the {string}', async function (this: CustomWorld, projectName: string) {

  if (projectName === 'DEFAULT_PROJECT') {
    projectName = 'CA Test Project 1';
  }

  console.log(`--- Navigating to project: ${projectName}`);

  await this.page.waitForURL('**/project/select', { timeout: 30000 });

  // ✅ Step 1: exact project text
  const projectTitle = this.page.locator('p', { hasText: projectName }).first();

  await projectTitle.waitFor({ state: 'visible', timeout: 20000 });

  console.log('--- Exact project title found');

  // 🔥 Step 2: go ONLY to nearest card that has Select button
  const projectCard = projectTitle.locator(
    'xpath=ancestor::div[.//button[.//span[text()="Select"]]][1]'
  );

  // ✅ Step 3: scroll correct card
  await projectCard.scrollIntoViewIfNeeded();

  console.log('--- Scrolled to correct project card');

  // ✅ Step 4: click inside that card ONLY
  await projectCard.locator('button:has-text("Select")').click();

  await this.page.waitForURL(/dashboard/, { timeout: 30000 });

  console.log('--- Correct project selected successfully');
});
// ======================================================
// SUBCONTRACTOR STEPS
// ======================================================

When('I go to Labor Tracking -> Payroll -> View All Payrolls', async function (this: CustomWorld) {
  await this.laborTracking.navigateToAllPayrolls();
  // Automatically select the period marked as "SIGNED"
  await this.laborTracking.selectLatestSignedPayrollPeriod();

});



When('I extract payroll standard data for the current period', async function (this: CustomWorld){
  console.log('--- Extracting payroll table data...');
  await this.page.waitForFunction(() =>{
  const table = document.querySelector('table tbody');
    if (!table) return false;

       const rows = Array.from(table.querySelectorAll('tr'));
       return rows.some(row => {
       const text = row.textContent || '';
       return !text.includes('Select a Payroll') && !text.includes('Loading');
       });
      },{timeout:30000});



  // ✅ FIXED LINE
  this.payrollData = await this.laborTracking.extractStandardPayrollData();


 console.log('--- Stored payroll data:', this.payrollData);

 // ✅ SAFETY CHECK
  if (!Array.isArray(this.payrollData)) {
    throw new Error('❌ payrollData is NOT an array. Got: ' + JSON.stringify(this.payrollData));
  }

  console.log('================ PAYROLL DATA =================');

this.payrollData.forEach((row, index) => {
  console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
});

console.log('===============================================');

 for (const row of this.payrollData) {
  // ✅ Basic field validations
  expect(row.fullName).not.toBe('');
  expect(row.employeeFirst).not.toBe('');
  expect(row.employeeLast).not.toBe('');
  expect(row.workClass).not.toBe('');
  expect(row.jobLevel).not.toBe('');

  // ✅ Numeric validations
  expect(row.hours).toBeGreaterThanOrEqual(0);
  expect(row.otHours).toBeGreaterThanOrEqual(0);
  expect(row.dtHours).toBeGreaterThanOrEqual(0);

  expect(row.grossWages).toBeGreaterThanOrEqual(0);
  expect(row.netWages).toBeGreaterThanOrEqual(0);

  // ✅ Logical validation
  expect(row.grossWages).toBeGreaterThanOrEqual(row.netWages);

  // ✅ Data sanity checks
  expect(row.fullName).not.toMatch(/UNKN|Select|Loading/i);
  expect(row.workClass).not.toMatch(/UNKN|Select|Loading/i);
}
});

Then('I log out of the application', async function (this: CustomWorld) {
  

  await this.nav.logout();
  // ✅ Wait until logout is fully complete
  await this.page.waitForLoadState('networkidle');

  // ✅ Optional (stronger check – recommended)
  await this.page.waitForURL(/login|signin/, { timeout: 20000 });

  console.log('--- Logged out successfully');
 
});





// ======================================================
// ADMIN STEPS
// ======================================================

When(/^I go to Reporting -> Reports and Downloads -> Generate\/View Reports$/, async function (this: CustomWorld) {
  await this.nav.navigateToReporting();
});

When('I generate the {string} for the extracted date range', async function (this: CustomWorld, reportName: string) {
  const startDate = "03/30/2026";
  const endDate = "04/05/2026";

  console.log(`--- Generating ${reportName} for range: ${startDate} to ${endDate}`);
  this.reportPath = await this.reports.generateRatesAndWagesReport(startDate, endDate);
});

Then('the downloaded Excel report should contain matching payroll data', async function (this: CustomWorld) {
  console.log('--- Starting final Excel data verification...');
  await this.reports.verifyExcelData(this.reportPath, this.payrollData);
});

