import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';

const DEFAULT_PROJECT = 'CSI-000002 | WTP Access Control Systems - Phase 1';

function resolveProjectName(projectName: string): string {
  return projectName === 'DEFAULT_PROJECT'
    ? DEFAULT_PROJECT
    : projectName;
}

function ensurePayrollData(world: CustomWorld) {
  if (!world.startDate || !world.endDate) {
    throw new Error('❌ Payroll dates missing');
  }

  if (!world.payrollData.length) {
    throw new Error('❌ Payroll data missing');
  }
}


// ======================================================
// COMMON STEPS
// ======================================================

Given('I navigate to the application login page', async function (this: CustomWorld) {
  await this.login.goto();
});

When('I login as user {string} with password {string}', async function (this: CustomWorld, email: string, password: string) {
  await this.login.login(email, password);

  await this.page.waitForLoadState('networkidle');

  await Promise.race([
    this.page.waitForURL('**/project/select', { timeout: 30000 }),
    this.page.waitForURL('**/dashboard', { timeout: 30000 })
  ]);
});


When(
  'I navigate to the {string}',
  async function (this: CustomWorld, projectName: string) {
    const finalProject = resolveProjectName(projectName);

    console.log(`--- Navigating to project: ${finalProject}`);

    if (!this.page.url().includes('/project/select')) {
      console.log('--- Already inside a project, skipping selection');
      return;
    }

    await this.nav.selectProject(finalProject);

    console.log('--- Project selected successfully');
  }
);


// ======================================================
// SUBCONTRACTOR STEPS
// ======================================================

When('I go to Labor Tracking -> Payroll -> View All Payrolls', async function (this: CustomWorld) {
  await this.laborTracking.navigateToAllPayrolls();
  await this.laborTracking.selectLatestSignedPayrollPeriod();

  // Ensure UI reflects selected payroll
await this.page.waitForLoadState('networkidle');
});

When(
  'I extract payroll standard data for the current period',
  async function (this: CustomWorld) {
    console.log('--- Extracting payroll data');

    await this.page.waitForFunction(() => {
      const rows = document.querySelectorAll('.ReactTable .rt-tbody .rt-tr');

      return Array.from(rows).some(row =>
        (row.textContent || '').trim().length > 0
      );
    });

    const { startDate, endDate } =
      await this.laborTracking.getSelectedPayrollDates();

    if (!startDate || !endDate) {
      throw new Error('❌ Payroll dates not found in UI');
    }

    this.startDate = startDate;
    this.endDate = endDate;

    this.payrollData =
      await this.laborTracking.extractStandardPayrollData();

    if (!this.payrollData.length) {
      throw new Error('❌ No payroll data extracted');
    }

    console.log('✅ Payroll data ready:', {
      startDate: this.startDate,
      endDate: this.endDate,
      rows: this.payrollData.length,
    });
  }
);

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


When(
  'I generate all available reports',
  { timeout: 600000 }, // 10 minutes
  async function (this: CustomWorld) {

    if (!this.startDate || !this.endDate) {
      throw new Error('❌ Dates missing before report generation');
    }

    await this.reports.generateAllReports(
      this.startDate!,
      this.endDate!,
      this.payrollData
    );

  }
);
// ======================================================
// ✅ FINAL ASSERTION STEP (OPTIONAL / LIGHT)
// ======================================================

Then('the report should match payroll data', async function () {
  // ✅ Intentionally empty
  // Validation already happens inside ReportsPage
  //await this.page.pause();
});