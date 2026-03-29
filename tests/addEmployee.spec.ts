import { test, expect } from '@playwright/test';


import { LoginPage } from '../pages/LoginPage';
import { NavigationPage } from '../pages/NavigationPage1';
import { AddEmployeePage } from '../pages/AddEmployeePage1';

test('Add Employee Flow', async ({ page }) => {

  const login = new LoginPage(page);
  const nav = new NavigationPage(page);
  const addEmp = new AddEmployeePage(page);

  // Step 1: Login
  await login.goto();
  await login.login('360today@gmail.com', 'password');

  const selectButton = page.getByRole('button', { name: 'Select' }).first();
 // await selectButton.waitFor({ state: 'visible', timeout: 10000 }); // wait up to 10 seconds
  await selectButton.click();

 
  // Wait for navigation
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Visuals')).toBeVisible();

  /// Step 3: Directly go to Add Employee page
await page.goto('https://mar2026.skillsmart.us/#/insight/employees/editor/employee/000000000000000000000000');

  // Verify Navigation
 await expect(page).toHaveURL(/employee\/000000/);
 
 //await page.pause();

 // Fill Employee Detail
const { firstName } = await addEmp.fillBasicDetails();

// Select dropdowns
await addEmp.selectGender('Male');
await addEmp.selectEthnicity('Asian');
await addEmp.goToAddressHistory();
await expect(page).toHaveURL(/address/);
await expect(page.getByText('Add New')).toBeVisible();
await addEmp.clickAddNew();  
await addEmp.fillAddress('19th Street', 'Chicago', 'IL', '60611', '03/02/2021');
await page.pause();

// Click Save
await addEmp.clickSave();


console.log('Saved');

await page.reload();

await addEmp.clickEmployeesTab();

await page.pause();


// Click the employee link to open details
await addEmp.searchAndOpenEmployee(firstName);

await page.pause();
// ✅ DELETE
  await addEmp.deleteEmployee();
  
await page.pause();
});


