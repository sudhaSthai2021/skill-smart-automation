import { Page, Locator, expect } from '@playwright/test';
import { DropdownUtils } from '../utils/dropdownUtils';

export class ImportPayrollPage {
  readonly page: Page;

  // ===== STATIC LOCATORS =====
  readonly layoutNameInput: Locator;
  readonly includeHeaderCheckbox: Locator;
  readonly createBtn: Locator;
  readonly testImportBtn: Locator;
  readonly importBtn: Locator;
  readonly fileUpload: Locator;

  constructor(page: Page) {
    this.page = page;

    this.layoutNameInput = page.locator('input[name="name"]');
    this.includeHeaderCheckbox = page.locator('input[name="hasHeaderRow"]');

    this.createBtn = page.getByRole('button', { name: 'Create' });
    this.testImportBtn = page.getByRole('button', { name: 'Test Import', exact: true });
    this.importBtn = page.getByRole('button', { name: 'Import', exact: true });

    this.fileUpload = page.locator('input[type="file"]');
  }

  // ===== DYNAMIC LOCATORS =====

  get createLayoutBtn(): Locator {
    return this.page.getByRole('link', { name: 'Create a new Excel layout' });
  }

  get fromDropdown(): Locator {
    return this.page
      .locator('label:has-text("From")')
      .locator('..')
      .locator('div[role="button"]');
  }

  get toDropdown(): Locator {
    return this.page
      .locator('label:has-text("To")')
      .locator('..')
      .locator('div[role="button"]');
  }

 get layoutDropdown() {
  return this.page.locator('p:has-text("Select one")').locator('..');
}
  get validationMessage(): Locator {
    return this.page.locator('text=validation conflict');
  }

  get testResultPanel(): Locator {
    return this.page.locator('text=Test Results');
  }

  // ===== TABLE ROWS (ReactTable) =====
  get rows(): Locator {
    return this.page.locator('div.rt-tr');
  }

  // ======================================================
  // CREATE LAYOUT
  // ======================================================
  async createLayout(name: string) {
    await this.createLayoutBtn.click();

    await this.layoutNameInput.fill(name);
    await this.includeHeaderCheckbox.check();

    await DropdownUtils.select(this.fromDropdown, 'A');
    await DropdownUtils.select(this.toDropdown, 'U');
  }

  // ======================================================
  // COLUMN MAPPING
  // ======================================================
async mapColumns(mapping: { column: string; property: string }[]) {

  for (const { column, property } of mapping) {

    console.log(`--- Mapping ${column} → ${property}`);

    // 1. Find row by column text
    const row = this.page
      .locator('div.rt-tr')
      .filter({
        has: this.page.locator('div.rt-td').first().locator('p', {
          hasText: column
        })
      })
      .first();

    await row.scrollIntoViewIfNeeded();

    // 2. Get dropdown inside that row
    const dropdown = row.locator('div[role="button"][id*="mui-component-select"]');

    await dropdown.waitFor({ state: 'visible' });
    await dropdown.click();

    // 3. Wait for listbox
    const listbox = this.page.locator('ul[role="listbox"]');
    await listbox.waitFor({ state: 'visible' });

    // 🔥 4. Type to jump (first 3 chars for accuracy)
    await this.page.keyboard.type(property.slice(0, 3));

    // 5. Select option
    const option = listbox.locator('li', { hasText: property }).first();

    // 🔥 Fallback: ensure it's in view
    await option.scrollIntoViewIfNeeded();

    await option.click();

    // 6. Wait until dropdown reflects selection (instead of timeout)
    await expect(dropdown).toContainText(property);
  }
}

  // ======================================================
  // SAVE / SELECT / IMPORT FLOW
  // ======================================================
  async saveLayout() {
  await this.createBtn.click();
  await this.page.locator('.MuiAlert-message:has-text("Saved")')
  .waitFor({ state: 'visible' });

  // 🔥 give UI time to update dropdown data
  await this.page.waitForTimeout(2000);
}
 async selectLayout(name: string) {
  const dropdown = this.layoutDropdown;

  await dropdown.click();

  // wait for dropdown container
  const listbox = this.page.locator('ul[role="listbox"]');
  await listbox.waitFor({ state: 'visible' });

  // now wait for option
  const option = listbox.locator('li', { hasText: name });

  await option.last().waitFor({ timeout: 15000 });
  await option.last().click();
}
  async getTemplate() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.getByText('GET TEMPLATE').click()
    ]);

    console.log('📥 Template downloaded:', await download.path());
  }

  async uploadFile(filePath: string) {
    await this.fileUpload.setInputFiles(filePath);
  }

  async testImport() {
    await this.testImportBtn.click();
    await this.testResultPanel.waitFor({ timeout: 10000 });
  }

 async hasValidationError(): Promise<boolean> {
  const exists = await this.page.locator('.test-results').count();

  if (exists === 0) {
    return false; // ✅ no validation panel = no errors
  }

  return await this.validationMessage.isVisible();
}

  async getValidationMessage(): Promise<string | null> {
  const results = this.page.locator('.test-results');

  if (await results.count() === 0) {
    return null; // ✅ no panel
  }

  return await results.textContent();
}

  async importPayroll() {
  await this.importBtn.waitFor({ state: 'visible' });
  await this.importBtn.click();
}
}