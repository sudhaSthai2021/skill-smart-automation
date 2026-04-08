import { Page, Locator } from '@playwright/test';

export class NavigationPage {
  readonly page: Page;

  //readonly laborAdminMenu: Locator;
  //readonly fringeDetails: Locator;
  readonly employeesMenu: Locator;
  readonly employeeMgmtMenu: Locator;
  readonly addEmployeeMenu: Locator;
  readonly employeesTab: Locator;
  readonly profileIcon: Locator;
  readonly logoutButton: Locator;


  constructor(page: Page) {
    this.page = page;

  //  this.laborAdminMenu = page.locator('text=Labor Admin');
 //   this.fringeDetails = page.locator('text=Fringe Details');
    this.employeesMenu = page.getByRole('menuitem', { name: 'Employees' });
    this.employeeMgmtMenu =  page.getByText('Employee Mgmt');
    this.addEmployeeMenu = page.locator('text=Add Employee');
    this.employeesTab = page.getByRole('tab', { name: 'Employees' });
    this.profileIcon=page.getByRole('img', { name: /profile|user/i });
    this.logoutButton=page.getByText('Logout');
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
async logout() {
  console.log('--- Logging out...');

  // ✅ Try multiple possible profile locators
  const possibleProfileSelectors = [
    '[aria-label="account"]',
    '[aria-haspopup="menu"]',
    '.MuiAvatar-root',
    'header button',
    'header svg'
  ];

  let clicked = false;

  for (const selector of possibleProfileSelectors) {
    const el = this.page.locator(selector).last();
    if (await el.count() > 0) {
      try {
        await el.click({ timeout: 3000 });
        clicked = true;
        console.log(`--- Clicked profile using: ${selector}`);
        break;
      } catch (e) {}
    }
  }

  if (!clicked) {
    throw new Error('❌ Could not find profile icon for logout');
  }

  // ✅ Now click logout
  const logoutBtn = this.page.locator('text=Logout');
  await logoutBtn.waitFor({ state: 'visible', timeout: 10000 });
  await logoutBtn.click();

  // ✅ Wait for login page
  await this.page.waitForURL(/login/, { timeout: 20000 });

  console.log('--- Logout successful');
}
async navigateToReporting() {
  console.log('--- Navigating to Reporting -> Reports and Downloads -> Generate/View Reports...');

  // ✅ Step 1: Click Reporting
  await this.page.getByText('Reporting', { exact: true }).click();
  console.log('--- Clicked Reporting');

  // ✅ Step 2: Ensure "Reports and Downloads" is visible
  const reportsNode = this.page.getByText('Reports and Downloads', { exact: true });
  await reportsNode.waitFor({ state: 'visible', timeout: 20000 });

  // 🔥 Step 3: Expand ONLY if child is not visible
  const child = this.page.getByText('Generate/View Reports', { exact: true });

  if (!(await child.isVisible().catch(() => false))) {
    console.log('--- Expanding Reports and Downloads...');
    await reportsNode.click();
    await this.page.waitForTimeout(1000); // allow animation
  }

  // ✅ Step 4: Now click child
  await child.waitFor({ state: 'visible', timeout: 20000 });
  await child.click();

  console.log('--- Clicked Generate/View Reports');

  // ✅ Step 5: Wait for page load
  await this.page.waitForSelector('text=Select One', { timeout: 30000 });

  console.log('--- Reporting page loaded successfully');
}

// ======================================================
// PROJECT SELECTION (GLOBAL NAVIGATION)
// ======================================================
async selectProject(projectName: string) {
  console.log('--- Selecting project:', projectName);

  // Wait for project selection page
  await this.page.waitForURL('**/project/select', { timeout: 30000 });

  // Step 1: Find project title
  const projectTitle = this.page.locator('p', { hasText: projectName }).first();

  await projectTitle.waitFor({ state: 'visible', timeout: 20000 });

  console.log('--- Project title found');

  // Step 2: Locate correct parent card
  const projectCard = projectTitle.locator(
    'xpath=ancestor::div[.//button[.//span[text()="Select"]]][1]'
  );

  // Step 3: Scroll safely
  await projectCard.scrollIntoViewIfNeeded();

  console.log('--- Scrolled to project card');

  // Step 4: Click Select
  await projectCard.locator('button:has-text("Select")').click();

  // Step 5: Wait for dashboard
  await this.page.waitForURL(/dashboard/, { timeout: 30000 });

  console.log('--- Project selected successfully');
}
}