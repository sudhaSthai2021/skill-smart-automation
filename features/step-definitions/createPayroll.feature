@smoke @create_payroll

Feature: Payroll Creation, Signing, Assertion and Deletion

  Scenario: Create payroll as subcontractor and delete as admin

    Given I login as subcontractor
    And I select the project

    When I navigate to Labor Tracking -> Payroll -> Create Payroll
    And I create a payroll
    And I fill payroll details
    And I save payroll

    When I sign payroll
    And I generate A-1-131
    Then I capture payroll week ending

    When I logout
    And I login as admin
    And I select the project
    And I navigate to Labor Tracking -> Payroll -> View All Payrolls

    Then I delete created payroll