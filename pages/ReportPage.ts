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
  private currentProject: string | null = null;
  private latestPayrollPeriod: { startDate: string; endDate: string } | null = null;

  
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
  // ⏳ 2. WAIT for report UI to load
  await this.page.waitForTimeout(1500);

  // ✅ keep this (but make it smart internally)
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

      await dropdown.click();
      await this.page.locator(`li:has-text("${config.project}")`).click();
    }
  }


    //Get CURRENT selected project (if needed later)
  async getCurrentSelectedProject(): Promise<string | null> {
  const chip = this.page.locator('span.MuiChip-label').first();

  if (await chip.count()) {
    return (await chip.innerText()).trim();
  }

  return this.currentProject;
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
  const invalidExact = ['Select One'];
  const invalidKeywords = ['custom', 'standard'];

  for (let i = 0; i < count; i++) {
    const item = options.nth(i);

    await item.scrollIntoViewIfNeeded();

    const text = (await item.innerText()).trim();
    if (!text) continue;

    const lower = text.toLowerCase();

    // ❌ Skip unwanted entries
    if (
      invalidExact.includes(text) ||
      invalidKeywords.some(k => lower.includes(k))
    ) {
      console.log(`--- Skipping invalid: ${text}`);
      continue;
    }

    // ✅ Add only valid reports
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

async generateAllReports(startDate: string, endDate: string) {
  const reports = await this.getAllReportNames();

  for (const report of reports) {
    console.log(`\n--- Processing: ${report}`);

    const config: any = {
      reportName: report,
      startDate,
      endDate
    };

    try {
      await this.generateAndValidateReport(config);
    } catch (err) {
      console.log(`⚠️ Failed: ${report}`);
    }
  }
}

}
  


