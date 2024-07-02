import { LightningElement, wire } from 'lwc';
import {subscribe, publish, MessageContext} from 'lightning/messageService';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
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
    parentId;
    toastsMsgs;
    baseURL
    showToDoItems;
    ToDoItemList;
    selectedRow;
    
    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        subscribe(this.messageContext, To_Do_Channel, (payload) => {
            this.baseURL = payload.baseURL;
            if(payload.recordId != null){
                this.parentId = payload.recordId;
                this.toastsMsgs = payload.toastsMsgs
                this.getRecords();
            }else{
                this.parentId = null;
                this.showToDoItems = false;
            }
        })
    }

    getRecords(){
        getToDoItemsByParentId({parentId: this.parentId})
        .then((data)=>{
            this.setDataTableValues(data);
        }).catch((error)=>{
            let toast = this.toastsMsgs.GenericError;
            this.showToast(toast.MasterLabel, toast.Message__c + ' - ' + error, toast.Type__c, toast.Mode__c);
        })
        
    }

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

    handleCreate() {
        RecordFormModal.open({
            objectName : 'ToDoItem__c',
            headerlabel: 'Create To-Do',
            label: 'Create To-Do',
            mode: 'edit'
        }).then((result) => {
            console.log(result)
            if(result != null){
                this.publishChannel(true);
                this.getRecords()
                let toast = this.toastsMsgs.SuccessfulCreation;
                this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                this.showToDoItems = true;
            }
        })
    }

    handleEdit() {
        if(this.selectedRow != null){
            RecordFormModal.open({
                objectName : 'ToDoItem__c',
                headerlabel: 'Create To-Do',
                label: 'Edit To-Do',
                mode: 'view',
                recordid: this.selectedRow[0].id
            }).then((result) => {
                if(result != null){
                    this.publishChannel(true);
                    this.getRecords();
                    let toast = this.toastsMsgs.SuccessfulCreation;
                    this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                }
            })
        }else{
            this.showToast('Select a record', 'Select a To-Do item','warning' );
        }
    }
    
    handleDeleteItem() {
        console.log('Selected Row >>> ' + JSON.stringify(this.selectedRow))
        if(this.selectedRow != null){
            LightningConfirm.open({
                variant: 'header',
                theme: "error",
                label: 'Delete To-Do Item?',
            }).then((result) => {
                if(result == true){
                    deleteItem({ recordId : this.selectedRow[0].id }).then((result) => {
                        if(result == true){
                            this.selectedRow = null;
                            this.showToast('Success', 'To-Do Item deleted','success' );
                        }else{
                            let toast = this.toastsMsgs.GenericError;
                            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                        }
                        this.publishChannel(true);
                        this.getRecords();
                    })
                }
            });
        }
    }

    handleRowAction(event){
        console.log(event.detail);
    }

    handleRowSelection = event => {
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

    publishChannel(reloadParent){
        const payload = { reload: reloadParent };
        publish(this.messageContext, Milestone_Channel, payload);
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
}