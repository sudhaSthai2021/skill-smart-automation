import { Page, Locator, expect } from '@playwright/test';
import { urlToHttpOptions } from 'node:url';
import fs from 'fs';
import path from 'path';

type PayrollRow = {
  fullName: string;
  employeeFirst: string;
  employeeLast: string;
  workClass: string;
  jobLevel: string;
  hours: number;
  otHours: number;
  dtHours: number;
  grossWages: number;
  netWages: number;
};

export class LaborTrackingPage {
  readonly page: Page;

  readonly loader: Locator;
  readonly laborTrackingMenu: Locator;
  readonly viewAllPayrolls: Locator;
  readonly payrollPeriodDropdown: Locator;
  readonly payrollPeriodMenuItem: Locator;
  readonly workerMenu: Locator;
  readonly viewAllWorkers: Locator;
  readonly addWorkerMenu:Locator;
  readonly workerTab:Locator;



  constructor(page: Page) {
    this.page = page;

    this.loader = page.locator('text=Loading Your Data...');
    this.laborTrackingMenu = page.getByText('Labor Tracking', { exact: true });
    this.viewAllPayrolls = page.getByText('View All Payrolls');
    this.payrollPeriodDropdown = page.locator('label:has-text("Payroll report period") + div [id^="mui-component-select-"], [id^="mui-component-select-selectedPayrollId"]').first();
    this.payrollPeriodMenuItem = page.locator('#menu-selectedPayrollId');
    this.workerMenu = page.locator('#right-side').getByText('1099 Workers', { exact: true })
    this.workerTab =  page.locator('p:has-text("1099 Workers")').first();
    this.viewAllWorkers = page.getByText('View All 1099 Workers', { exact: true });

    this.addWorkerMenu = page.locator('div:has-text("Add 1099 Worker")').first();

  }

  //=======================================================================================================

  async navigateToAllPayrolls() {
  console.log('--- Navigating to All Payrolls...');

  // Wait for sidebar
  await this.page.waitForSelector('text=Labor Tracking', { timeout: 20000 });

  // 🔥 Ensure menu is expanded (NOT blindly clicking)
  const isVisible = await this.viewAllPayrolls.isVisible().catch(() => false);

  if (!isVisible) {
    console.log('--- Expanding Labor Tracking menu');
    await this.laborTrackingMenu.click();
  } else {
    console.log('--- Menu already expanded');
  }

  // 🔥 Wait again after click
  await this.viewAllPayrolls.waitFor({ state: 'visible', timeout: 20000 });

  // Click View All Payrolls
  await this.viewAllPayrolls.click();

  // 🔥 VERY IMPORTANT: wait for page load
  await this.page.waitForURL(/payroll\/all/);

  console.log('--- Clicked View All Payrolls');
}

async deletePayroll(org: string, start: string, end: string) {
  console.log('--- DELETE ATTEMPT ---');
  console.log('Organization:', org);
  console.log('Start Date  :', start);
  console.log('End Date    :', end);

  const period = `${start} - ${end}`;

  // ✅ First select the correct payroll period
  // Try selecting payroll period (only if dropdown exists)
try {
  const dropdown = this.page.locator(
    'label:has-text("Payroll report period")'
  );

  if (await dropdown.isVisible({ timeout: 5000 })) {
    console.log('--- Payroll dropdown found, selecting period...');
    await this.selectPayrollPeriodByText(period);
  } else {
    console.log('--- Payroll dropdown NOT visible (admin view), skipping selection');
  }
} catch (e) {
  console.log('--- Dropdown not available, continuing without selection');
}

  // ✅ Wait until real table data appears, not blank skeleton rows
  await this.page.waitForFunction(() => {
    const rows = Array.from(
      document.querySelectorAll('.ReactTable .rt-tbody .rt-tr-group')
    );

    return rows.some(row => {
      const text = row.textContent || '';
      return text.replace(/\s+/g, '').length > 0;
    });
  }, { timeout: 30000 });

  const normalize = (val: string = '') =>
    val
      .toLowerCase()
      .replace(/signed/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const normalizeDate = (val: string = '') =>
    val
      .replace(/[^0-9/]/g, '')
      .trim();

  const orgNorm = normalize(org);
  const startNorm = normalizeDate(start);
  const endNorm = normalizeDate(end);

  const rows = this.page.locator('.ReactTable .rt-tbody .rt-tr-group');
  const count = await rows.count();

  console.log('--- Payroll row count:', count);

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const rowText = (await row.innerText()).replace(/\s+/g, ' ').trim();

    if (!rowText) continue;

    console.log(`--- Row ${i}:`, rowText);

    const orgTextNorm = normalize(rowText);
    const rowDateText = normalizeDate(rowText);

    const isMatch =
      orgTextNorm.includes(orgNorm) &&
      rowDateText.includes(startNorm) &&
      rowDateText.includes(endNorm);

    if (!isMatch) continue;

    console.log('✅ Matching payroll row found');

    const deleteBtn = row.locator(
      '[data-ga-id="gmt_payrollV2_delete_payroll"], button:has(svg)'
    ).last();

    await deleteBtn.waitFor({ state: 'visible', timeout: 10000 });
    await deleteBtn.click();

    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 10000 });

    await dialog.getByRole('button', { name: /^yes$/i }).click();

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);

    console.log('✅ Payroll deleted');
    return;
  }

  throw new Error(`❌ Payroll not found for deletion: ${org} | ${start} - ${end}`);
}
async goToAddEmployee() {
  await this.page.waitForLoadState('networkidle');

  await this.page.getByText('Labor Tracking', { exact: true }).click();

  const employees = this.page.getByText('Employees', { exact: true });
  await employees.waitFor({ state: 'visible', timeout: 30000 });
  await employees.click();

  const addEmployee = this.page.getByText('Add Employee', { exact: true });
  await addEmployee.waitFor({ state: 'visible', timeout: 30000 });
  await addEmployee.click();

  console.log('--- Add Employee clicked');
} //====================================================================================================
 async goToImportPayroll() {
  console.log('--- Navigating to Import Payroll');

  // 1️⃣ Open Labor Tracking
  await this.page.getByText('Labor Tracking', { exact: true }).click();

  // 2️⃣ Wait for Import Payroll to appear
  const importPayroll = this.page.getByRole('link', { name: 'Import Payroll' });

  await importPayroll.waitFor({ state: 'visible', timeout: 10000 });

  // 3️⃣ Click it
  await importPayroll.click();

  // 4️⃣ Wait for navigation
  await this.page.waitForURL(/payroll\/import/);

  console.log('--- Navigation complete');
}
  //=====================================================================================================

  async getSelectedPayrollDates(): Promise<{ startDate: string; endDate: string }> {

    
  const text = await this.page
    .locator('#mui-component-select-selectedPayrollId')
    .innerText();

  console.log('--- Payroll period text:', text);

  // Example format: "03/30/2026 - 04/05/2026"
  const [startDate, endDate] = text.split('-').map(t => t.trim());

  return { startDate, endDate };
}

  //======================================================================================================
async selectLatestSignedPayrollPeriod() {
  console.log('Selecting Latest signed Payroll Period');

  await this.page.waitForLoadState('networkidle');

  // Use the specific Payroll report period dropdown
  const dropdown = this.payrollPeriodDropdown;

  await dropdown.waitFor({ state: 'visible', timeout: 30000 });
  await dropdown.scrollIntoViewIfNeeded();
  await dropdown.click();

  const listbox = this.page.locator('ul[role="listbox"]');
  await listbox.waitFor({ state: 'visible', timeout: 30000 });

  const options = listbox.locator('li[role="option"]');
  const count = await options.count();

  console.log('--- Payroll period option count:', count);

  if (count === 0) {
    throw new Error('❌ No payroll period options found');
  }

  const texts = await options.allInnerTexts();
  console.log('--- Payroll period options:', texts);

  // Prefer SIGNED option
  let option = options.filter({ hasText: 'SIGNED' }).first();

  // If no SIGNED option, select first real option that is not Select One
  if (await option.count() === 0) {
    option = options
      .filter({ hasNotText: 'Select One' })
      .filter({ hasNotText: 'Select a Payroll' })
      .first();
  }

  const selectedText = (await option.innerText()).trim();
  await option.click();

  console.log('--- Selected payroll period:', selectedText);

  // Wait for table to refresh
  const rows = this.page.locator('.ReactTable .rt-tbody .rt-tr-group');
  await rows.first().waitFor({ state: 'visible', timeout: 30000 });

  await this.page.waitForTimeout(1000);

  return selectedText;
}

async selectPayrollPeriodByText(period: string) {
  console.log('--- Selecting payroll period:', period);

  await this.page.waitForLoadState('networkidle');

  // ✅ Use your existing locator (correct one)
  const dropdown = this.payrollPeriodDropdown;

  await dropdown.waitFor({ state: 'visible', timeout: 30000 });
  await dropdown.scrollIntoViewIfNeeded();
  await dropdown.click();

  // ✅ VERY IMPORTANT (MUI listbox)
  const listbox = this.page.locator('ul[role="listbox"]');
  await listbox.waitFor({ state: 'visible', timeout: 30000 });

  const options = listbox.locator('li[role="option"]');
  const count = await options.count();

  console.log('--- Dropdown option count:', count);

  for (let i = 0; i < count; i++) {
    const option = options.nth(i);

    const rawText = await option.innerText();

    // ✅ Normalize UI text
    const text = rawText.replace(/\s+/g, ' ').trim();

    console.log(`--- Option ${i}: ${text}`);

    // ✅ MATCH ONLY DATE PART (ignore SIGNED etc)
    if (text.includes(period)) {
      await option.click();

      console.log('--- Selected imported payroll period:', text);

      // Wait for table refresh
      const rows = this.page.locator('.ReactTable .rt-tbody .rt-tr-group');
      await rows.first().waitFor({ state: 'visible', timeout: 30000 });

      await this.page.waitForTimeout(1000);

      return;
    }
  }

  throw new Error(`❌ Payroll period not found: ${period}`);
}
/*

  async selectLatestSignedPayrollPeriod() {

    console.log('Selecting Latest signed Payroll Period');

    // 1. Open the dropdown
    await this.payrollPeriodDropdown.click();

    // 2. Wait for options to appear
    const options = this.page.locator('ul[role="listbox"] >> [role="option"]');
    await options.first().waitFor({ state: 'visible' });

    // 3. Filter only SIGNED rows
    const signedOptions = options.filter({ hasText: 'SIGNED' });

    // 4. Click the FIRST one (latest)
    await signedOptions.first().click();

    // ✅ WAIT for table to refresh properly (reliable way)

   // Wait until at least one row is visible
      const rows = this.page.locator('.ReactTable .rt-tbody .rt-tr-group');
      await rows.first().waitFor({ state: 'visible', timeout: 30000 });

   // Wait until real data appears (not empty/loading rows)
      await this.page.waitForSelector(
      '.ReactTable .rt-tbody .rt-tr-group >> text=/[A-Za-z]/',
    { timeout: 30000 }
);

console.log('--- Table fully loaded with data');

    console.log('--- Table refreshed after selecting payroll period');


  }

  */

  //=======================================================================================================
  async selectPayrollPeriod(period: string = 'SIGNED') {
    console.log(`--- Selecting Payroll Period containing: ${period}`);

    // 1. Ensure dropdown is visible and click
    await this.payrollPeriodDropdown.scrollIntoViewIfNeeded();
    await this.payrollPeriodDropdown.click();

    await this.page.waitForTimeout(1000); // temporary debug wait

    const allOptions = await this.page.locator('[role="option"]').allTextContents();

    console.log('--- Available options:', allOptions);

    // 2. Wait for option globally (MUI best practice)
    const options = this.page.locator('[role="option"]');
    const count = await options.count();

    if (count === 0) {
      throw new Error('❌ No payroll periods available');
    }

    // Select FIRST available option (reliable)
    const option = options.first();

    const selectedText = await option.innerText();
    console.log(`--- Selecting: ${selectedText}`);

    await option.click();

    // await this.page.pause();

    // 3. Verify dropdown updated
    await expect(this.payrollPeriodDropdown).not.toContainText('Select a Payroll');

    // 4. Wait for loaders to disappear (VERY IMPORTANT)
    const loaders = [
      '.MuiCircularProgress-root',
      '[role="progressbar"]',
      '#loading-overlay',
      'text=Loading...',
      '.loading'
    ];

    for (const loader of loaders) {
      await this.page.waitForSelector(loader, { state: 'hidden', timeout: 5000 }).catch(() => { });
    }

    // 5. Wait for actual table data (MOST IMPORTANT)
    console.log('--- Waiting for actual data rows to appear in the table...');

    await this.page.waitForFunction(() => {
      const rows = document.querySelectorAll('.ReactTable .rt-tbody .rt-tr-group');

      return Array.from(rows).some(row => {
        const text = row.textContent || '';

        return text.trim().length > 0 &&
          !text.includes('Select a Payroll') &&
          !text.includes('Loading');
      });
    }, { timeout: 30000 });

    console.log('--- Table data is now visible.');
  }
async extractStandardPayrollData(): Promise<PayrollRow[]> {
  console.log('--- Extracting ALL rows from ReactTable...');

  const rows = this.page.locator('.ReactTable .rt-tbody .rt-tr-group');

  const rowCount = await rows.count();
  console.log('Row groups found:', rowCount);

  if (rowCount === 0) {
    throw new Error('❌ No rows found in table');
  }

  const data: PayrollRow[] = [];

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    const cells = row.locator('.rt-td');

   

    const cellCount = await cells.count();

// ✅ ADD THIS (debug + safety)
console.log(`Row ${i} column count:`, cellCount);


if (cellCount === 0) continue;

    const getText = async (index: number) =>
      (await cells.nth(index).innerText()).trim();

    const rawName = (await getText(2))
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!rawName || rawName.includes('Select') || rawName.includes('Loading')) {
      continue;
    }

    const [lastName, firstName] = rawName.split(',').map(s => s?.trim());

    const cleanNumber = (val: string) =>
      parseFloat(val.replace(/[$,]/g, '').trim()) || 0;


const rowData: PayrollRow = {
  fullName: rawName,                     // Name → index 1
  employeeFirst: firstName || '',
  employeeLast: lastName || '',
  workClass: await getText(2),           // ✅ FIXED
  jobLevel: await getText(3),            // ✅ FIXED
  hours: cleanNumber(await getText(5)),  // ✅ FIXED
  otHours: cleanNumber(await getText(6)),
  dtHours: cleanNumber(await getText(7)),
  grossWages: cleanNumber(await getText(10)), // ✅ FIXED
  netWages: cleanNumber(await getText(11)),   // ✅ FIXED
};



    data.push(rowData);
  }

  console.log('--- Extracted rows count:', data.length);
  console.log('--- Clean Data:', data);

  if (data.length === 0) {
    throw new Error('❌ No valid payroll rows found.');
  }

  return data;
}

async verifyPayrollCreated(expectedPeriod?: string) {
  console.log('--- Verifying payroll exists in table');

  const rows = this.page.locator('.ReactTable .rt-tbody .rt-tr-group');

  await rows.first().waitFor({ state: 'visible', timeout: 30000 });

  const count = await rows.count();
  console.log('--- Row count:', count);

  if (count === 0) {
    throw new Error('❌ No payroll records found');
  }

  // OPTIONAL: Validate period text if you captured it
  if (expectedPeriod) {
    const dropdownText = await this.page
      .locator('#mui-component-select-selectedPayrollId')
      .innerText();

    if (!dropdownText.includes(expectedPeriod)) {
      throw new Error(`❌ Expected payroll period ${expectedPeriod} not found`);
    }
  }

  console.log('✅ Payroll successfully created and visible');
}

//============================================================================================================

//====================================================================================================
//====================================================================================================
async goToAdd1099Worker() {
  const page = this.page;

  // 1. Click 1099 Workers (expands submenu)
  const workers = page.getByText('1099 Workers', { exact: true });
  await workers.waitFor({ state: 'visible', timeout: 30000 });
  await workers.click();

  // 2. Wait for submenu animation/render
  const addWorker = page.getByText('Add 1099 Worker', { exact: true });
  await addWorker.waitFor({ state: 'visible', timeout: 30000 });

  // 3. Ensure it is clickable
  await addWorker.scrollIntoViewIfNeeded();
  await addWorker.click();
}


//====================================================================================================
 async goToView1099Workers() {
 console.log('--- Navigating to 1099 Workers list');

  // 1️⃣ Click main menu (1099 Workers)
  await this.workerMenu.click();

  // 2️⃣ Click submenu (View All 1099 Workers)
  await this.viewAllWorkers.waitFor({ state: 'visible', timeout: 10000 });
  await this.viewAllWorkers.click();

  // 3️⃣ Validate page
  // 3️⃣ Validate page
 await expect(
  this.page.getByText('Contracted With')
).toBeVisible();
  console.log('--- Workers list opened');
}

 async goToWorkerTab() {
 console.log('--- Navigating to 1099 Workers Tab list');

  // 1️⃣ Click main menu (1099 Workers)
  

  // 2️⃣ Click submenu (View All 1099 Workers)
  await this.workerTab.waitFor({ state: 'visible', timeout: 10000 });
  await this.workerTab.click();
  

  // 3️⃣ Validate page
 await expect(
  this.page.getByText('Contracted With')
).toBeVisible();

  console.log('--- Workers list opened');
}

async goToCreatePayroll() {
  console.log('--- Navigating to Create Payroll');

  const laborTracking = this.page.getByText('Labor Tracking', { exact: true });
  const createPayroll = this.page.getByText('Create Payroll', { exact: true });

  if (!(await createPayroll.isVisible())) {
    await laborTracking.click();
  }

  await createPayroll.waitFor({ state: 'visible', timeout: 30000 });
  await createPayroll.click();

  await this.page
    .locator('#mui-component-select-selectedDateRange')
    .waitFor({ state: 'visible', timeout: 30000 });

  console.log('--- Create Payroll page opened');
}





}
