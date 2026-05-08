import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';
import { expect } from '@playwright/test';

// ======================================================
// CREATE PAYROLL
// ======================================================
When(
  'I navigate to Labor Tracking -> Payroll -> Create Payroll',
  async function (this: CustomWorld) {
    await this.laborTracking.goToCreatePayroll();
  }
);

When('I create a payroll', async function (this: CustomWorld) {
  const period = await this.createPayroll.selectPayrollPeriod();

  const { startDate, endDate } =
    this.createPayroll.extractDates(period);

  this.startDate = startDate;
  this.endDate = endDate;

  await this.createPayroll.clickCreate();
});

// ======================================================

When('I fill payroll details', async function (this: CustomWorld) {
  const paycheck = `PAY-${Date.now()}`;
 // this.payrollId = paycheck;

  await this.createPayroll.fillHeader(paycheck, this.startDate!);
  await this.createPayroll.fillHours();
});

// ======================================================

When('I save payroll', async function (this: CustomWorld) {
  await this.createPayroll.save();

  const clean = (value: string) =>
    value
      .replace(/SIGNED/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

  const organization = clean(await this.createPayroll.extractOrganization());

  this.organization = organization;

  this.createdPayroll = {
    organization,
    startDate: clean(this.startDate!),
    endDate: clean(this.endDate!),
  };

  console.log('✅ Created Payroll Stored:', this.createdPayroll);
});


// ======================================================

When('I sign payroll', async function (this: CustomWorld) {
  await this.createPayroll.signPayroll();
});

// ======================================================

When('I generate A-1-131', async function (this: CustomWorld) {
  await this.createPayroll.generateA1131();
  await this.createPayroll.completeGeneration();
});

// ======================================================

Then('I capture payroll week ending', async function (this: CustomWorld) {
  const week = await this.createPayroll.extractWeekEnding();
  console.log('Week Ending:', week);
});

// ======================================================
// DELETE (reuse existing logic)
// ======================================================

Then('I delete created payroll', async function (this: CustomWorld) {
  if (!this.createdPayroll) {
    throw new Error('❌ No created payroll stored for deletion');
  }

  console.log('--- Deleting created payroll with stored data:', this.createdPayroll);

  await this.laborTracking.deletePayroll(
    this.createdPayroll.organization,
    this.createdPayroll.startDate,
    this.createdPayroll.endDate
  );
});
