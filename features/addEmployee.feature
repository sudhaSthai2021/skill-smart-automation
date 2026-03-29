
@smoke @employee

Feature: Add Employee Flow
  
  @add_search_delete
  Scenario: Add, search and delete employee
    Given I login to the application
    And I navigate to Add Employee page
    When I create a new employee
    And I fill employee details
    And I add address details
    And I save the employee
    Then I should be able to search the employee
    And I delete the employee