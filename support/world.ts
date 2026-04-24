import { setWorldConstructor } from '@cucumber/cucumber';
import { chromium, Browser, Page } from 'playwright';
import { LoginPage } from '../pages/LoginPage';
import { NavigationPage } from '../pages/NavigationPage';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import {LaborTrackingPage } from '../pages/LaborTrackingPage';
import { ReportsPage } from '../pages/ReportPage';




export class CustomWorld {
  browser!: Browser;
  page!: Page;

  login!: LoginPage;
  nav!: NavigationPage;
  addEmp!: AddEmployeePage;
  laborTracking!:LaborTrackingPage;
  reports!: ReportsPage;
  lastReportName?: string;
  payrollData: any[] = [];

  //FIXED
  reportPath?: string | null;
  project?: string;

  // ✅ ADD THESE
  startDate?: string;
  endDate?: string;


  async init(browser: Browser) {
  this.browser = browser;

  const context = await this.browser.newContext(); // no storageState
  this.page = await context.newPage();

  this.login = new LoginPage(this.page);
  this.nav = new NavigationPage(this.page);
  this.addEmp = new AddEmployeePage(this.page);
  this.laborTracking = new LaborTrackingPage(this.page);
  this.reports = new ReportsPage(this.page);
}  
  async close() {
  await this.page.context().close();
}
}

setWorldConstructor(CustomWorld);