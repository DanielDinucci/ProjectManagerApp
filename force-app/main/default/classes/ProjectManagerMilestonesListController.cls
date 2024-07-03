public with sharing class ProjectManagerMilestonesListController {

    @AuraEnabled
    public static List<Milestone__c> getMilestonesByParentId(String parentId){
        try {
            return [
                SELECT Id, Name, ToDoItemsRelated__c, Completion__c
                FROM Milestone__c 
                WHERE Project__c =: parentId
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // A Boolean value that is set to true if the DML operation was successful for this object, false otherwise.
    @AuraEnabled
    public static Boolean deleteItem(String recordId){
        return Utils.deleteItem(new Milestone__c(Id = recordId))
    }
}