public with sharing class ProjectManagerParentController {
    
    @AuraEnabled
    public static Map<String, ProjectManagerAppMessage__mdt> getProjectManagerAppMessageMDT(){
        try {
            return ProjectManagerAppMessage__mdt.getAll();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Project__c> getProjectById(String recordId){
        try {
            return [
                SELECT Id, Name, Completion__c, CreatedDate, Status__c
                FROM Project__c
                WHERE Id =: recordId
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // A Boolean value that is set to true if the DML operation was successful for this object, false otherwise.
    @AuraEnabled
    public static Boolean deleteItem(String recordId){
        Database.DeleteResult dr = Database.delete(new Project__c(Id = recordId));
        return dr.isSuccess();
    }
}