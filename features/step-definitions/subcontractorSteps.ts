import { When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/world';

// ======================================================
// NAVIGATION
// ======================================================

When(
  'I navigate to Subcontractors page',
  async function (this: CustomWorld) {
    await this.nav.navigateToAddSubcontractor();
  }

);


// ======================================================
// CREATE SUBCONTRACTOR
// ======================================================

When(
  'I create a subcontractor',
  async function (this: CustomWorld) {
    this.subcontractorName = `AutoSubcontractor${Date.now()}`;

    await this.subcontractor.createSubcontractor(
      this.subcontractorName
    );
    await this.subcontractor.fillContractDates();
  }
);

When(
  'I fill subcontractor address details',
  async function (this: CustomWorld) {
    await this.subcontractor.fillAddressDetails();
  }
);

When(
  'I fill award details',
  async function (this: CustomWorld) {
    await this.subcontractor.fillAwardDetails();
  }
);

When(
  'I fill subcontractor work info',
  async function (this: CustomWorld) {
    await this.subcontractor.fillWorkInfo();
  }
);

When(
  'I fill subcontractor contact details',
  async function (this: CustomWorld) {
    await this.subcontractor.addContact();
  }
);
When(
  'I navigate to View All Subcontractors page',
  async function (this: CustomWorld) {
    await this.nav.navigateToViewAllSubcontractors();
  }
);
When(
  'I save the subcontractor',
  async function (this: CustomWorld) {
    await this.subcontractor.saveSubcontractor();
  }
);

// ======================================================
// ASSERT CREATION
// ======================================================

Then(
  'I should see subcontractor created successfully',
  async function (this: CustomWorld) {
    await this.subcontractor.assertSubcontractorCreated(
      this.subcontractorName!
    );
  }
);

// ======================================================
// DELETE SUBCONTRACTOR
// ======================================================

When(
  'I delete the subcontractor',
  async function (this: CustomWorld) {
    await this.subcontractor.deleteSubcontractor(
      this.subcontractorName!
    );
  }
);

// ======================================================
// ASSERT DELETE
// ======================================================

Then(
  'subcontractor should be deleted',
  async function (this: CustomWorld) {
    await this.subcontractor.assertSubcontractorDeleted(
      this.subcontractorName!
    );
  }
);