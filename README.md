# README

**Summary:**

Development focused on creating a project manager with aggregated milestones and to-dos for easy handling of records and ease of visibility of the entire architecture of records related to the project.

**Implementation decisions:**

The main focus of the project was the development of the Lightning web component. Therefore, the architecture was defined in a simple but effective way, seeking to avoid unnecessary developments and using the maximum of the functional part for automations. Following the best practices defined by Salesforce.

**Why not use standard objects for this implementation?**

Three custom objects were developed: Project, Milestone, To-do item. If there was a need for a new implementation of a Sales, Services or Marketing flow, the use of standard objects could interrupt this implementation, requiring migration or creation of other objects. Generating unnecessary work and expenses.

**Why not use tasks instead of to-do items?**

In Salesforce, a standard object cannot be the child in a master-detail relationship. This means that you cannot have a standard object, such as a Task, as the child in a master-detail relationship with another object. Additionally, if a Task were used as a lookup relationship, you would not be able to use roll-up summary fields to perform aggregate calculations on the parent object, and you would need to create an automation to display a task-related list in layouts or flexipages.

**Reason to Create Permission Sets:**
Permission sets were created to comply with the new Salesforce model. Permission sets provide the flexibility to assign additional permissions to users without having to modify their profiles. This allows for more granular and specific control over who can access and manipulate certain data and functionality in Salesforce.

**Reason to set up custom metadata:**
Custom metadata types allow you to store custom settings and use them in Apex code, flows, and layouts. You can update or adjust them at any time. Custom metadata has been defined to display all messages displayed in toasts.

**User instructions:**

In order for a project owner to have access to the application and components, it is necessary to include their user in the **Project Managers Owners permission set. After that, simply access the application in the applications section.**

Once you access the application, you will see this screen:


![Untitled](data/README%20Images/Untitled.png)

This is where you can create a project or search for an existing one.

![Untitled](data/README%20Images/Untitled%201.png)

When you create a project your user, you will automatically be the Project Owner, and all that remains is to enter the name of the project.

Once selected, the main panel will display the information for the selected Project with values being updated if there are changes to the records on the screen. The second component will be displayed on the screen with the corresponding related records and the number of To-Do items assigned to them. To view the milestone information, click the “Edit” button or double-click the item to be redirected to the record page :

![Untitled](data/README%20Images/Untitled%202.png)

![Untitled](data/README%20Images/Untitled%203.png)

Continuing with the milestone selection, the third component is displayed with a data table with its values. If you want to access a To-Do item, you can simply click “Edit” to view the information as in the milestone or the link in the name that will redirect to the record screen.

![Untitled](data/README%20Images/Untitled%204.png)

![Untitled](data/README%20Images/Untitled%205.png)

**Technical instructions:**

The defined structure is simple and efficient, making it possible to obtain maximum information from child objects through standard Salesforce automations such as rollup summary fields and formula fields.

![Untitled](data/README%20Images/Untitled%206.png)
We have a master-detail relationship with the Milestone_c object being the detail side of the Project__c object and the To-Do-Item object being the detail side of the Milestone__c object.

The Organization-Wide Defaults of the parent object (Project__c) have been set to “Private”, and because of the master-detail relationship, the child objects (Milestone__c and To-Do Item__c) are controlled by the Parent. Therefore, a Project owner does not have access to other owners’ records. If access is granted to a child record, the user also gets read access to the parent object.

![Untitled](data/README%20Images/Untitled%207.png)

![Untitled](data/README%20Images/Untitled%208.png)

![Untitled](data/README%20Images/Untitled%209.png)

The main screen is separated by three Lightning Web Components ProjectManagerParent, ProjectManagerMilestoneList and ProjectManagerToDoList

![Untitled](data/README%20Images/Untitled%2010.png)

Each of them has a lightning message channel, enabling real-time communication between them.

![Untitled](data/README%20Images/Untitled%2011.png)

So, if the ProjectManagerToDoList component is updated, it communicates with the ProjectManagerMilestoneList and then with the ProjectManagerParent, resulting in dashboards that are reactive to any interaction.

**Improvement points:** 
(due to lack of time, it was not possible to implement in this release)

1. Add pagination or scrollbar in lightning web components that work with massive data load
   
2. A lookup was created in the To-Do Item object to assign the task to the user, from there it is possible to implement a sharing rule or sharing via another automation (examples: Hierarchies, Public Groups, Territory Management, Apex Managed Sharing) in the Project object so that the selected user has visibility of the project and can act on the task assigned to him.
   
3. Define a ProjectManagerApp permission set to limit access for users with less access to fields on associated objects, such as those that might be associated with a task item.

4. In the child lwc components, replace the solution in the creation of records, with "Lightning record form edit" which allows displaying pre-filled fields, in this case to be displayed with the value referring to the parent in the relationship field. 


**Installing Project Manager using a Developer Edition Org or a Trailhead Playground**

1. Clone this repository:
    
    ```
    git clone https://github.com/DanielDinucci/ProjectManagerApp.git
    cd ProjectManagerApp
    
    ```
    
2. Authorize your Trailhead Playground or Developer org and provide it with an alias (**mydevorg** in the command below):
    
    ```
    sf org login web -s -a mydevorg
    
    ```
    
3. Deploy the App with these steps:
    1. Run this command in a terminal to deploy the app.
        
        ```
        sf project deploy -o mydevorg --async
        ```
        Select deploy start:
       
        ![image](https://github.com/DanielDinucci/ProjectManagerApp/assets/69609230/b6d39891-bcd6-4caf-8378-e618b97ed6f8)

        
    3. Assign the Project Manager Owners permission set to the test user.
        
        ```
        sf org assign permset -n ProjectManagerOwners
        
        ```
        
    4. Import some sample data.
        
        ```
        sf data tree import -p ./data/sample-data-plan.json
        
        ```
        
    5. If your org isn't already open, open it now:
        
        ```
        sf org open
        
        ```
        
    6. In **Setup**, under **Themes and Branding**, activate the Project Manager theme.

    7. In App Launcher, select the  Project Manager App.


