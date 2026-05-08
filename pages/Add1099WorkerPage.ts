import { Page, Locator, expect } from '@playwright/test';
import { DropdownUtils } from '../utils/dropdownUtils';

export class Add1099WorkerPage {
  readonly page: Page;

  readonly orgDropdown: Locator;

  readonly firstName: Locator;
  readonly middleInitial: Locator;
  readonly lastName: Locator;
  readonly ssn: Locator;
  readonly genderDropdown: Locator;
  readonly ethnicityDropdown: Locator;

  readonly addNewAddressBtn: Locator;
  readonly street1: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly zip: Locator;
  readonly addAddressBtn: Locator;

  
  readonly saveBtn: Locator;
  readonly successToast: Locator;

  readonly workersTab: Locator;
  readonly searchInput: Locator;

  readonly deleteBtn: Locator;
  readonly confirmYes: Locator;

  constructor(page: Page) {
    this.page = page;

    this.orgDropdown = page.getByLabel('This worker is contracted with');

    this.firstName = page.locator('#firstName');
    this.middleInitial = page.locator('#middleInitial');
    this.lastName = page.locator('#lastName');
    this.ssn = page.locator('#ssn');

    this.genderDropdown = page.locator('#mui-component-select-genderId');
    this.ethnicityDropdown = page.locator('#mui-component-select-ethnicityId');

    this.addNewAddressBtn =page
  .locator('text=Address')
  .first()
  .locator('xpath=following::p[text()="Add New"]')
  .first();

    this.street1 = page.locator('#street1');
    this.city = page.locator('#city');
    this.state = page.locator('#state');
    this.zip = page.locator('#zip');
    this.addAddressBtn = page.getByRole('button', { name: /^Add$/ });

    this.saveBtn = page.getByRole('button', { name: 'Save' });
    this.successToast = page.locator('.MuiAlert-message', { hasText: 'Saved' });

    this.workersTab = page.getByRole('tab', { name: '1099 WORKERS' });
    this.searchInput = this.page.locator('.ReactTable .rt-thead.-filters input').first();

    this.deleteBtn = page.getByRole('button', { name: /delete/i });
    this.confirmYes = page.getByRole('button', { name: 'YES' });
  }

  // =======================================================

  async extractOrganization() {
  console.log('--- Extracting organization');

  await this.orgDropdown.waitFor({ state: 'visible' });

  const org = await this.orgDropdown.textContent();

  console.log('Organization:', org?.trim());

  return org?.trim();
}

  // =======================================================

  async fillBasicDetails() {
    const firstName = 'Auto' + Date.now();
    const lastName = 'Worker';

    await this.firstName.fill(firstName);
    await this.middleInitial.fill('A');
    await this.lastName.fill(lastName);
    await this.ssn.fill('0000');

    await DropdownUtils.select(this.genderDropdown, 'Male');
    await DropdownUtils.select(this.ethnicityDropdown, 'Asian');

    return { firstName, lastName };
  }

  // =======================================================

  async addAddress() {
    await this.addNewAddressBtn.click();

    await this.street1.fill('Street 1');
    await this.city.fill('City');
    await this.state.fill('CA');
    await this.zip.fill('90001');

    await this.addAddressBtn.click();
  }

  // =======================================================

  async selectWorkClasses() {
  const classes = ['Fitter', 'Label Test', 'Not Used WC 1'];

  for (const name of classes) {
    const row = this.page.locator('li', { hasText: name });

    const checkbox = row.locator('input[type="checkbox"]');

    await checkbox.check();
  }

  console.log('✅ Work classes selected');
}

  // =======================================================

  async saveWorker() {
    await this.saveBtn.click();

    await expect(this.successToast).toBeVisible({ timeout: 10000 });
  }

  // =======================================================

  async searchAndOpen(name: string) {
  //await this.page.pause();
  await this.searchInput.fill(name);

  const row = this.page.locator('.ReactTable .rt-tbody .rt-tr-group').filter({ hasText: name });
  await expect(row).toHaveCount(1, { timeout: 15000 });
   await expect(row).toBeVisible();

  await row.click();
}


 

}