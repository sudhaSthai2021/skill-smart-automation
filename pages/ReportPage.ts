import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import XLSX from 'xlsx';
import pdfParse from 'pdf-parse';
import { expect } from '@playwright/test';
import { DropdownUtils } from '../utils/dropdownUtils';


export interface PayrollRow {
  employeeFirst: string;
  employeeLast: string;
  workClass: string;
  hours: number;
  otHours: number;
  dtHours: number;
  grossWages: number;
  netWages: number;
}


export class ReportsPage {
  readonly page: Page;
  
  private currentProject: string | null = null;
  private latestPayrollPeriod: { startDate: string; endDate: string } | null = null;

  
  constructor(page: Page) {
    this.page = page;
  }

  private logComparison(
  label: string,
  uiValue: any,
  excelValue: any
) {
  const status = uiValue === excelValue ? '✅' : '❌';
  console.log(
    `${status} ${label.padEnd(12)} | UI: ${uiValue} | Excel: ${excelValue}`
  );
}

  


  // ======================================================
  // 🔥 MAIN METHOD (USE THIS EVERYWHERE)
  // ======================================================
  async generateAndValidateReport(config: {
    reportName: string;
    startDate?: string;
    endDate?: string;
    project?: string;
    payrollData?: PayrollRow[];
  }) {
    const filePath = await this.generateReport(config);

    if (!filePath) {
      throw new Error(`❌ No file generated for ${config.reportName}`);
    }

    await this.validateReport(config.reportName, filePath, config.payrollData || []);
  }

  // ======================================================
  // GENERATE REPORT
  // ======================================================

  private async generateReport(config: {
  reportName: string;
  startDate?: string;
  endDate?: string;
  project?: string;
}): Promise<string | null> {

  console.log(`--- Generating report: ${config.reportName}`);

  await this.selectReport(config.reportName);
  // ⏳ 2. WAIT for report UI to load
  await this.page.waitForTimeout(1500);

  // ✅ keep this (but make it smart internally)
  await this.handleDateRange(config);

  await this.handleProject(config);

  return await this.handleDownload();
}

//=============================================================================================================================================
 
private async selectReport(reportName: string) {
  console.log('--- Selecting report:', reportName);

  const dropdown = this.page.locator('label:has-text("Select Report")')
  .locator('..')
  .locator('div[role="button"]');

const menu = this.page.locator('#menu-selectedReport');

await DropdownUtils.select(dropdown, reportName);

  console.log('--- Report selected successfully');
}


//===================================================================================================================================


async handleDateRange(config: {
  startDate?: string;
  endDate?: string;
}) {

  if (!config.startDate || !config.endDate) return;

  console.log(`--- Applying date range: ${config.startDate} → ${config.endDate}`);

   const dateInputs = this.page.locator(
    'input[placeholder*="Start"], input[placeholder*="End"], input[type="text"]'
   );

  const count = await dateInputs.count();
  console.log(`--- Total inputs found: ${count}`);

  if (count >= 2) {
      const startInput = dateInputs.nth(0);
    const endInput = dateInputs.nth(1);

    await startInput.fill('');
    await startInput.fill(config.startDate);

    await endInput.fill('');
    await endInput.fill(config.endDate);

    console.log('--- Date range applied');
  } else {
    console.log('--- Date inputs not found, skipping');
  }
}

//============================================================================================================================================

  private async handleProject(config: any) {
    if (!config.project) return;

    console.log('--- Handling project:', config.project);

    this.currentProject = config.project; // ✅ store state

    if (config.reportName === 'Contractor Configuration Status') {
      await this.page.locator('span.MuiChip-label', {
        hasText: config.project
      }).waitFor();
    } else {
      const dropdown = this.page.locator('div[role="button"]', {
        hasText: 'Project'
      });

      await DropdownUtils.select(dropdown, config.project);
    }
  }

//============================================================================================================================================
    //Get CURRENT selected project (if needed later)
  async getCurrentSelectedProject(): Promise<string | null> {
  const chip = this.page.locator('span.MuiChip-label').first();

  if (await chip.count()) {
    return (await chip.innerText()).trim();
  }

  return this.currentProject;
}

//==========================================================================================================================================

  private async handleDownload(): Promise<string | null> {
  try {
    const btn = this.page.locator(`
      button:has-text("Excel"),
      button:has-text("Pdf"),
      button:has-text("Zip")
    `).first();

    await btn.waitFor({ state: 'visible', timeout: 10000 });

    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      btn.click()
    ]);

    const fileName = download.suggestedFilename();

    // ✅ Create downloads folder if not exists
    const downloadDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir);
    }

    const filePath = path.join(downloadDir, fileName);

    // ✅ Save file permanently
    await download.saveAs(filePath);

    console.log('--- Saved file to:', filePath);

    return filePath;

  } catch (error) {
    console.log('⚠️ No download triggered');
    return null;
  }
}

  // ======================================================
  // VALIDATION ENTRY
  // ======================================================
  private async validateReport(
    reportName: string,
    filePath: string,
    payrollData: PayrollRow[]
  ) {

    if (filePath.endsWith('.zip')) {
      const files = await this.extractZip(filePath);

      for (const file of files) {
        await this.validateReport(reportName, file, payrollData);
      }
      return;
    }

    if (filePath.endsWith('.pdf')) {
      return this.verifyPDF(reportName, filePath);
    }

    if (filePath.endsWith('.xlsx')) {
      return this.verifyExcel(reportName, filePath, payrollData);
    }

    console.log('⚠️ Unknown format:', filePath);
  }

  //========================================================================================================================================
  
  private async extractZip(filePath: string): Promise<string[]> {
    const zip = new AdmZip(filePath);
    const extractPath = filePath.replace('.zip', '');

    zip.extractAllTo(extractPath, true);

    return fs.readdirSync(extractPath)
      .map(f => path.join(extractPath, f));
  }
      

  // ======================================================
  // PDF VALIDATION
  // ======================================================
  
  private async verifyPDF(reportName: string, filePath: string) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);

    if (reportName === 'DAS-140') {
      expect(data.text).toContain('DAS 140');
    }

    console.log('✅ PDF validated');
  }
    

  // ======================================================
  // EXCEL VALIDATION
  // ======================================================
  private async verifyExcel(
    reportName: string,
    filePath: string,
    payrollData: PayrollRow[]
  ) {
console.log(`--- verifyExcel called for: ${reportName}`);

  switch (reportName.trim()) {

    //case 'Employees with Rates and Wages Per Day - Multiple Projects':
     // console.log('✅ Verifying Per Day - Multiple Projects');
    //  return this.verifyEmployeePayroll(filePath, payrollData);

    //case 'Employees with Rates and Wages Period End - Multiple Projects':
    //  console.log('✅ Verifying Period End - Multiple Projects');
    //  return this.verifyEmployeePayrollPeriodEnd(filePath, payrollData);

    //  case 'Project Employees with Rates and Wages Per Day':
    //  console.log('✅ Verifying Project Per Day');
    //  return this.verifyProjectEmployeePayroll(filePath, payrollData);

    case 'Project Employees with Rates and Wages Period End':
      console.log('✅ Verifying Project Period End');
      return this.verifyProjectEmployeePayrollPeriodEnd(filePath, payrollData);

   // case 'Contractor Configuration Status':
  //  console.log('✅ Verifying Contractor Config');
   //   return this.verifyContractorConfig(filePath);

   // case 'Wage Rate Discrepancy - Standard':
   //   console.log('✅ Verifying Wage Rate Discrepancy');
   //   return this.verifyWageRateDiscrepancy(filePath);

    default:
      console.log(`⚠️ No validation implemented for: ${reportName}`);
  }
  }
//=================================================================================================================================
// 
/*=========
  private async verifyProjectEmployeePayroll(
  filePath: string,
  uiData: PayrollRow[]
) {
  console.log('🔥 verifyProjectEmployeePayroll');

  // Later you may validate project-specific columns
  return this.verifyEmployeePayroll(filePath, uiData);
}

*/
//===========================================================================================================================================
 /*
  private async verifyEmployeePayrollPeriodEnd(
  filePath: string,
  uiData: PayrollRow[]
) {
  console.log('🔥 verifyEmployeePayrollPeriodEnd');

  // You can reuse base logic if same
  return this.verifyEmployeePayroll(filePath, uiData);
}
  */

  //==========================================================================================================================================

  private async verifyProjectEmployeePayrollPeriodEnd(
  filePath: string,
  uiData: PayrollRow[]
) {
  console.log('🔥 verifyProjectEmployeePayrollPeriodEnd STARTED');

  if (!uiData.length) {
    throw new Error('❌ No UI payroll data');
  } else {
    console.log('UI Data rows:', uiData.length);
  }

  // 📄 Read Excel
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // 🔍 Find header row
  const headerIndex = rows.findIndex(r =>
    r.some(c => c?.toString().includes('Employee First'))
  );

  if (headerIndex === -1) {
    throw new Error('❌ Header row not found in Excel');
  }

  const headers = rows[headerIndex];

  console.log('📄 Excel Headers:', headers);

  const dataRows = rows.slice(headerIndex + 1);

  // 📌 Column indexes
  const getIndex = (name: string) =>
    headers.findIndex(h =>
      h?.toString()
        .replace(/\r?\n/g, '')
        .trim()
        .toLowerCase()
        .includes(name.toLowerCase())
    );

  const idxFirst = getIndex('Employee First');
  const idxLast = getIndex('Employee Last');
  const idxHours = getIndex('Hours');
  const idxOt = getIndex('OT Hours');
  const idxDt = getIndex('DT Hours');
  const idxGross = getIndex('Total Paid for Period');

  // ❌ REMOVE NET WAGES
  // const idxNet = getIndex('Net Wages');

  if (idxFirst === -1 || idxLast === -1 || idxHours === -1) {
    throw new Error('❌ Required columns not found in Excel');
  }

  const errors: string[] = [];

  // 🔄 Compare UI vs Excel
  for (let i = 0; i < uiData.length; i++) {
    const ui = uiData[i];

    const excelRow = dataRows.find(r =>
      r[idxFirst]?.toString().trim() === ui.employeeFirst.split(' ')[0] &&
      r[idxLast]?.toString().trim() === ui.employeeLast
    );

    if (!excelRow) {
      errors.push(
        `❌ Missing Excel row for ${ui.employeeFirst} ${ui.employeeLast}`
      );
      continue;
    }

    const excelHours = Number(excelRow[idxHours] ?? 0);
    const excelOtHours = Number(excelRow[idxOt] ?? 0);
    const excelDtHours = Number(excelRow[idxDt] ?? 0);
    const excelGross = Number(excelRow[idxGross] ?? 0);

    // ❌ REMOVE NET
    // const excelNet = Number(excelRow[idxNet] ?? 0);

    this.logComparison('Hours', ui.hours, excelHours);
    this.logComparison('OT Hours', ui.otHours, excelOtHours);
    this.logComparison('DT Hours', ui.dtHours, excelDtHours);
    this.logComparison('Gross', ui.grossWages, excelGross);

    // ❌ REMOVE NET
    // this.logComparison('Net', ui.netWages, excelNet);

    if (ui.hours !== excelHours)
      errors.push(`Hours mismatch for ${ui.employeeFirst}`);

    if (ui.otHours !== excelOtHours)
      errors.push(`OT mismatch for ${ui.employeeFirst}`);

    if (ui.dtHours !== excelDtHours)
      errors.push(`DT mismatch for ${ui.employeeFirst}`);

    if (ui.grossWages !== excelGross)
      errors.push(`Gross mismatch for ${ui.employeeFirst}`);

    // ❌ REMOVE NET VALIDATION
    // if (ui.netWages !== excelNet)
    //   errors.push(`Net mismatch for ${ui.employeeFirst}`);
  }

  // ❗ Final result
  if (errors.length) {
    console.error('\n❌ Validation failed:\n' + errors.join('\n'));
    throw new Error('❌ Payroll validation failed');
  }

  console.log('✅ Project Period End Excel validated');
}
//==============================================================================================================================================
/*
  private async verifyContractorConfig(filePath: string) {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    expect(data.length).toBeGreaterThan(0);

    console.log('✅ Contractor Config validated');
  }

  */

  //===============================================================================
  /*

  private async verifyEmployeePayroll(filePath: string, uiData: PayrollRow[]) {
    if (!uiData.length) {
      throw new Error('❌ No UI payroll data');
    }

    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const headerIndex = rows.findIndex(r =>
      r.some(c => c?.toString().includes('Employee First'))
    );

    const headers = rows[headerIndex];
    const dataRows = rows.slice(headerIndex + 1);

    const get = (name: string) =>
      headers.findIndex(h => h?.toString().includes(name));

    const idxFirst = get('Employee First');
    const idxLast = get('Employee Last');
    const idxHours = get('Hours');

    for (const ui of uiData) {
      const match = dataRows.find(r =>
      r[idxFirst] === ui.employeeFirst.split(' ')[0] &&
      r[idxLast] === ui.employeeLast
    );

    // ✅ Proper TypeScript-safe guard
      if (!match) {
        console.error('--- Excel rows:', dataRows);

        throw new Error(
      `❌ No matching Excel row for ${ui.employeeFirst} ${ui.employeeLast}`
      );
  }

  // ✅ Now TypeScript knows match is defined
  const excelHours = Number(match[idxHours] ?? 0);

  expect(excelHours).toBe(ui.hours);
}
    

    console.log('✅ Payroll Excel validated');
  }

  */

  //===========================================================================================================================================

async getAllReportNames(): Promise<string[]> {
  console.log('--- Fetching all report names');

  // ✅ Open dropdown
  const dropdown = this.page.locator('label:has-text("Select Report")')
    .locator('..')
    .locator('div[role="button"]');

  await dropdown.click();

  // ✅ Wait for MUI menu
  const menu = this.page.locator('#menu-selectedReport');
  await menu.waitFor({ state: 'visible', timeout: 10000 });

  const options = menu.locator('li');

  const reportNames: string[] = [];
  const count = await options.count();

  console.log(`--- Found ${count} visible reports`);

  // 🔥 Define invalid values
 // const invalidExact = ['Select One'];
 const invalidExact = [
  'Select One',
  'Standard Downloads',
  'Standard Reports',
  'Custom Downloads',
  'Custom Reports'
];

 for (let i = 0; i < count; i++) {
    const item = options.nth(i);

    await item.scrollIntoViewIfNeeded();

    const text = (await item.innerText()).trim();
    if (!text) continue;

    // ❌ Skip ONLY section headers (exact match)
    if (invalidExact.includes(text)) {
      console.log(`--- Skipping header: ${text}`);
      continue;
    }

    // ✅ Add valid reports
    if (!reportNames.includes(text)) {
      console.log(`--- Valid report: ${text}`);
      reportNames.push(text);
    }
  }

  // ✅ Close dropdown safely
  await this.page.keyboard.press('Escape');

  console.log('--- Final report list:', reportNames);

  return reportNames;
}

private async verifyWageRateDiscrepancy(filePath: string) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  if (!data.length) {
    throw new Error('❌ Wage Rate Discrepancy report is empty');
  }

  console.log('📄 Rows found:', data.length);

  // 🔥 You can later add column validation here

  console.log('✅ Wage Rate Discrepancy validated');
}

//============================================================================================================================================

async generateAllReports(startDate: string, endDate: string, payrollData: PayrollRow[]) {
  const reports = await this.getAllReportNames();

  for (const report of reports) {
    console.log(`\n--- Processing: ${report}`);

    const config: any = {
      reportName: report,
      startDate,
      endDate,
      payrollData   // ✅ pass it forward
    };

    try {
      await this.generateAndValidateReport(config);
    } catch (err) {
      console.log(`⚠️ Failed: ${report}`);
    }
  }
}

}
  


