@isTest
private class ProjectManagerToDoListControllerTest {

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

    // Call the controller method to search for the parent milestone by ID and check if the record was inserted.
    @isTest
    static void testGetToDoItemsByParentId() {
        Milestone__c milestone = [SELECT Id FROM Milestone__c WHERE Name =  'Test Milestone'];

        ToDoItem__c todoItem = new ToDoItem__c(
            Name = 'Test ToDo',
            Status__c = 'In Progress',
            AssignedTo__c = UserInfo.getUserId(),
            StartDate__c = Date.today(),
            EndDate__c = Date.today().addDays(7),
            Milestone__c = milestone.Id
        );
        insert todoItem;

        List<ToDoItem__c> todoItems = ProjectManagerToDoListController.getToDoItemsByParentId(milestone.Id);

        System.assertEquals(1, todoItems.size());
        System.assertEquals('Test ToDo', todoItems[0].Name);
    }

     // Calls the controller method to delete the record and checks whether the record was deleted.
    @isTest
    static void testDeleteItem() {
        Milestone__c milestone = [SELECT Id FROM Milestone__c WHERE Name =  'Test Milestone'];
    
        ToDoItem__c todoItem = new ToDoItem__c(
            Name = 'To Be Deleted',
            Status__c = 'In Progress',
            StartDate__c = Date.today(),
            EndDate__c = Date.today().addDays(7),
            Milestone__c = milestone.Id
        );
        insert todoItem;

        Boolean deleteResult = ProjectManagerToDoListController.deleteItem(todoItem.Id);

        System.assertEquals(true, deleteResult);

        List<ToDoItem__c> todoItemsAfterDelete = [SELECT Id FROM ToDoItem__c WHERE Id = :todoItem.Id];
        System.assertEquals(0, todoItemsAfterDelete.size());
    }
}