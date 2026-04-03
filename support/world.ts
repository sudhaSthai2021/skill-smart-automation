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
  payrollData: any[] = [];
  reportPath!: string;


  async init() {
    this.browser = await chromium.launch({ headless: false });
    const context = await this.browser.newContext();
    this.page = await context.newPage();

     // ✅ create objects here
  this.login = new LoginPage(this.page);
  this.nav = new NavigationPage(this.page);
  this.addEmp = new AddEmployeePage(this.page);
  this.laborTracking = new LaborTrackingPage(this.page);
  this.reports= new ReportsPage(this.page);

  }

  
  async close() {
    await this.browser.close();
  }
}

setWorldConstructor(CustomWorld);