import { Page, Locator, expect } from '@playwright/test';
import { DropdownUtils } from '../utils/dropdownUtils';


export class AddEmployeePage {
  readonly page: Page;

  readonly firstName: Locator;
  readonly middleName:Locator;
  readonly lastName: Locator;
  readonly ssn: Locator;
  readonly employeeId: Locator;
  readonly saveButton: Locator;
  readonly phone: Locator;
  readonly genderDropdown: Locator;
  readonly ethnicityDropdown: Locator;
  readonly addressHistoryTab: Locator;
  readonly workInfoTab: Locator;
  readonly payRatesTab: Locator;
  readonly addNewEntryRowBtn: Locator;
  readonly addNewButton: Locator;
  readonly street1Input: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly apprenticeNumberInput: Locator;
  readonly addButton: Locator;
  readonly successToast: Locator;
  readonly countryDropdown: Locator;
  readonly effectiveDateInput: Locator;
  readonly deleteButton: Locator;
  readonly confirmDeleteButton: Locator;
  readonly confirmDialog: Locator;
  readonly confirmYesButton: Locator;
  readonly searchInput: Locator;
  readonly employeesTab: Locator;
  readonly deleteToast: Locator;


  
  constructor(page: Page) {
    this.page = page;

    this.firstName = page.locator('#firstName'); // update
    this.middleName=page.locator('#middleInitial')
    this.lastName = page.locator('#lastName');   // update
    this.ssn=page.locator('#ssn');
    this.employeeId=page.locator("#employeeId");
    this.phone=page.locator('input[type="tel"]');
    this.saveButton = page.locator('button:has-text("Save")');
    this.genderDropdown = page.locator('#mui-component-select-genderId');
    this.ethnicityDropdown = page.locator('#mui-component-select-ethnicityId');
    this.addressHistoryTab = page.getByRole('tab', { name: 'Address History' });
    this.workInfoTab=page.getByRole('tab', { name: 'Work Info' });
    this.payRatesTab=page.getByRole('tab', { name: 'Pay Rates' });
    this.apprenticeNumberInput=page.locator('#apprenticeNumber');
    this.addNewEntryRowBtn=page.getByRole('button', { name: 'ADD NEW ENTRY ROW' });
    this.addNewButton = page.locator('p:has-text("Add New")');
    this.deleteButton =  this.page.getByRole('button', { name: 'Delete Employee' });
    this.confirmDeleteButton = page.getByRole('button', { name: /confirm|yes/i });
    this.confirmDialog= page.getByRole('dialog');
    this.confirmYesButton = page.getByRole('button', { name: 'YES' });
    this.searchInput = this.page.locator('.ReactTable .rt-thead.-filters input').first();
    this.employeesTab =this.page.getByRole('link', { name: 'Employees', exact: true });
    this.deleteToast =  this.page.locator('.MuiAlert-message:has-text("Employee deleted")');


    // Inside constructor(page: Page)
    this.street1Input = page.locator('#street1');
    this.cityInput    = page.locator('#city');
    this.stateInput   = page.locator('#state');      // adjust if ID differs
    this.zipCodeInput = page.locator('#zip');    // adjust if ID differs
    this.countryDropdown= page.locator('#mui-component-select-country');
    this.effectiveDateInput=page.locator('input[placeholder="mm/dd/yyyy"]');
    this.addButton    = page.getByRole('button', { name: 'Add', exact: true });
    //this.successToast = page.locator('div.MuiAlert-message:has-text("Employee has been saved")');
    this.successToast = page.locator('.MuiAlert-message'); // generic

    
  }
  //===============================================================================================================

   async fillBasicDetails() {
    const firstName = 'Sudha Leela' + Date.now()// 🔥 unique
    const lastName = 'Sankaran';
    const middleName ='SS'

    
    await this.firstName.fill(firstName);
    await this.middleName.fill('SS');
    await this.lastName.fill(lastName);
    await this.ssn.fill('0000');
    await this.employeeId.fill('C' + Date.now());
    await this.phone.fill('+1(707)323-2723');
    
     return { firstName, lastName }; // ✅ return values
  }
  //============================================================================================================
  async addAddressDetails(
  street1: string,
  city: string,
  state: string,
  zip: string,
  effectiveDate: string
) {
  console.log('--- Adding Address Details');

  // ✅ Tab navigation inside POM
  await expect(this.addressHistoryTab).toBeVisible();
  await this.addressHistoryTab.click();

  // ✅ Click Add New
  await this.addNewButton.click();

  // ✅ Fill form
  await expect(this.street1Input).toBeVisible();
  await this.street1Input.fill(street1);

  await this.cityInput.fill(city);
  await this.stateInput.fill(state);
  await this.zipCodeInput.fill(zip);

  // Country

  await DropdownUtils.select(this.countryDropdown, 'United States');

  // Date
  await this.effectiveDateInput.fill(effectiveDate);

  // Add
  await this.addButton.click();

  console.log('✅ Address added');
}

  //=============================================================================================================

  async fillWorkInfo() {
  console.log('--- Navigating to Work Info');

  await this.workInfoTab.click();

  // ✅ Wait properly for field
  await this.apprenticeNumberInput.waitFor({ state: 'visible', timeout: 10000 });

  // ✅ Clear + fill (important for MUI inputs)
  await this.apprenticeNumberInput.fill('');
  await this.apprenticeNumberInput.fill('1233');

  console.log('✅ Apprentice Number entered');
}

//==============================================================================================================
async addPayRates() {
  console.log('--- Adding Pay Rates');

  await this.payRatesTab.click();
  await this.addNewEntryRowBtn.click();

  const dialog = this.page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // ============================
  // 1️⃣ Select Dropdown (Label)
  // ============================
  const labelDropdown = dialog.getByRole('button', { name: /select/i }).first();
  await labelDropdown.click();

  const listbox = this.page.getByRole('listbox');
  await expect(listbox).toBeVisible();

  const options = listbox.getByRole('option');

  for (let i = 0; i < await options.count(); i++) {
    const opt = options.nth(i);
    const disabled = await opt.getAttribute('aria-disabled');

    if (disabled !== 'true') {
      await opt.click();
      break;
    }
  }

  await expect(listbox).toBeHidden({ timeout: 5000 });

  // 🔥 IMPORTANT: wait for UI update after dropdown selection
  await this.page.waitForTimeout(1000);

  // ============================
  // 2️⃣ Full Time Checkbox
  // ============================
  const fullTimeCheckbox = dialog.getByRole('checkbox', { name: /full time/i });

  if (await fullTimeCheckbox.isVisible()) {
    const checked = await fullTimeCheckbox.isChecked().catch(() => false);

    if (!checked) {
      await fullTimeCheckbox.click();
    }
  }

  // 🔥 wait for dependent fields to appear
  await this.page.waitForTimeout(1000);

  // ============================
  // 3️⃣ Effective Date
  // ============================
  const dateInputs = dialog.locator('input[placeholder="mm/dd/yyyy"]');

  const effectiveDate = dateInputs.first();
  await expect(effectiveDate).toBeVisible({ timeout: 15000 });

  await effectiveDate.click();
  await this.page.keyboard.type('04/01/2026');
  await this.page.keyboard.press('Tab');

  // ============================
  // 4️⃣ Expiry Date
  // ============================
  const expiryDate = dateInputs.nth(1);

  await expect(expiryDate).toBeVisible({ timeout: 15000 });

  await expiryDate.click();
  await this.page.keyboard.type('12/31/2026');
  await this.page.keyboard.press('Tab');

  // ============================
  // 5️⃣ Fill other inputs
  // ============================
  const inputs = dialog.locator('input');

  for (let i = 0; i < await inputs.count(); i++) {
    const input = inputs.nth(i);

    try {
      const value = await input.inputValue();

      if (!value || value === '0.000') {
        await input.fill('8');
      }
    } catch {}
  }

  // ============================
  // 6️⃣ Save
  // ============================
  const saveBtn = dialog.getByRole('button', { name: /save/i });

  await expect(saveBtn).toBeEnabled({ timeout: 15000 });
  await saveBtn.click();

  console.log('✅ Pay Rates fully added');
}

  //=============================================================================================================
async selectGender(value: string) {
  await DropdownUtils.select(this.genderDropdown, value);
}



//================================================================================================================
async selectEthnicity(value: string) {
  await DropdownUtils.select(this.ethnicityDropdown, value);
}
//=================================================================================================================

 async goToAddressHistory() {
    await expect(this.addressHistoryTab).toBeVisible();
    await this.addressHistoryTab.click();

  }

//=================================================================================================================

async clickAddNew() {
 // await expect(this.addNewButton).toBeVisible();
  await this.addNewButton.click();

}

//===============================================================================================================

async clickEmployeesTab() {

  await this.employeesTab.click();
}

async fillAddress(street1: string, city: string, state: string, zip: string,
  effectiveDate: string) {

    
    await expect(this.street1Input).toBeVisible();
    await this.street1Input.fill(street1);

    await expect(this.cityInput).toBeVisible();
    await this.cityInput.fill(city);

    await expect(this.stateInput).toBeVisible();
    await this.stateInput.fill(state);

    await expect(this.zipCodeInput).toBeVisible();
    await this.zipCodeInput.fill(zip);

    

    // --- 4️⃣ Select Country (United States) ---
      const countryDropdown = this.page.locator('#mui-component-select-country');
      await countryDropdown.waitFor({ state: 'visible', timeout: 10000 }); // ✅ NEW
      await expect(countryDropdown).toBeVisible({ timeout: 5000 });
      await DropdownUtils.select(this.countryDropdown, 'United States');
      
    // --- Fill Effective Date ---
      await expect(this.effectiveDateInput).toBeVisible();
      await this.effectiveDateInput.fill(effectiveDate);



    await expect(this.addButton).toBeVisible();
    await this.addButton.click();         
  }

  //============================================================================================================

 async selectCountry(country: string) {
  await DropdownUtils.select(this.countryDropdown, country);
}

  
//===========================================================================================================
async fillDate( date: string) {
    await this.effectiveDateInput.fill(date);
}

//============================================================================================================

async clickSave() {
  const saveButton = this.page.locator('button:has-text("Save")');

  await saveButton.waitFor({ state: 'visible', timeout: 60000 });
  await saveButton.click();

  console.log('✅ Save clicked');
}


//============================================================================================================

async deleteEmployee() {
  console.log('--- Deleting employee');

  await expect(this.deleteButton).toBeVisible({ timeout: 30000 });

  await this.deleteButton.click();

  await expect(this.page.getByText('Are you sure?')).toBeVisible({
    timeout: 15000,
  });

  await expect(this.confirmYesButton).toBeVisible({
    timeout: 15000,
  });

  await this.confirmYesButton.click();

  await expect(this.deleteToast).toBeVisible({
    timeout: 15000,
  });

  await expect(this.deleteToast).toContainText(/deleted/i);

  console.log('✅ Employee deleted');
}

//=============================================================================================================

async fillEmployeeDetails(gender: string, ethnicity: string) {
  await this.selectGender(gender);
  await this.selectEthnicity(ethnicity);
}

//==============================================================================================================

async searchAndOpenEmployee(firstName: string) {
  console.log('Searching for:', firstName);

  // ✅ Type into search (VERY IMPORTANT)
  await this.searchInput.fill(firstName);

  // small delay for table filtering
  await this.page.waitForTimeout(2000);

  const rows = this.page.locator('.ReactTable .rt-tbody .rt-tr-group');

  // 🔥 Retry with refresh logic
  await expect(async () => {
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.includes(firstName)) return;
    }

    // 🔥 trigger refresh again
    await this.searchInput.fill('');
    await this.searchInput.fill(firstName);
    await this.page.waitForTimeout(2000);

    throw new Error('Not found yet');
  }).toPass({ timeout: 30000 });

  // ✅ Click employee
  const employeeRow = this.page.locator(
    `.ReactTable .rt-tr-group:has-text("${firstName}")`
  );

  await employeeRow.first().locator('a').click();
  await this.page.waitForTimeout(2000);
}


}