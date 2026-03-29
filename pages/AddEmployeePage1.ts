import { Page, Locator, expect } from '@playwright/test';

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
  readonly addNewButton: Locator;
  readonly street1Input: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
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
    this.addNewButton = page.locator('p:has-text("Add New")');
    this.deleteButton =  this.page.getByRole('button', { name: 'Delete Employee' });
    this.confirmDeleteButton = page.getByRole('button', { name: /confirm|yes/i });
    this.confirmDialog= page.getByRole('dialog');
    this.confirmYesButton = page.getByRole('button', { name: 'YES' });
    this.searchInput = this.page.locator('.ReactTable .rt-thead.-filters input').first();
    this.employeesTab =this.page.getByRole('link', { name: 'Employees', exact: true });


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
    const firstName = 'Sudha' + Date.now(); // 🔥 unique
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

  //=============================================================================================================

  async selectGender(value: string) {
    await this.genderDropdown.click();

    const listbox = this.page.getByRole('listbox');
    await expect(listbox).toBeVisible(); // better than waitFor()

    await listbox.getByRole('option', { name: value,exact: true }).click();
    await this.page.pause();
}

//================================================================================================================

  async selectEthnicity(value: string) {
    await this.ethnicityDropdown.click();
    await this.page.getByRole('listbox').waitFor();
    await this.page.getByRole('option', { name: value }).click();
    await this.page.pause();
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

    // --- 1️⃣ Go to Address History Tab ---
    //await expect(this.addressHistoryTab).toBeVisible({ timeout: 10000 });
   // await this.addressHistoryTab.click();

    // --- 2️⃣ Click "Add New" to open address form ---
//await expect(this.addNewButton).toBeVisible({ timeout: 10000 });
   // await this.addNewButton.click();

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
      await countryDropdown.click();

      const countryOption = this.page.locator('li[role="option"]:has-text("United States")');
      await expect(countryOption).toBeVisible({ timeout: 5000 });
      await countryOption.click();

    // --- Fill Effective Date ---
      await expect(this.effectiveDateInput).toBeVisible();
      await this.effectiveDateInput.fill(effectiveDate);



    await expect(this.addButton).toBeVisible();
    await this.addButton.click();         
  }

  //============================================================================================================
async selectCountryDropdown(country: string) {
  const dropdown = this.page.getByLabel('Country');

  await dropdown.scrollIntoViewIfNeeded();
  await dropdown.click();

  const option = this.page.getByRole('option', { name: country });
  await option.click();

  await this.page.keyboard.press('Tab'); // 🔥 VERY IMPORTANT
}

/*async selectCountryDropdown(country: string) {
  // ✅ Find by label instead of ID
  const dropdown = this.page.getByLabel('Country');

  await dropdown.scrollIntoViewIfNeeded();
  await dropdown.waitFor({ state: 'visible' });

  await dropdown.click();

  // ✅ Select option
  const option = this.page.getByRole('option', { name: country });
  await option.waitFor({ state: 'visible' });

  await option.click();
  await this.page.keyboard.press('Tab'); // 🔥 critical
}*/


//===========================================================================================================
async fillDate( date: string) {
    await this.effectiveDateInput.fill(date);
}

//============================================================================================================
async clickSave() {
     
    await this.page.locator('body').click();
    // Force click if any overlay exists
    await this.saveButton.click({ force: true });
   // await this.page.waitForTimeout(2000);
   // ✅ Wait for API + navigation
  await this.page.waitForLoadState('networkidle');

  // ✅ Wait for URL to change (IMPORTANT)
  //await expect(this.page).toHaveURL(/000000/);

    await expect(this.successToast).toBeVisible({ timeout: 10000 });
    const message = await this.successToast.textContent();
   console.log('Toast message:', message);

  // Optional flexible assertion
  await expect(this.successToast).toContainText(/saved|success/i);
 
}

//============================================================================================================

async deleteEmployee() {
  await expect(this.deleteButton).toBeVisible({ timeout: 10000 });
  await this.deleteButton.click();  

  // Optional: verify title
  await expect(this.page.getByText('Are you sure?')).toBeVisible();

  // ✅ Click YES
  await expect(this.confirmYesButton).toBeVisible();
  await this.confirmYesButton.click();

  // Verify deletion toast
  const toast = this.page.locator('.MuiAlert-message');
  await expect(toast).toBeVisible({ timeout: 10000 });

  const msg = await toast.textContent();
  console.log('Delete Toast:', msg);

  await expect(toast).toContainText(/deleted/i);
}




//=========================================================================================================

async searchAndOpenEmployee(firstName: string) {
// ✅ Ensure we are on Employees page
  await expect(this.page).toHaveURL(/employees/, { timeout: 15000 });

  // 🔥 CRITICAL STEP (you were missing this)
  await this.employeesTab.click();

   // ✅ Wait for table to load
  await this.page.waitForSelector('.ReactTable', { timeout: 15000 });

   // ✅ Better locator (fix this also)
  const searchInput = this.page
    .locator('.ReactTable .rt-thead.-filters input')
    .first();


  // ✅ Wait for search input
  await expect(this.searchInput).toBeVisible();

  // ✅ Perform search
  await this.searchInput.fill(firstName);
  await this.page.keyboard.press('Enter');

  // ✅ Locate row using ReactTable structure
  const employeeRow = this.page.locator('.ReactTable .rt-tbody .rt-tr-group', {
    hasText: firstName
  });

  await expect(employeeRow).toBeVisible({ timeout: 15000 });

  // ✅ Click the link inside that row
  await employeeRow.locator('a').click();
}

//==============================================================================================================

}