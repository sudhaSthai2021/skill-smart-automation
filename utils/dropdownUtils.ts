import { Page, Locator } from '@playwright/test';


export class DropdownUtils {

  static async selectByIndex(locator: Locator, index: number): Promise<void> {
    const options = await locator.locator('option').all();
    if (index >= options.length) {
      throw new Error(`Index ${index} out of range`);
    }
    await options[index].click();
  }

  // Generic method (recommended)
  static async select(
  locator: Locator,
  value: string | number,
  type: 'text' | 'value' | 'index' = 'text'
): Promise<void> {

  // 🔹 Native dropdown
  if (await locator.locator('option').count() > 0) {
    switch (type) {
      case 'value':
        await locator.selectOption({ value: String(value) });
        return;

      case 'index':
        await locator.selectOption({ index: Number(value) });
        return;

      default:
        await locator.selectOption({ label: String(value) });
        return;
    }
  }

  // 🔹 MUI / Custom dropdown
  await locator.click();

  // ✅ Always pick the latest visible listbox (avoids duplicates)
  const listbox = locator.page().locator('ul[role="listbox"]').last();

  await listbox.waitFor({ state: 'visible' });

  await listbox
    .getByRole('option', { name: String(value), exact: true })
    .click();
}
}