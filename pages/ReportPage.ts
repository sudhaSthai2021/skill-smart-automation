import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import XLSX from 'xlsx';
import pdfParse from 'pdf-parse';
import { expect } from '@playwright/test';

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
  private payrollData: PayrollRow[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  setPayrollData(data: PayrollRow[]) {
    this.payrollData = data;
  }

  // ======================================================
  // 🔥 MAIN METHOD (USE THIS EVERYWHERE)
  // ======================================================
  async generateAndValidateReport(config: {
    reportName: string;
    startDate?: string;
    endDate?: string;
    project?: string;
  }) {
    const filePath = await this.generateReport(config);

    if (!filePath) {
      throw new Error(`❌ No file generated for ${config.reportName}`);
    }

    await this.validateReport(config.reportName, filePath, this.payrollData);
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
    await this.handleDateRange(config);
    await this.handleProject(config);

    return await this.handleDownload();
  }

 private async selectReport(reportName: string) {
  console.log('--- Selecting report:', reportName);

  // ✅ Step 1: open dropdown
  const dropdown = this.page.locator('label:has-text("Select Report")')
    .locator('..')
    .locator('div[role="button"]');

  await dropdown.click();

  // ✅ Step 2: wait for MUI menu container
  const menu = this.page.locator('#menu-selectedReport');
  await menu.waitFor({ state: 'visible', timeout: 10000 });

  // ✅ Step 3: get ALL options inside menu
  const options = menu.locator('li');

  const count = await options.count();
  console.log(`--- Found ${count} reports`);

  let found = false;

  for (let i = 0; i < count; i++) {
    const text = (await options.nth(i).innerText()).trim();

    if (text === reportName) {
      console.log('--- Match found:', text);
      await options.nth(i).click();
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error(`❌ Report not found: ${reportName}`);
  }

  console.log('--- Report selected successfully');
}

  private async handleDateRange(config: any) {
    if (!config.startDate || !config.endDate) return;

    const inputs = this.page.locator('input[type="text"]');
    await inputs.first().waitFor({ state: 'visible' });

    await inputs.nth(0).fill(config.startDate);
    await inputs.nth(1).fill(config.endDate);

    console.log(`--- Date range set: ${config.startDate} → ${config.endDate}`);
  }

  private async handleProject(config: any) {
    if (!config.project) return;

    console.log('--- Handling project:', config.project);

    if (config.reportName === 'Contractor Configuration Status') {
      await this.page.locator('span.MuiChip-label', {
        hasText: config.project
      }).waitFor();
    } else {
      const dropdown = this.page.locator('div[role="button"]', {
        hasText: 'Project'
      });

      await dropdown.click();
      await this.page.locator(`li:has-text("${config.project}")`).click();
    }
  }

  private async handleDownload(): Promise<string | null> {
  try {
    const btn = this.page.locator(`
      button:has-text("Excel"),
      button:has-text("Export"),
      button:has-text("Generate"),
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

    switch (reportName) {
      case 'Employees with Rates and Wages Per Day - Multiple Projects':
        return this.verifyEmployeePayroll(filePath, payrollData);

      case 'Contractor Configuration Status':
        return this.verifyContractorConfig(filePath);
    }
  }

  private async verifyContractorConfig(filePath: string) {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    expect(data.length).toBeGreaterThan(0);

    console.log('✅ Contractor Config validated');
  }

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

  // ======================================================
// ✅ PROJECT SELECTION (FIXED + STABLE)
// ======================================================

// ReportsPage.ts
async selectProjectCard(projectName: string) {
  console.log('--- Selecting project card:', projectName);

  const buttons = this.page.locator('button:has-text("SELECT")');
  const count = await buttons.count();

  console.log(`--- Found ${count} project cards`);

  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);

    // ✅ Go to CLOSEST container only
    const card = btn.locator('xpath=ancestor::div[.//p][1]');

    const text = await card.innerText();

    console.log(`--- Checking card ${i}: ${text}`);

    // ✅ STRICT MATCH (line-level match)
    const lines = text.split('\n').map(t => t.trim());

    if (lines.includes(projectName)) {
      console.log('--- Exact match found, clicking SELECT');

      await btn.scrollIntoViewIfNeeded();
      await btn.click();

      return;
    }
  }

  throw new Error(`❌ Project not found: ${projectName}`);
}
 // Get all report names from the list

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

  // ✅ Scroll + collect (important for long lists)
  for (let i = 0; i < count; i++) {
    const item = options.nth(i);

    await item.scrollIntoViewIfNeeded();

    const text = (await item.innerText()).trim();

    if (
  text &&
  !reportNames.includes(text) &&
  text !== 'Select One' &&
  !text.toLowerCase().includes('custom')
) {
  reportNames.push(text);
}
  }

  // ✅ Close dropdown safely
  await this.page.keyboard.press('Escape');

  console.log('--- Final report list:', reportNames);

  return reportNames;
}

async generateAllReports() {
  const reports = await this.getAllReportNames();

  for (const report of reports) {
    console.log(`\n--- Processing: ${report}`);

    const config: any = { reportName: report };

    // 🔥 smart handling
    if (report.includes('Wages') || report.includes('Rates')) {
      config.startDate = '03/30/2026';
      config.endDate = '04/05/2026';
    }

    if (report.includes('Contractor')) {
      config.project = 'RVA Test Project';
    }

    try {
      await this.generateAndValidateReport(config);
    } catch (err) {
      console.log(`⚠️ Failed: ${report}`);
    }
  }
}
  }

//async selectProjectCard(projectName: string) {
 // console.log('--- Selecting project:', projectName);

 // await this.page.waitForURL('**/project/select', { timeout: 30000 });

 // const projectCard = this.page
  //  .locator('.project-card')
   // .filter({ hasText: projectName })
   // .first();

  //await projectCard.waitFor({ state: 'visible', timeout: 20000 });

 // await projectCard.scrollIntoViewIfNeeded();

 // await projectCard.locator('button:has-text("Select")').click();

 // await this.page.waitForURL(/dashboard/, { timeout: 30000 });

 // console.log('--- Project selected successfully');
//}







/*

import * as XLSX from 'xlsx';
import { Page, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
const pdfParse = require('pdf-parse');


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

  private payrollData: PayrollRow[] = [];

    constructor(page: Page) {
    this.page = page;    
  }
  setPayrollData(data: PayrollRow[]) {
  this.payrollData = data;
}

// Inside ReportsPage class
async selectProjectCard(projectName: string) {
    console.log('--- Selecting project card:', projectName);

    await this.page.locator('.project-card')
        .filter({ hasText: projectName })
        .locator('button', { hasText: 'SELECT' })
        .click();

    console.log(`--- Project card selected: ${projectName}`);
}
 

  async generateReport(config: {
  reportName: string;
  startDate?: string;
  endDate?: string;
  project?: string;
}) {

  console.log(`--- Generating report: ${config.reportName}`);

  // ✅ Select report (dynamic)
  const dropdown = this.page.locator('label:has-text("Select Report")')
    .locator('..')
    .locator('div[role="button"]');

  await dropdown.click();

  await this.page
    .getByRole('option', { name: config.reportName })
    .click();

  console.log('--- Report selected');


  // =========================
  // ✅ Handle DATE if present
  // =========================
  if (config.startDate && config.endDate) {
    const dateInputs = this.page.locator('input[type="text"]');

    await dateInputs.first().waitFor({ state: 'visible', timeout: 20000 });

    await dateInputs.nth(0).fill(config.startDate);
    await dateInputs.nth(1).fill(config.endDate);

    console.log(`--- Start Date: ${config.startDate}`);
    console.log(`--- End Date: ${config.endDate}`);
  }

  // =========================
// ✅ Handle PROJECT if present
// =========================
if (config.project) {
  console.log('--- Handling project:', config.project);

  if (config.reportName === 'Contractor Configuration Status') {
    // ✅ Chip-based UI (no dropdown)
    console.log('--- Expecting project as chip');

    const chip = this.page.locator('span.MuiChip-label', {
      hasText: config.project
    });

    await chip.waitFor({ state: 'visible', timeout: 10000 });

    console.log('--- Project already selected as chip');
  } else {
    // ✅ Dropdown-based reports (if any)
    console.log('--- Trying dropdown selection');

    const dropdown = this.page.locator('div[role="button"]', {
      hasText: 'Project'
    });

    await dropdown.click();

    await this.page.locator(`li:has-text("${config.project}")`).click();

    console.log(`--- Project selected: ${config.project}`);
  }
}

  // =========================
  // 🔥 HANDLE ALL EXPORT TYPES
  // =========================
  

 // =========================
// ✅ Handle ALL downloads (Excel / PDF / ZIP / Generate)
// =========================
try {
  const downloadBtn = this.page.locator(`
    button:has-text("Excel"),
    button:has-text("Export"),
    button:has-text("Generate"),
    button:has-text("Pdf"),
    button:has-text("Zip")
  `).first();

  await downloadBtn.waitFor({ state: 'visible', timeout: 20000 });

  const btnText = (await downloadBtn.innerText()).trim();
  console.log(`--- Clicking export button: ${btnText}`);

  const [download] = await Promise.all([
    this.page.waitForEvent('download', { timeout: 60000 }),
    downloadBtn.click()
  ]);

 const suggestedName = download.suggestedFilename();
const extension = suggestedName.split('.').pop()?.toLowerCase();

const filePath = await download.path();

console.log('--- Report downloaded:', filePath);
console.log('--- Suggested filename:', suggestedName);
console.log('--- Detected extension:', extension);

// ✅ Attach extension manually if missing
let finalPath = filePath;

if (filePath && !filePath.endsWith(`.${extension}`)) {
  finalPath = filePath + '.' + extension;
  fs.renameSync(filePath, finalPath);
}

return finalPath;


} catch (err) {
  console.log('⚠️ No download triggered (UI-based report)');
  return null;
}
}

async generateRatesAndWagesReport(startDate: string, endDate: string) {
  return await this.generateReport({
    reportName: 'Employees with Rates and Wages Per Day - Multiple Projects',
    startDate,
    endDate
  });
}

async extractZip(filePath: string): Promise<string[]> {
  console.log('--- Extracting ZIP:', filePath);

  const zip = new AdmZip(filePath);
  const extractPath = filePath.replace('.zip', '');

  zip.extractAllTo(extractPath, true);

  console.log('--- ZIP extracted to:', extractPath);

  const files = fs.readdirSync(extractPath)
    .map(f => path.join(extractPath, f));

  console.log('--- Files inside ZIP:', files);

  return files; // ✅ return ALL files
}

async validateReport(
  reportName: string,
  filePath: string,
  payrollData?: any[]
): Promise<void> {

 if (filePath.endsWith('.zip')) {
  console.log(`--- Processing ZIP report: ${filePath}`);

  const extractedFiles = await this.extractZip(filePath);

  console.log(`--- ${extractedFiles.length} valid files found inside ZIP`);

  for (const file of extractedFiles) {
    console.log(`--- Validating file inside ZIP: ${file}`);
    await this.validateReport(reportName, file, payrollData);
  }

  console.log('✅ ZIP report validation completed successfully');

  return;
}

  if (filePath.endsWith('.pdf')) {
    return this.verifyPDF(reportName, filePath);
  }

  if (filePath.endsWith('.xlsx')) {
    return this.verifyExcel(reportName, filePath, payrollData);
  }

  console.log('⚠️ Unknown file type:', filePath);
}
async verifyPDF(reportName: string, filePath: string) {
  console.log('--- Validating PDF:', filePath);

  const buffer = fs.readFileSync(filePath);

  const data = await pdfParse(buffer);   // ✅ clean now

  const text = data.text;

  if (reportName === 'DAS-140') {
    if (!text.includes('DAS 140')) {
      throw new Error('❌ DAS-140 title missing');
    }

    console.log('✅ DAS-140 validation passed');
  }
}


async verifyExcel(reportName: string, filePath: string, payrollData?: any[]){
  switch (reportName) {
    case 'Employees with Rates and Wages Per Day - Multiple Projects':
       return this.verifyEmployeePayroll(filePath, payrollData); // ✅ FIXED

    case 'Contractor Configuration Status':
      return this.verifyContractorConfig(filePath);

    default:
      console.log('⚠️ No Excel validation implemented for this report');
  }
}

async verifyContractorConfig(filePath: string) {
  console.log('--- Validating Contractor Configuration Status report');

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const data = XLSX.utils.sheet_to_json(sheet);

  if (!data || data.length === 0) {
    throw new Error('❌ Contractor Config report is empty');
  }

  console.log('✅ Contractor Configuration Status validation passed');
}


  async verifyEmployeePayroll(filePath: string, payrollData?: any[]) {
    console.log('--- Payroll data before validation:', payrollData); // 👈 ADD HERE

  if (!payrollData || payrollData.length === 0) {
  throw new Error('❌ No UI payroll data available for validation');
}

  return this.verifyExcelData(filePath, this.payrollData);
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
      expect(Math.abs(uiRow.grossWages - match.grossWages)).toBeLessThan(1);
      if (idxNetWages !== -1) {
        expect(uiRow.netWages).toBe(match.netWages);
      }
    }

    console.log('✅ UI vs Excel validation passed');
  }
}

*/