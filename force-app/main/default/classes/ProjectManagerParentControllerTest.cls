@isTest
private class ProjectManagerParentControllerTest {

    // Call the controller method and check if it has values.
    @isTest
    static void testGetProjectManagerAppMessageMDT() {
        Map<String, ProjectManagerAppMessage__mdt> messages = ProjectManagerParentController.getProjectManagerAppMessageMDT();
        
        System.assertNotEquals(null, messages);
        System.assertNotEquals(0, messages.size());
    }

    // Call the controller method to search for the project by ID and check if the record was inserted.
    @isTest
    static void testGetProjectById() {
        Project__c project = new Project__c( Name = 'Test Project' );
        insert project;

        List<Project__c> projects = ProjectManagerParentController.getProjectById(project.Id);

        System.assertEquals(1, projects.size());
        System.assertEquals('Test Project', projects[0].Name);
    }

    // Calls the controller method to delete the record and checks whether the record was deleted.
    @isTest
    static void testDeleteItem() {
        Project__c project = new Project__c( Name = 'To Be Deleted' );
        insert project;

        Boolean deleteResult = ProjectManagerParentController.deleteItem(project.Id);
        System.assertEquals(true, deleteResult);
        
        List<Project__c> projectsAfterDelete = [SELECT Id FROM Project__c WHERE Id = :project.Id];
        System.assertEquals(0, projectsAfterDelete.size());
    }
}