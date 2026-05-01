@smoke @1099

Feature: Add 1099 Worker Flow

  Scenario: Add, search and delete 1099 worker
    Given I login as subcontractor for 1099
    And I select project

    When I navigate to Add 1099 Worker page
    And I create 1099 worker
    And I save the worker

    Then I should find the worker in list

    When I logout
    And I login as admin
    And I navigate to the "DEFAULT_PROJECT"
    When I navigate to View All 1099 Workers
    #And I delete the 1099 worker