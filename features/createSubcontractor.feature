@create_subcontractor
Feature: Create, Assert, Delete Subcontractor flow

  Scenario: Create subcontractor and delete subcontractor

    Given I login as admin
    And I select the project

    When I navigate to Subcontractors page

    And I create a subcontractor
    And I save the subcontractor

    And I fill subcontractor address details
    And I save the subcontractor

    And I fill award details
    And I save the subcontractor

    And I fill subcontractor work info
    And I save the subcontractor

    And I fill subcontractor contact details

    
    When I navigate to View All Subcontractors page

    Then I should see subcontractor created successfully

    When I delete the subcontractor
    
    Then subcontractor should be deleted