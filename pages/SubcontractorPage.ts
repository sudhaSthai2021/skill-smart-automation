import { Page, Locator, expect } from '@playwright/test';
import { DropdownUtils } from '../utils/dropdownUtils';

export class SubcontractorPage {
  readonly page: Page;

  
  readonly subcontractorNameInput: Locator;
  readonly feinInput: Locator;
  readonly businessTypeDropdown: Locator;

  readonly street1Input: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipInput: Locator;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;

  readonly ownerEthnicityDropdown: Locator;
readonly ownerGenderDropdown: Locator;
readonly coOwnerEthnicityDropdown: Locator;
readonly coOwnerGenderDropdown: Locator;

  readonly saveBtn: Locator;
  readonly successToast: Locator;
  readonly searchInput: Locator;
  readonly yesBtn: Locator;

  constructor(page: Page) {
    this.page = page;

this.subcontractorNameInput = page.locator(
  'input[placeholder*="Subcontractor" i]:not([disabled]), input[placeholder*="Supplier" i]:not([disabled]), input[placeholder*="Search" i]:not([disabled])'
).first();

    this.feinInput = page.locator(
  'input[placeholder*="EIN" i], input[name*="ein" i]'
).first();

    this.businessTypeDropdown = page.locator(
      '[id^="mui-component-select-business"], [id*="businessType"]'
    ).first();

    this.street1Input = page.locator('#street1');
    this.cityInput = page.locator('#city');
    this.stateInput = page.locator('#state');
    this.zipInput = page.locator('#zip');

    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.emailInput = page.locator('#email');
    this.phoneInput = page.locator('input[type="tel"], #phone').first();

    this.ownerEthnicityDropdown = page.locator('#mui-component-select-ownerEthnicityId');
this.ownerGenderDropdown = page.locator('#mui-component-select-ownerGenderId');
this.coOwnerEthnicityDropdown = page.locator('#mui-component-select-coOwnerEthnicityId');
this.coOwnerGenderDropdown = page.locator('#mui-component-select-coOwnerGenderId');

    this.saveBtn = page.getByRole('button', { name: /^save$/i });
    this.successToast = page.locator('.MuiAlert-message');

    this.searchInput = page.locator('.ReactTable .rt-thead.-filters input').first();
    this.yesBtn = page.getByRole('button', { name: /^yes$/i });
  }

  // ======================================================

  async waitForTableData() {
    await this.page.waitForFunction(() => {
      const rows = Array.from(
        document.querySelectorAll('.ReactTable .rt-tbody .rt-tr-group')
      );

      return rows.some(row => {
        const text = row.textContent || '';
        return text.replace(/\s+/g, '').length > 0;
      });
    }, { timeout: 30000 });
  }

  // ======================================================

  async handleConfirmationIfPresent() {
    try {
      await this.yesBtn.waitFor({ state: 'visible', timeout: 4000 });
      console.log('--- Confirmation popup detected → clicking YES');
      await this.yesBtn.click();
    } catch {
      console.log('--- No confirmation popup');
    }
  }

  // ======================================================

  async createSubcontractor(subcontractorName: string) {
  console.log('--- Creating subcontractor:', subcontractorName);

  // ✅ Step 1: Select Contractor's Prime dropdown if needed
  const primeDropdown = this.page.locator(
    '[id^="mui-component-select"], div[role="button"]'
  ).filter({ hasText: /California GC|Select/i }).first();

  if (await primeDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('--- Prime contractor already visible/selected');
  }

  // ✅ Step 2: Fill EIN first
  const einInput = this.page.locator(
    'input[placeholder*="EIN" i], input[name*="ein" i]'
  ).first();

  await einInput.waitFor({ state: 'visible', timeout: 30000 });
  const unique = String(Date.now()).slice(-9);

const ein =
  `${unique.slice(0,3)}-${unique.slice(3,5)}-${unique.slice(5,9)}`;

await einInput.click();
await einInput.fill(ein);

await this.page.keyboard.press('Tab');

console.log('✅ EIN entered:', ein);

  console.log('✅ EIN entered');

  await this.page.waitForTimeout(1000);

  // ✅ Step 3: Now Company Name should become enabled
  const companyName = this.page.locator('#name');

  await expect(companyName).toBeEnabled({ timeout: 30000 });
  await companyName.fill(subcontractorName);

  console.log('✅ Company Name entered:', subcontractorName);

  // ✅ Step 4: Contract Number
  const contractNumber = this.page.locator(
    'input[placeholder*="Contract" i], input[name*="contract" i]'
  ).first();

  if (await contractNumber.isVisible({ timeout: 5000 }).catch(() => false)) {
    await contractNumber.fill(`CN-${Date.now()}`);
    console.log('✅ Contract Number entered');
  }
  try {
  await DropdownUtils.select(this.ownerEthnicityDropdown, 'Asian');
  await DropdownUtils.select(this.ownerGenderDropdown, 'Male');
  await DropdownUtils.select(this.coOwnerEthnicityDropdown, 'Asian');
  await DropdownUtils.select(this.coOwnerGenderDropdown, 'Female');

  console.log('✅ Owner / Co-owner details selected');
} catch {
  console.log('⚠️ Owner / Co-owner dropdown selection skipped');
}

  console.log('✅ Basic subcontractor details entered');
}

  // ======================================================

  async fillAddressDetails() {
  console.log('--- Filling subcontractor address');

  // Address History
  await this.page.getByText('Address History', {
    exact: true,
  }).click();

  // Add New
  const addNew = this.page.getByText('Add New', {
    exact: true,
  }).first();

  await addNew.waitFor({
    state: 'visible',
    timeout: 30000,
  });

  await addNew.click();

  console.log('--- Add New Address clicked');

  // =====================================================
  // Address fields FIRST
  // =====================================================

  await this.street1Input.waitFor({
    state: 'visible',
    timeout: 30000,
  });

  await this.street1Input.fill('Test Street 1');
  await this.cityInput.fill('Los Angeles');
  await this.stateInput.fill('CA');
  await this.zipInput.fill('90001');

  console.log('✅ Address fields entered');

  // =====================================================
// Address Type dropdown
// =====================================================

const addressTypeDropdown = this.page
  .locator('div[role="button"]')
  .filter({ hasText: /select/i })
  .last();

await addressTypeDropdown.scrollIntoViewIfNeeded();
await addressTypeDropdown.click();

const options = this.page.locator('li[role="option"]');

await options.first().waitFor({
  state: 'visible',
  timeout: 15000,
});

const optionTexts = await options.allInnerTexts();
console.log('--- Address Type options:', optionTexts);

// Skip disabled "Select one..."
const corporateOffice = options.filter({
  hasText: 'Corporate Office',
}).first();

await corporateOffice.click();

console.log('✅ Address Type selected: Corporate Office');

// =====================================================
// Effective Date
// =====================================================

const dateInputs = this.page.locator('input[placeholder="mm/dd/yyyy"]');
const effectiveDate = dateInputs.last();

await effectiveDate.scrollIntoViewIfNeeded();
await effectiveDate.click();

await this.page.keyboard.press('Control+A');
await this.page.keyboard.press('Backspace');
await this.page.keyboard.type('05/01/2026');
await this.page.keyboard.press('Tab');

console.log('✅ Effective Date entered');
  // =====================================================
  // ADD
  // =====================================================

  const addBtn = this.page.getByRole('button', {
    name: /^add$/i,
  });

  await addBtn.waitFor({
    state: 'visible',
    timeout: 30000,
  });

  await addBtn.click();

  console.log('✅ Address details entered');
}

  // ======================================================

 async fillContactDetails() {
  console.log('--- Filling subcontractor contact');

  await this.page.getByText('Contact History', { exact: true }).click();

  const addNew = this.page.getByText('Add New', { exact: true }).first();
  await addNew.waitFor({ state: 'visible', timeout: 30000 });
  await addNew.click();

  const unique = Date.now();

  await this.firstNameInput.waitFor({ state: 'visible', timeout: 30000 });

  await this.firstNameInput.fill('Auto');
  await this.lastNameInput.fill('Contact');
  await this.emailInput.fill(`autosub${unique}@test.com`);
  await this.phoneInput.fill('+1(707)323-2723');

  await this.page.getByRole('button', { name: /^add$/i }).click();

  console.log('✅ Contact details entered');
}
 //=======================================================

async fillContractDates() {
  console.log('--- Filling contract dates');

  const dateInputs = this.page.locator(
    'input[placeholder="mm/dd/yyyy"]'
  );

  await dateInputs.first().waitFor({
    state: 'visible',
    timeout: 30000,
  });

  await dateInputs.nth(0).fill('05/01/2026');
  await this.page.keyboard.press('Tab');

  await dateInputs.nth(1).fill('12/31/2026');
  await this.page.keyboard.press('Tab');

  console.log('✅ Contract dates entered');

  // ✅ VERY IMPORTANT
  const addBtn = this.page.getByRole('button', {
    name: /^add$/i
  });

  await addBtn.waitFor({
    state: 'visible',
    timeout: 30000
  });

  await addBtn.click();

  console.log('✅ Contract dates added');
}

//=========================================================

// ======================================================

async fillAwardDetails() {
  console.log('--- Filling Award Details');

  const awardDetails = this.page.getByText('Award Details', { exact: true });

  await awardDetails.waitFor({ state: 'visible', timeout: 30000 });
  await awardDetails.scrollIntoViewIfNeeded();
  await awardDetails.click();

  console.log('--- Award Details opened');

  await this.page.waitForTimeout(1000);

  // ✅ Award Amount
  const awardAmount = this.page.locator('#awardAmount');

  await awardAmount.waitFor({ state: 'visible', timeout: 30000 });
  await awardAmount.scrollIntoViewIfNeeded();
  await awardAmount.click();

  await this.page.keyboard.press('Control+A');
  await this.page.keyboard.press('Backspace');
  await this.page.keyboard.type('50000');
  await this.page.keyboard.press('Tab');

  const amountValue = await awardAmount.inputValue().catch(() => '');
  console.log('--- Award Amount value:', amountValue);

  if (!amountValue || amountValue === '0.00') {
    throw new Error('❌ Award Amount was not entered correctly');
  }

  console.log('✅ Award Amount entered');

  // ✅ Award Hours
  const awardHours = this.page.locator('#awardHours');

  await awardHours.waitFor({ state: 'visible', timeout: 30000 });
  await awardHours.scrollIntoViewIfNeeded();
  await awardHours.click();

  await this.page.keyboard.press('Control+A');
  await this.page.keyboard.press('Backspace');
  await this.page.keyboard.type('1000');
  await this.page.keyboard.press('Tab');

  const hoursValue = await awardHours.inputValue().catch(() => '');
  console.log('--- Award Hours value:', hoursValue);

  if (!hoursValue || hoursValue === '0.00') {
    throw new Error('❌ Award Hours was not entered correctly');
  }

  console.log('✅ Award Hours entered');

  console.log('✅ Award Details entered');
}
//======================================================
async fillWorkInfo() {
  console.log('--- Filling Work Info');

  await this.page.getByText('Work Info', { exact: true }).click();

  const workCodeDropdown = this.page.locator('#mui-component-select-compCodeIds');

  await workCodeDropdown.waitFor({ state: 'visible', timeout: 30000 });
  await workCodeDropdown.click();

  const compCode1 = this.page.getByRole('option', { name: 'Comp Code 1' });

  await compCode1.waitFor({ state: 'visible', timeout: 30000 });
  await compCode1.click();

  // close dropdown if still open
  await this.page.keyboard.press('Escape');

  // remove focus
  await this.page.mouse.click(900, 450);

  await this.page.waitForTimeout(1000);

  console.log('✅ Work Code selected: Comp Code 1');
}
//======================================================

async addContact() {
  console.log('--- Filling subcontractor contact details');

  const contactsTab = this.page.getByRole('tab', { name: /contacts/i });
  await contactsTab.waitFor({ state: 'visible', timeout: 30000 });
  await contactsTab.click();

  console.log('--- Contacts tab opened');

  const addContactBtn = this.page.getByRole('button', {
    name: /add contact/i,
  });

  await addContactBtn.waitFor({ state: 'visible', timeout: 30000 });
  await addContactBtn.click();

  const addNewContact = this.page.getByText('+ Add New Contact', {
    exact: true,
  });

  await addNewContact.waitFor({ state: 'visible', timeout: 30000 });
  await addNewContact.click();

  await expect(
    this.page.getByText('Add New Contact to Contract', { exact: true })
  ).toBeVisible({ timeout: 30000 });

  const unique = Date.now();

  // Email
  await this.page
    .locator('label:has-text("Email")')
    .locator('..')
    .locator('input')
    .fill(`green${unique}@gmail.com`);

  // First Name
  await this.page
    .locator('label:has-text("First Name")')
    .locator('..')
    .locator('input')
    .fill('Sudha');

  // Last Name
  await this.page
    .locator('label:has-text("Last Name")')
    .locator('..')
    .locator('input')
    .fill('Sankar');

  // Phone number
  await this.page.locator('input[type="tel"]').fill('7074343443');

  const selectAllReports = this.page.getByText('Select All Reports', {
    exact: true,
  });

  await selectAllReports.waitFor({ state: 'visible', timeout: 30000 });
  await selectAllReports.click();

  const saveAndCloseBtn = this.page.getByRole('button', {
    name: /save & close/i,
  });

  await saveAndCloseBtn.waitFor({ state: 'visible', timeout: 30000 });
  await expect(saveAndCloseBtn).toBeEnabled({ timeout: 30000 });
  await saveAndCloseBtn.click();

  await expect(addContactBtn).toBeVisible({ timeout: 30000 });

  console.log('✅ Contact details entered');
}
// ======================================================
  async saveSubcontractor() {
  console.log('--- Saving subcontractor');

  await this.page.keyboard.press('Escape');
await this.page.waitForTimeout(1000);

  const saveBtn = this.page
    .locator('button:has-text("Save"), input[value="Save"]')
    .last();

  await saveBtn.waitFor({ state: 'visible', timeout: 30000 });

  try {
    await saveBtn.click();
  } catch {
    console.log('⚠️ Normal Save click failed, trying force click');
    await saveBtn.click({ force: true });
  }

  await this.handleConfirmationIfPresent();


  const toast = this.page.locator('.MuiAlert-message');

  try {
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Save message:', await toast.innerText());
  } catch {
    console.log('⚠️ Save toast not visible, continuing');
  }

  console.log('✅ Save completed');
}
  // ======================================================

  async searchSubcontractor(subcontractorName: string) {
    console.log('--- Searching subcontractor:', subcontractorName);

    await this.searchInput.waitFor({ state: 'visible', timeout: 30000 });
    await this.searchInput.fill(subcontractorName);

    const row = this.page
      .locator('.ReactTable .rt-tbody .rt-tr-group')
      .filter({ hasText: subcontractorName });

    await expect(row.first()).toBeVisible({ timeout: 30000 });

    console.log('✅ Subcontractor found:', subcontractorName);

    return row.first();
  }

  // ======================================================

  async assertSubcontractorCreated(subcontractorName: string) {
    console.log('--- Verifying subcontractor creation');

    await this.searchSubcontractor(subcontractorName);

    console.log('✅ Creation assertion passed:', subcontractorName);
  }

  // ======================================================

 async deleteSubcontractor(subcontractorName: string) {
  console.log('--- Deleting subcontractor:', subcontractorName);

  const row = await this.searchSubcontractor(subcontractorName);

  // Open subcontractor record by clicking the name/link inside the row
  const recordLink = row.locator('a, [role="link"], .rt-td').first();

  await recordLink.waitFor({ state: 'visible', timeout: 30000 });
  await recordLink.click({ force: true });

  await this.page.waitForURL(/subcontractors\/editor/, {
    timeout: 30000,
  });

  await expect(
    this.page.locator('text=/Edit Subcontractor/i')
  ).toBeVisible({ timeout: 30000 });

  console.log('--- Subcontractor record opened');

  // Go to Contacts
  const contactsTab = this.page
    .locator('p, span, div')
    .filter({ hasText: /^Contacts$/ })
    .first();

  await contactsTab.waitFor({ state: 'visible', timeout: 30000 });
  await contactsTab.click({ force: true });

  console.log('--- Contacts opened');

  // Delete contact under Actions
  const contactDeleteIcon = this.page
    .locator('tr:has-text("Sudha") svg, tr:has-text("Sudha") button')
    .last();

  await contactDeleteIcon.waitFor({ state: 'visible', timeout: 30000 });
  await contactDeleteIcon.click({ force: true });

  await this.page.getByRole('button', { name: /^yes$/i }).click();

  console.log('✅ Contact deleted');

  await this.page.waitForTimeout(1000);

  // Go to Contract
  const contractTab = this.page
    .locator('p, span, div')
    .filter({ hasText: /^Contract$/ })
    .first();

  await contractTab.waitFor({ state: 'visible', timeout: 30000 });
  await contractTab.click({ force: true });

  console.log('--- Contract opened');

  // Delete subcontractor
  const deleteBtn = this.page.getByRole('button', { name: /^delete$/i });

  await deleteBtn.waitFor({ state: 'visible', timeout: 30000 });
  await deleteBtn.click({ force: true });

  await this.page.getByRole('button', { name: /^yes$/i }).click();

  console.log('✅ Subcontractor delete confirmed');

  await this.page.waitForLoadState('networkidle');
  await this.page.waitForTimeout(1000);

  console.log('✅ Delete completed');
}

  // ======================================================

  async assertSubcontractorDeleted(subcontractorName: string) {
    console.log('--- Verifying subcontractor deletion:', subcontractorName);

    await this.searchInput.waitFor({ state: 'visible', timeout: 30000 });
    await this.searchInput.fill('');
    await this.searchInput.fill(subcontractorName);

    const row = this.page
      .locator('.ReactTable .rt-tbody .rt-tr-group')
      .filter({ hasText: subcontractorName });

    await expect(row).toHaveCount(0, { timeout: 30000 });

    console.log('✅ Deletion assertion passed:', subcontractorName);
    //await this.page.pause();
  }
}