public with sharing class Utils {

    // A Boolean value that is set to true if the DML operation was successful for this object, false otherwise.
    public static Boolean deleteItem(SObject obj) {
        Database.DeleteResult dr = Database.delete(obj);
        return dr.isSuccess();
    }
}