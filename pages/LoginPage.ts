import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#email_adress');
    this.passwordInput = page.locator('input[name="password"]'); // update locator
    this.loginButton = page.getByRole('button', { name: 'Login' })
  }

  async goto() {
    await this.page.goto('https://mar2026.skillsmart.us/#/landing/login' , {waitUntil: 'load',   // or 'domcontentloaded'
    timeout: 60000       // ✅ increase timeout
  });
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
  
}