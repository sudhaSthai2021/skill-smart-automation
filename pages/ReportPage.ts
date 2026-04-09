import * as XLSX from 'xlsx';
import { Page, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';


type PayrollRow = {
  employeeFirst: string;
  employeeLast: string;
  workClass: string;
  hours: number;
  otHours: number;
  dtHours: number;
  grossWages: number;
  netWages: number;
};

export class ReportsPage {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async generateRatesAndWagesReport(startDate: string, endDate: string) {

    console.log('--- Project Employees with Rates and Wages Report...');

    // ✅ Select report
    const dropdown = this.page.locator('label:has-text("Select Report")').locator('..').locator('div[role="button"]');
    await dropdown.click();

    await this.page
      .getByRole('option', { name: 'Employees with Rates and Wages Per Day - Multiple Projects' })
      .click();

    console.log('--- Report selected');

    // ✅ Fill dates
    const dateInputs = this.page.locator('input[type="text"]');

    await dateInputs.first().waitFor({ state: 'visible', timeout: 20000 });

    await dateInputs.nth(0).fill(startDate);
    await dateInputs.nth(1).fill(endDate);

    console.log(`--- Start Date entered: ${startDate}`);
    console.log(`--- End Date entered: ${endDate}`);

    console.log('--- Dates entered');

    // ✅ Click EXCEL (start generation)
    const excelBtn = this.page.getByRole('button', { name: /excel/i });
    await excelBtn.click();

    console.log('--- Excel generation triggered');

    // 🔥 WAIT until "Generating..." disappears OR report appears
    const generatingMsg = this.page.locator('text=Generating Report');

    // Wait for it to appear first (optional but safer)
    await generatingMsg.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });

    // Now wait until it disappears (report ready)
    await generatingMsg.waitFor({ state: 'hidden', timeout: 120000 });

    console.log('--- Report generation completed');

    // 🔥 Now click DOWNLOAD
    const downloadBtn = this.page.getByRole('button', { name: /download|excel|export/i }).last();

    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      downloadBtn.click()
    ]);

    const path = await download.path();

    console.log('--- Report downloaded:', path);

    return path;
  }


  async verifyExcelData(filePath: string, uiData: PayrollRow[]) {
    console.log('--- Reading Excel:', filePath);

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // ✅ Extract as raw array (header: 1) to find the correct data row
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Find header row (usually contains 'Employee First' and 'Employee Last')
    const headerRowIndex = rawRows.findIndex(row =>
      row.some(cell => cell?.toString().includes('Employee First'))
    );

    if (headerRowIndex === -1) {
      console.log('--- Raw Excel Head (first 5 rows):', rawRows.slice(0, 5));
      throw new Error('❌ Could not find header row in Excel (searched for "Employee First")');
    }

    const headers = rawRows[headerRowIndex];
    const dataRows = rawRows.slice(headerRowIndex + 1);

    const getColIndex = (name: string) => headers.findIndex(h => h?.toString().includes(name));

    const idxFirst = getColIndex('Employee First');
    const idxLast = getColIndex('Employee Last');
    const idxWorkClass = getColIndex('Work Class\r\n') !== -1 ? getColIndex('Work Class\r\n') : getColIndex('Work Class');
    const idxBaseRate = getColIndex('Paid Rate');
    const idxOTRate = getColIndex('Paid OT Rate');
    const idxDTRate = getColIndex('Paid DT Rate');
    const idxHours = getColIndex('Hours');
    const idxOTHours = getColIndex('OT Hours');
    const idxDTHours = getColIndex('DT Hours');
    const idxTotalPaid = getColIndex('Total Paid for Period');
    const idxNetWages = getColIndex('Net Wages') !== -1 ? getColIndex('Net Wages') : getColIndex('Net');

    console.log('--- Excel Headers discovered:', headers.filter(h => h).join(', '));

    // ✅ Normalize Excel data
    const formattedExcel = dataRows.map(row => {
      if (!row[idxFirst] || !row[idxLast]) return null;

      const hrs = Number(row[idxHours] || 0);
      const otHrs = Number(row[idxOTHours] || 0);
      const dtHrs = Number(row[idxDTHours] || 0);
      const rate = Number(row[idxBaseRate] || 0);
      const otRate = Number(row[idxOTRate] || 0);
      const dtRate = Number(row[idxDTRate] || 0);

      // fallback: UI Gross Wages = Base Pay sum (no fringes)
      const calculatedGross = (rate * hrs) + (otRate * otHrs) + (dtRate * dtHrs);

      return {
        employeeFirst: row[idxFirst]?.toString().trim(),
        employeeLast: row[idxLast]?.toString().trim(),
        workClass: row[idxWorkClass]?.toString().trim(),
        hours: hrs,
        otHours: otHrs,
        dtHours: dtHrs,
        grossWages: Number(row[idxTotalPaid] || calculatedGross),
        netWages: idxNetWages !== -1 ? Number(row[idxNetWages] || 0) : 0,
      };
    }).filter(r => r !== null);

    console.log('--- Formatted Excel:', formattedExcel);
    console.log("SUDHA TEST 123");

    // ✅ Compare UI vs Excel
    for (const uiRow of uiData) {
      // Handle middle initials (e.g., "Govind R" in UI vs "Govind" in Excel)
      const uiFirstNameFirstPart = uiRow.employeeFirst.split(' ')[0];

      const match = formattedExcel.find(excelRow =>
        excelRow.employeeFirst === uiFirstNameFirstPart &&
        excelRow.employeeLast === uiRow.employeeLast
      );

      if (!match) {
        throw new Error(`❌ No matching Excel row for ${uiRow.employeeFirst} ${uiRow.employeeLast}`);
      }

      console.log(`--- Comparing ${uiRow.employeeFirst} ${uiRow.employeeLast}`);
      console.log(`    UI:    Class=${uiRow.workClass}, Hours=${uiRow.hours}, OT=${uiRow.otHours}, DT=${uiRow.dtHours}, Gross=${uiRow.grossWages}, Net=${uiRow.netWages}`);
      console.log(`    Excel: Class=${match.workClass}, Hours=${match.hours}, OT=${match.otHours}, DT=${match.dtHours}, Gross=${match.grossWages}, Net=${match.netWages}`);

      expect(uiRow.workClass).toBe(match.workClass);
      expect(uiRow.hours).toBe(match.hours);
      expect(uiRow.otHours).toBe(match.otHours);
      expect(uiRow.dtHours).toBe(match.dtHours);
      expect(uiRow.grossWages).toBe(match.grossWages);
      if (idxNetWages !== -1) {
        expect(uiRow.netWages).toBe(match.netWages);
      }
    }

    console.log('✅ UI vs Excel validation passed');
  }
}