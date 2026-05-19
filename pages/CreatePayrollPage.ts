import { Page, Locator, expect } from '@playwright/test';

export class CreatePayrollPage {
  readonly page: Page;


  readonly payrollPeriodDropdown: Locator;
  readonly createBtn: Locator;

  readonly paycheckInput: Locator;
  readonly paymentDateInput: Locator;

  readonly saveBtn: Locator;
  readonly successToast: Locator;

  readonly signBtn: Locator;
  readonly yesBtn: Locator;

  readonly generateBtn: Locator;

  constructor(page: Page) {
    this.page = page;
this.payrollPeriodDropdown = this.page.locator(
  '#mui-component-select-selectedDateRange'
);
    this.createBtn = page.getByRole('button', { name: /^Create$/i });

    this.paycheckInput = page.locator(
      'input[name*="paycheck" i], input[placeholder*="Paycheck" i]'
    );

    this.paymentDateInput = page.locator(
      'input[placeholder*="mm/dd/yyyy"], input[name*="payment" i]'
    );

    this.saveBtn = page.getByRole('button', { name: /^Save$/i }).nth(1);

    this.successToast = page.locator('.MuiAlert-message');

    this.signBtn = page.getByRole('button', { name: /^Sign$/i });

    this.yesBtn = page.getByRole('button', { name: /^yes$/i });

    this.generateBtn = page.getByRole('button', {
      name: /generate a-1-131/i,
    });
  }

  // ======================================================
  async selectPayrollPeriod(): Promise<string> {
  // Click dropdown and select the first option 
  await this.payrollPeriodDropdown.click();

  // Wait for options
  const options = this.page.locator('li[role="option"]');
  await options.first().waitFor({ state: 'visible', timeout: 30000 });

  // Skip index 0 → "Select one"
  const option = options.nth(1);

  const text = (await option.innerText()).trim();
  await option.click();

  return text;
}

//============================================================

  extractDates(period: string) {
    const dates = period.match(/\d{1,2}\/\d{1,2}\/\d{4}/g);
    if (!dates || dates.length < 2) throw new Error('❌ Dates not found');

    return {
      startDate: dates[0],
      endDate: dates[1],
    };
  }

//=============================================================
async clickCreate() {
  await this.createBtn.waitFor({ state: 'visible', timeout: 15000 });
  await expect(this.createBtn).toBeEnabled({ timeout: 15000 });

  await this.createBtn.click();

  // ✅ Handle optional confirmation here too (if applicable)
  await this.handleConfirmationIfPresent();

  await this.paycheckInput.waitFor({ state: 'visible', timeout: 30000 });
}
//===============================================================

  async fillHeader(paycheck: string, date: string) {
    await this.paycheckInput.fill(paycheck);
    await this.paymentDateInput.fill(date);
  }
//================================================================
 async fillHours() {
  const inputs = this.page.locator('input');

  for (let i = 0; i < await inputs.count(); i++) {
    const input = inputs.nth(i);

    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');

    // ❌ Skip paycheck + payment date fields
    if (
      name?.toLowerCase().includes('paycheck') ||
      name?.toLowerCase().includes('payment') ||
      placeholder?.toLowerCase().includes('paycheck') ||
      placeholder?.toLowerCase().includes('date')
    ) {
      continue;
    }

    try {
      await input.fill('8');
    } catch {}
  }
}
//===============================================================

async save() {
  await this.saveBtn.waitFor({ state: 'visible', timeout: 15000 });

  await expect(this.saveBtn).toBeEnabled({
    timeout: 15000
  });

  await this.saveBtn.click();

  // Handle confirmation popup if present
  await this.handleConfirmationIfPresent();

  // Success toast may or may not appear
  try {
    await this.successToast.waitFor({
      state: 'visible',
      timeout: 10000
    });

    console.log(
      '✅ Save message:',
      await this.successToast.innerText()
    );
  } catch {
    console.log(
      '⚠️ Success toast not visible, continuing'
    );
  }

  // Stabilize page
  await this.page.waitForLoadState('networkidle');
  await this.page.waitForTimeout(1000);

  console.log('✅ Save completed');
}

//======================================================================


async signPayroll() {
  // Click SIGN
  await this.signBtn.waitFor({ state: 'visible', timeout: 30000 });
  await expect(this.signBtn).toBeEnabled({ timeout: 30000 });
  await this.signBtn.click();

  // Wait for confirmation popup
  const dialog = this.page.locator('[role="dialog"]');
  await dialog.waitFor({ state: 'visible', timeout: 15000 });

  // Click YES inside dialog
  const yesBtn = dialog.locator('button:has-text("Yes")');
  await yesBtn.waitFor({ state: 'visible', timeout: 15000 });
  await yesBtn.click();

  // Validate success
  await expect(this.successToast).toBeVisible({ timeout: 15000 });
}

//=========================================================================

  async generateA1131() {
    await this.generateBtn.click();
    await this.page.waitForURL(/generate-347/);
  }

//========================================================================

  async completeGeneration() {
    const checkboxes = this.page.locator('input[type="checkbox"]');

    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    await this.page.getByRole('button', { name: /preview/i }).click();

    await this.page
      .getByRole('button', { name: /sign & generate/i })
      .click();

    await expect(this.successToast).toBeVisible();
  }
//========================================================================

  async extractWeekEnding(): Promise<string> {
    const text = await this.page.locator('text=Payroll Week Ending').innerText();
    return text.match(/\d{1,2}\/\d{1,2}\/\d{4}/)?.[0] || '';
  }

//=========================================================================

  async extractOrganization(): Promise<string> {
  const org = await this.page
    .locator('label:has-text("Organization")')
    .locator('xpath=following::div[@role="button"][1]//p')
    .innerText();

  return org.trim();
}

//=========================================================================
async handleConfirmationIfPresent() {
  try {
    await this.yesBtn.waitFor({ state: 'visible', timeout: 4000 });
    console.log('--- Confirmation modal detected → clicking YES');
    await this.yesBtn.click();
  } catch {
    console.log('--- No confirmation modal');
  }
}

}