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
    this.employeesMenu = page.locator('text=Employees');
    this.employeeMgmtMenu = page.locator('text=Employee Mgmt');
    this.addEmployeeMenu = page.locator('text=Add Employee');
    this.employeesTab = page.locator('text=EMPLOYEES'); // top tab
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
}

   async goToAddEmployee() {
    await this.employeesMenu.click();
    await this.employeeMgmtMenu.click();
    await this.addEmployeeMenu.click();
  }
}