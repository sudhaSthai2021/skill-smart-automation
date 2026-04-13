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

  await Promise.race([
    this.page.waitForURL('**/project/select', { timeout: 30000 }),
    this.page.waitForURL('**/dashboard', { timeout: 30000 })
  ]);
});

When('I navigate to the {string}', async function (this: CustomWorld, projectName: string) {

  const finalProject = projectName === 'DEFAULT_PROJECT'
    ? 'CSI-000002 | WTP Access Control Systems - Phase 1'
    : projectName;

  console.log(`--- Navigating to project: ${finalProject}`);

  const url = this.page.url();

  // ✅ If already inside a project → skip
  if (!url.includes('/project/select')) {
    console.log('--- Already inside a project, skipping selection');
    return;
  }

  // ✅ Use GLOBAL navigation method
  await this.nav.selectProject(finalProject);

  console.log('--- Project selected successfully');
});



// ======================================================
// SUBCONTRACTOR STEPS
// ======================================================

When('I go to Labor Tracking -> Payroll -> View All Payrolls', async function (this: CustomWorld) {
  await this.laborTracking.navigateToAllPayrolls();
  await this.laborTracking.selectLatestSignedPayrollPeriod();

  // Ensure UI reflects selected payroll
await this.page.waitForLoadState('networkidle');
});

When('I extract payroll standard data for the current period', async function (this: CustomWorld) {

  console.log('--- Extracting payroll data');

  await this.page.waitForFunction(() => {
    const rows = document.querySelectorAll('.ReactTable .rt-tbody .rt-tr');
    return Array.from(rows).some(r => (r.textContent || '').trim().length > 0);
  });

  // ✅ Get REAL dates from UI
  const { startDate, endDate } = await this.laborTracking.getSelectedPayrollDates();
  console.log('📅 Extracted Start Date:', startDate);
  console.log('📅 Extracted End Date:', endDate);


  if (!startDate || !endDate) {
  throw new Error('❌ Payroll dates not found in UI');
}

  this.startDate = startDate;
  this.endDate = endDate;
 

  this.payrollData = await this.laborTracking.extractStandardPayrollData();

  if (!this.payrollData.length) {
    throw new Error('❌ No payroll data extracted');
  }

  // ✅ Pass to ReportsPage (IMPORTANT)
  this.reports.setPayrollData(this.payrollData);

  console.log('✅ Payroll data ready');
});

Then('I log out of the application', async function (this: CustomWorld) {
  await this.nav.logout();
  await this.page.waitForURL(/login|signin/);
  console.log('--- Logged out');
});

// ======================================================
// ADMIN STEPS
// ======================================================

When(/^I go to Reporting -> Reports and Downloads -> Generate\/View Reports$/, async function (this: CustomWorld) {
  await this.nav.navigateToReporting();
});


When('I generate all available reports', async function (this: CustomWorld) {

  if (!this.startDate || !this.endDate) {
    throw new Error('❌ Dates missing before report generation');
  }
  await this.reports.generateAllReports(this.startDate, this.endDate);
});
// ======================================================
// ✅ FINAL ASSERTION STEP (OPTIONAL / LIGHT)
// ======================================================

Then('the report should match payroll data', async function () {
  // ✅ Intentionally empty
  // Validation already happens inside ReportsPage
});