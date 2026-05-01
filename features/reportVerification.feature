Feature: Report Verification across User Roles

  Background:
    Given I navigate to the application login page

  @report
  Scenario: Verify Subcontractor Payroll data matches Admin Reports

    # Subcontractor Role
    When I login as user "metadata@gmaiil.com" with password "Govind@2003"
    And I navigate to the "DEFAULT_PROJECT"
    And I go to Labor Tracking -> Payroll -> View All Payrolls
    And I extract payroll standard data for the current period
    Then I log out of the application

    # Admin Role
    When I login as user "nikhil.k@sthai.co.in" with password "Password"
    And I navigate to the "DEFAULT_PROJECT"
    And I go to Reporting -> Reports and Downloads -> Generate/View Reports


    # 🔥 Dynamic Step (NO HARDCODING)
    When I generate all available reports

    Then the report should match payroll data

    