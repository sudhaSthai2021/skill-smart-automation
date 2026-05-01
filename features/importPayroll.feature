@import_payroll
Feature: Import Payroll

Scenario: Create Excel layout and import payroll successfully

  Given I login as subcontractor
  And I select the project

  When I navigate to Labor Tracking -> Payroll -> Import Payroll

  And I create a new payroll layout with name "AutoLayout1234"
  And I configure column mapping from A to U
  And I save the layout

  And I select the layout "AutoLayout1234"
  And I download the template

  And I upload the payroll file "payroll.xlsx"
  And I test import

  Then I should not see any validation errors
  And I import the payroll

  And I navigate to Labor Tracking -> Payroll -> View All Payrolls
  And I select the latest payroll report period

  Then I should see the imported payroll in the list
  And I extract organization and payroll period for the imported payroll

  Then I logout
And I login as admin
And I select the project 

When I navigate to Labor Tracking -> Payroll -> View All Payrolls
Then I delete the payroll using extracted data