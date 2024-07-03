import { LightningElement, wire } from 'lwc';
import {subscribe, publish, MessageContext} from 'lightning/messageService';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { refreshApex } from "@salesforce/apex";
import LightningConfirm from "lightning/confirm";
import RecordFormModal from 'c/recordFormModal';
import To_Do_Channel from '@salesforce/messageChannel/toDoChannel__c';
import Milestone_Channel from '@salesforce/messageChannel/milestoneChannel__c';
import getToDoItemsByParentId from '@salesforce/apex/ProjectManagerToDoListController.getToDoItemsByParentId';
import deleteItem from '@salesforce/apex/ProjectManagerToDoListController.deleteItem';

const COLS = [
    {label: 'Name', fieldName: 'link', type: 'url', typeAttributes: {label: {fieldName: 'name'}}},
    {label: 'Status', fieldName: 'status'},
    {label: 'Start date', fieldName: 'startDate', type: 'date'},
    {label: 'End date', fieldName: 'endDate', type: 'date'},
    {label: 'Assigned to', fieldName: 'assignedTo'},
]

export default class ProjectManagerToDoList extends LightningElement {

    cols = COLS;
    baseURL;
    parentId;
    toastsMsgs;
    showToDoItems;
    ToDoItemList;
    selectedRow;

    // The connectedCallBack initiates the subscription to the messaging channel to receive new information in real time.
    // In this case, triggering refreshApex to update the information in the panel.
    connectedCallback() {
        this.baseURL = window.location.origin + '/';
        subscribe(this.messageContext, To_Do_Channel, (payload) => {
            if(payload.recordId != null){
                this.parentId = payload.recordId;
                this.toastsMsgs = payload.toastsMsgs
                refreshApex(this.dataWired);
            }else{
                this.parentId = null;
                this.showToDoItems = false;
            }
        })
    }

    @wire(MessageContext)
    messageContext;

    // @Wire promotes the most responsive connection to the backend by updating data when necessary.
    @wire(getToDoItemsByParentId, { parentId: '$parentId' })
    toDoItems(value){
        this.dataWired = value;
        const {data} = value
        if(data){
            this.setDataTableValues(data);
        }
    }

    // Goes through the list assembling the values ​​that will be used in datatale.
    setDataTableValues(data){
        this.ToDoItemList = [];
        for (var i in data) {
            this.ToDoItemList.push({
                link       : this.baseURL + data[i].Id,
                id         : data[i].Id,
                name       : data[i].Name,
                status     : data[i].Status__c,
                assignedTo : data[i]?.AssignedTo__r?.Name,
                startDate  : data[i].StartDate__c,
                endDate    : data[i].EndDate__c
            });
        }
        this.showToDoItems = true;
    }

    // Opens the Lightning record form in edit mode within a record creation modal.
    handleCreate() {
        RecordFormModal.open({
            objectName : 'ToDoItem__c',
            headerlabel: 'Create To-Do',
            label: 'Create To-Do',
            mode: 'edit'
        }).then((result, error) => {
            if(result != null){
                this.publishChannel(true);
                refreshApex(this.dataWired);
                let toast = this.toastsMsgs.RecordCreated;
                this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                this.showToDoItems = true;
            }else if(error){
                let toast = this.toastsMsgs.CreationFailed;
                this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
            }
        })
    }

    // Opens the Lightning record form in view mode within a modal to view and edit the record.
    handleEdit() {
        if(this.selectedRow != null){
            RecordFormModal.open({
                objectName : 'ToDoItem__c',
                headerlabel: 'Create To-Do',
                label: 'Edit To-Do',
                mode: 'view',
                recordid: this.selectedRow[0].id
            }).then((result, error) => {
                if(result != null){
                    this.publishChannel(true);
                    refreshApex(this.dataWired);
                    let toast = this.toastsMsgs.RecordEdited;
                    this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                }else if(error){
                    let toast = this.toastsMsgs.EditionFailed;
                    this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                }
            })
        }else{
            let toast = this.toastsMsgs.SelectARecord;
            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
        }
    }
    
    // Opens the confirmation modal to continue with the record deletion.
    handleDeleteItem() {
        if(this.selectedRow != null){
            LightningConfirm.open({
                variant: 'header',
                theme: "error",
                label: 'Delete To-Do Item?',
            }).then((result) => {
                if(result == true){
                    deleteItem({ recordId : this.selectedRow[0].id }).then((result) => {
                        if(result == true){
                            this.clearRowSelection();
                            let toast = this.toastsMsgs.RecordDeleted;
                            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                        }else{
                            let toast = this.toastsMsgs.DeletionFaild;
                            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                        }
                        this.publishChannel(true);
                        refreshApex(this.dataWired);
                    })
                }
            });
        }else{
            let toast = this.toastsMsgs.SelectARecord;
            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
        }
    }

    // Method that only allows the selection of one item from the datatable at a time
    handleRowSelection(event){
        this.selectedRow = []
        this.selectedRow.push(event.detail.selectedRows[0]);
        var selectedRows = event.detail.selectedRows;
        if (selectedRows.length > 1) {
            var el = this.template.querySelector('lightning-datatable');
            selectedRows = el.selectedRows = el.selectedRows.slice(1);
            event.preventDefault();
            return;
        }
    }

    // Method that clears the selection of the data table
    clearRowSelection() {
        this.selectedRow = [];
        this.template.querySelector('lightning-datatable').selectedRows.slice(1);
    }

    showToast(title, msg, variant , mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant,
            mode: mode ?? 'dismissible'
        });
        this.dispatchEvent(evt);
    }

    // Publishes the payload in message channel
    publishChannel(reloadParent){
        const payload = { reload: reloadParent };
        publish(this.messageContext, Milestone_Channel, payload);
    }
}