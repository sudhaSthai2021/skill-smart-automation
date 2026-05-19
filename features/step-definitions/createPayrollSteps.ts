import { When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';



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
  const dates = this.createPayroll.extractDates(period);

  this.startDate = dates.startDate;
  this.endDate = dates.endDate;

  await this.createPayroll.clickCreate();
});


// ======================================================

When('I fill payroll details', async function (this: CustomWorld) {
   if (!this.startDate) {
    throw new Error('❌ Payroll start date missing');
  }

  const paycheck = `PAY-${Date.now()}`;
 
  await this.createPayroll.fillHeader(paycheck, this.startDate);
  await this.createPayroll.fillHours();
});

// ======================================================
When('I save payroll', async function (this: CustomWorld) {
  await this.createPayroll.save();
  await this.storeCreatedPayroll();
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
