import { setWorldConstructor } from '@cucumber/cucumber';
import { Browser, Page, BrowserContext } from 'playwright';

import { LoginPage } from '../pages/LoginPage';
import { NavigationPage } from '../pages/NavigationPage';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import { LaborTrackingPage } from '../pages/LaborTrackingPage';
import { ReportsPage } from '../pages/ReportPage';
import { ImportPayrollPage } from '../pages/ImportPayrollPage';
import { Add1099WorkerPage } from '../pages/Add1099WorkerPage';
import { CreatePayrollPage } from '../pages/CreatePayrollPage';
import { SubcontractorPage } from '../pages/SubcontractorPage';






export class CustomWorld {
  browser!: Browser;
  context!: BrowserContext; // ✅ ADD THIS
  page!: Page;

  login!: LoginPage;
  nav!: NavigationPage;
  addEmp!: AddEmployeePage;
  laborTracking!: LaborTrackingPage;
  reports!: ReportsPage;
  importPayroll!: ImportPayrollPage;
  add1099!: Add1099WorkerPage;
  createPayroll!: CreatePayrollPage;
  subcontractor!: SubcontractorPage;
;

  lastReportName?: string;
  payrollData: any[] = [];

  reportPath?: string | null;
  project?: string;

  startDate?: string;
  endDate?: string;
  organization?: string;
  
  createdPayroll?: {
  organization: string;
  startDate: string;
  endDate: string;
};

  workerName!: string;
  workerFullName!: string;
  workerFirstName!:string;
  workerLastName!:string;
  subcontractorName?: string
  

  async init(browser: Browser) {
    this.browser = browser;

    // ✅ Store context properly
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    this.page = await this.context.newPage();

    // ✅ Small stabilization (important for flaky apps)
    await this.page.waitForTimeout(500);

    // ✅ Initialize pages
    this.login = new LoginPage(this.page);
    this.nav = new NavigationPage(this.page);
    this.addEmp = new AddEmployeePage(this.page);
    this.laborTracking = new LaborTrackingPage(this.page);
    this.reports = new ReportsPage(this.page);
    this.importPayroll = new ImportPayrollPage(this.page);
    this.add1099 = new Add1099WorkerPage(this.page);
    this.createPayroll = new CreatePayrollPage(this.page);
    this.subcontractor = new SubcontractorPage(this.page);
  }
}

setWorldConstructor(CustomWorld);

/*






import { setWorldConstructor } from '@cucumber/cucumber';
import { chromium, Browser, Page } from 'playwright';
import { LoginPage } from '../pages/LoginPage';
import { NavigationPage } from '../pages/NavigationPage';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import {LaborTrackingPage } from '../pages/LaborTrackingPage';
import { ReportsPage } from '../pages/ReportPage';
import { ImportPayrollPage } from '../pages/ImportPayrollPage';




export class CustomWorld {
  browser!: Browser;
  page!: Page;

  login!: LoginPage;
  nav!: NavigationPage;
  addEmp!: AddEmployeePage;
  laborTracking!:LaborTrackingPage;
  reports!: ReportsPage;
  importPayroll!:ImportPayrollPage;
  lastReportName?: string;
  payrollData: any[] = [];

  //FIXED
  reportPath?: string | null;
  project?: string;

  // ✅ ADD THESE
  startDate?: string;
  endDate?: string;
  organization?: string;


  async init(browser: Browser) {
  this.browser = browser;

  const context = await this.browser.newContext(); // no storageState
  this.page = await context.newPage();

  this.login = new LoginPage(this.page);
  this.nav = new NavigationPage(this.page);
  this.addEmp = new AddEmployeePage(this.page);
  this.laborTracking = new LaborTrackingPage(this.page);
  this.reports = new ReportsPage(this.page);
  this.importPayroll=new ImportPayrollPage(this.page);
}  
  
}

setWorldConstructor(CustomWorld);

*/