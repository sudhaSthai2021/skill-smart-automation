import { Page, Locator } from '@playwright/test';

export class NavigationPage {
  readonly page: Page;

  //readonly laborAdminMenu: Locator;
  //readonly fringeDetails: Locator;
  readonly employeesMenu: Locator;
  readonly employeeMgmtMenu: Locator;
  readonly addEmployeeMenu: Locator;
  readonly employeesTab: Locator;

  constructor(page: Page) {
    this.page = page;

  //  this.laborAdminMenu = page.locator('text=Labor Admin');
 //   this.fringeDetails = page.locator('text=Fringe Details');
    this.employeesMenu = page.getByRole('menuitem', { name: 'Employees' });
    this.employeeMgmtMenu =  page.getByText('Employee Mgmt');
    this.addEmployeeMenu = page.locator('text=Add Employee');
    this.employeesTab = page.getByRole('tab', { name: 'Employees' });
  }

  async navigateToAddEmployee() {
   // await this.laborAdminMenu.click();
   // await this.fringeDetails.click();

    await this.employeesMenu.click();
    await this.employeeMgmtMenu.click();
    await this.addEmployeeMenu.click();
  }

  async goToEmployeesList() {
  await this.employeesMenu.click();
  await this.employeeMgmtMenu.click();
  await this.employeesTab.click();

  // ✅ Wait for correct page
  await this.page.waitForSelector('.ReactTable', { timeout: 20000 });
}

   async goToAddEmployee() {
    await this.employeesMenu.click();
    await this.employeeMgmtMenu.click();
    await this.addEmployeeMenu.click();
  }
}