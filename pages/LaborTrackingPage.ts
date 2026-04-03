import { Page, Locator, expect } from '@playwright/test';
import { urlToHttpOptions } from 'node:url';

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

  readonly loader:Locator;
  readonly laborTrackingMenu:Locator;
  readonly viewAllPayrolls:Locator;
  readonly payrollPeriodDropdown: Locator;
  readonly payrollPeriodMenuItem: Locator;

 
  
  constructor(page: Page) {
    this.page = page;

    this.loader=page.locator('text=Loading Your Data...');
    this.laborTrackingMenu=page.getByText('Labor Tracking', { exact: true });
    this.viewAllPayrolls=page.getByText('View All Payrolls');
    this.payrollPeriodDropdown=page.locator('label:has-text("Payroll report period") + div [id^="mui-component-select-"], [id^="mui-component-select-selectedPayrollId"]').first();
    this.payrollPeriodMenuItem=page.locator('#menu-selectedPayrollId');

    
  }
    
  //=======================================================================================================

  async navigateToAllPayrolls() {
    console.log('--- Navigating to All Payrolls...');

    // ✅ Wait for sidebar to load
  await this.page.waitForSelector('text=Labor Tracking', { timeout: 20000 });

  // ✅ Expand Labor Tracking (IMPORTANT)
  await this.laborTrackingMenu.click();

  // ✅ Wait for submenu to appear
  const viewPayroll = this.page.locator('text=View All Payrolls');
  await viewPayroll.waitFor({ state: 'visible', timeout: 20000 });

  // ✅ Click submenu
  await viewPayroll.click();

  console.log('--- Clicked View All Payrolls');
}

  //======================================================================================================
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

  // ✅ WAIT for table to refresh properly
  await this.page.waitForFunction(() => {
  const rows = document.querySelectorAll('.ReactTable .rt-tbody .rt-tr-group');

  return Array.from(rows).some(row => {
    const text = row.textContent || '';
    return text.trim().length > 0 &&
           !text.includes('Select a Payroll') &&
           !text.includes('Loading');
  });
}, { timeout: 30000 });

console.log('--- Table refreshed after selecting payroll period');


}






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
    await this.page.waitForSelector(loader, { state: 'hidden', timeout: 5000 }).catch(() => {});
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

  // ✅ Wait for REAL data
  await this.page.waitForFunction(() => {
    const rows = document.querySelectorAll('.ReactTable .rt-tbody .rt-tr');
    return Array.from(rows).some(row => {
      const cells = row.querySelectorAll('.rt-td');
      return cells.length > 0 && (cells[0].textContent || '').trim().length > 0;
    });
  }, { timeout: 30000 });

  // ❌ REMOVE TYPE HERE
  const rawData = await this.page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.ReactTable .rt-tbody .rt-tr'));

    const cleanNumber = (val: string) =>
      parseFloat(val.replace(/[$,]/g, '').trim()) || 0;

    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('.rt-td'));
      if (cells.length === 0) return null;

      const get = (i: number) => cells[i]?.textContent?.trim() || '';

      const rawName = get(1).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

      if (!rawName || rawName.includes('Select') || rawName.includes('Loading')) {
        return null;
      }

      const [lastName, firstName] = rawName.split(',').map(s => s?.trim());

      return {
        fullName: rawName,
        employeeFirst: firstName || '',
        employeeLast: lastName || '',
        workClass: get(2),
        jobLevel: get(3),
        hours: cleanNumber(get(5)),
        otHours: cleanNumber(get(6)),
        dtHours: cleanNumber(get(7)),
        grossWages: cleanNumber(get(10)),
        netWages: cleanNumber(get(11)),
      };
    }).filter(row => row !== null);
  });

  // ✅ APPLY TYPE HERE (safe)
  const data = rawData as PayrollRow[];

  console.log('--- Extracted rows count:', data.length);
  console.log('--- Clean Data:', data);

  if (data.length === 0) {
    throw new Error('❌ No valid payroll rows found.');
  }

  return data;
}


}
