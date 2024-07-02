public with sharing class ProjectManagerToDoListController {

    @AuraEnabled
    public static List<ToDoItem__c> getToDoItemsByParentId( String parentId){
        try {
            return [
                SELECT Id, Name, Status__c, AssignedTo__r.Name, StartDate__c, EndDate__c
                FROM ToDoItem__c
                WHERE Milestone__c =: parentId
            ];
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // A Boolean value that is set to true if the DML operation was successful for this object, false otherwise.
    @AuraEnabled
    public static Boolean deleteItem(String recordId){
        Database.DeleteResult dr = Database.delete(new ToDoItem__c(Id = recordId));
        return dr.isSuccess();
    }
}