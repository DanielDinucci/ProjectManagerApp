@isTest
private class ProjectManagerMilestonesControllerTest {

    // Test setup is a good practice in test classes, to reuse the generated test content.
    @TestSetup
    static void makeData(){
        Project__c project = new Project__c( Name = 'Test Project' );
        insert project;

        Milestone__c milestone = new Milestone__c( 
            Name = 'Test Milestone',
            Project__c = project.id,
            StartDate__c = Date.today(),
            EndDate__c = Date.today().addDays(7)
        );
        insert milestone;
    }

    // Tests the return of records related to the passed id.
    @isTest
    static void testGetMilestonesByParentId() {
        
        Milestone__c milestone = [SELECT Id, Project__c FROM Milestone__c WHERE Name =  'Test Milestone'];

        List<Milestone__c> milestones = ProjectManagerMilestonesListController.getMilestonesByParentId(milestone.Project__c);

        System.assertEquals(1, milestones.size());
        System.assertEquals('Test Milestone', milestones[0].Name);
    }

    // Calls the controller method to delete the record and checks whether the record was deleted.
    @isTest
    static void testDeleteItem() {
        
        Milestone__c milestone = [SELECT Id FROM Milestone__c WHERE Name =  'Test Milestone'];

        Boolean deleteResult = ProjectManagerMilestonesListController.deleteItem(milestone.Id);

        System.assertEquals(true, deleteResult);

        List<Milestone__c> milestonesAfterDelete = [SELECT Id FROM Milestone__c WHERE Id = :milestone.Id];
        System.assertEquals(0, milestonesAfterDelete.size());
    }
}
