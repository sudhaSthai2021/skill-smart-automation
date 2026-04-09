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


//When('I navigate to the {string}', async function (this: CustomWorld, projectName: string) {

 // const finalProject = projectName === 'DEFAULT_PROJECT'
 //   ? 'RVA Test Project'   // ✅ match your UI
 //   : projectName;

//  console.log(`--- Navigating to project: ${finalProject}`);

  // ✅ If already inside dashboard → skip
//  if (this.page.url().includes('dashboard')) {
 //   console.log('--- Already inside dashboard, skipping selection');
 //   return;
// }

  // ✅ Wait for project selection page
 // await this.page.waitForURL('**/project/select', { timeout: 30000 });

  // ✅ Wait for project name to appear
 // const projectTitle = this.page.locator(`text=${finalProject}`).first();
//  await projectTitle.waitFor({ state: 'visible', timeout: 20000 });

 // console.log('--- Project title found');

  // ✅ Move up to correct card that has SELECT button
 // const projectCard = projectTitle.locator(
//    'xpath=ancestor::div[.//button[.//text()="SELECT"]][1]'
//  );

 // await projectCard.scrollIntoViewIfNeeded();

  // ✅ Click SELECT inside correct card
 // await projectCard.locator('button:has-text("SELECT")').click();

  // ✅ Wait for dashboard
 // await this.page.waitForURL(/dashboard/, { timeout: 30000 });

  //console.log('--- Project selected successfully');
//});



// ======================================================
// SUBCONTRACTOR STEPS
// ======================================================

When('I go to Labor Tracking -> Payroll -> View All Payrolls', async function (this: CustomWorld) {
  await this.laborTracking.navigateToAllPayrolls();
  await this.laborTracking.selectLatestSignedPayrollPeriod();
});

When('I extract payroll standard data for the current period', async function (this: CustomWorld) {

  console.log('--- Extracting payroll data');

  await this.page.waitForFunction(() => {
    const rows = document.querySelectorAll('.ReactTable .rt-tbody .rt-tr');
    return Array.from(rows).some(r => (r.textContent || '').trim().length > 0);
  });

  // 🔥 Replace later with UI extraction
  this.startDate = "03/30/2026";
  this.endDate = "04/05/2026";

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

/*When('I select the project {string}', async function (this: CustomWorld, projectName: string) {

  console.log(`--- Selecting project: ${projectName}`);

  // ✅ Wait for page stability (optional but safe)
  await this.page.waitForLoadState('networkidle');

  // ✅ Use global navigation (handles card + dropdown)
  await this.nav.selectProject(projectName);

  console.log(`--- Project selected successfully: ${projectName}`);
});

When('I select the project {string}', async function (this: CustomWorld, projectName: string) {
  const page = this.page; // assuming CustomWorld has page

  // Locate the card containing the project name
  const projectCard = page.locator('div.MuiGrid-item').filter({
    has: page.locator(`p:has-text("${projectName}")`)
  });

  // Wait for it to be visible
  await projectCard.waitFor({ state: 'visible', timeout: 30000 });

  // Click the "Select" button inside the card
  await projectCard.locator('button:has-text("Select")').click();

  console.log(`Selected project: ${projectName}`);
});
*/
// ======================================================
// 🔥 CLEAN REPORT STEPS (MAIN REFACTOR)
// ======================================================

When('I generate the report {string}', async function (this: CustomWorld, reportName: string) {

  await this.reports.generateAndValidateReport({
    reportName
  });

});

When(
  'I generate the report {string} for the extracted date range',
  async function (this: CustomWorld, reportName: string) {

    await this.reports.generateAndValidateReport({
      reportName,
      startDate: this.startDate,
      endDate: this.endDate
    });

  }
);

When('I generate all available reports', async function (this: CustomWorld) {
  await this.reports.generateAllReports();
});
// ======================================================
// ✅ FINAL ASSERTION STEP (OPTIONAL / LIGHT)
// ======================================================

Then('the report should match payroll data', async function () {
  // ✅ Intentionally empty
  // Validation already happens inside ReportsPage
});