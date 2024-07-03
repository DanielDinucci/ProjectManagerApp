import { LightningElement, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { subscribe, publish, MessageContext } from "lightning/messageService";
import { refreshApex } from "@salesforce/apex";
import RecordFormModal from 'c/recordFormModal';
import LightningConfirm from "lightning/confirm";
import Milestone_Channel from '@salesforce/messageChannel/milestoneChannel__c';
import Project_Channel from '@salesforce/messageChannel/parentProjectChannel__c';
import getProjectManagerAppMessageMDT from  '@salesforce/apex/ProjectManagerParentController.getProjectManagerAppMessageMDT';
import deleteItem from  '@salesforce/apex/ProjectManagerParentController.deleteItem';
import NAME_FIELD from '@salesforce/schema/Project__c.Name';
import STATUS_FIELD from '@salesforce/schema/Project__c.Status__c';
import COMPLETION_FIELD from '@salesforce/schema/Project__c.Completion__c';
import CREATEDDATE_FIELD from '@salesforce/schema/Project__c.CreatedDate';

const FIELDS = [NAME_FIELD, STATUS_FIELD, COMPLETION_FIELD, CREATEDDATE_FIELD];

export default class ProjectManagerParent extends LightningElement {

    showProject;
    toastsMsgs;
    projectSelectedRec;
    projectName = '';
    projectStatus = '';
    projectCompletion = 0;
    createdDate;
    dataWired;
    spinner = true;
    
    // The connectedCallBack initiates the subscription to the messaging channel to receive new information in real time.
    // In this case, triggering refreshApex to update the information in the panel.
    connectedCallback(){
        subscribe(this.messageContext, Project_Channel, (payload) => {
            if(payload.reload == true){
               refreshApex(this.dataWired);
            }
        })
        getProjectManagerAppMessageMDT().then((data)=>{
            this.toastsMsgs = data;
        });
        this.spinner = false;
    }

    @wire(MessageContext)
    messageContext;

    // @Wire promotes the most responsive connection to the backend by updating data when necessary.
    @wire(getRecord, {recordId: '$projectSelectedRec', fields: FIELDS})
    project( value ){
        this.dataWired = value;
        const { data } = value
        if(data){
            this.projectName = data.fields.Name.value;
            this.projectStatus = data.fields.Status__c.value;
            this.projectCompletion = data.fields.Completion__c.value;
            this.createdDate = this.convertDateTimeToUsDate(data.fields.CreatedDate.value);
        }
    }

    // Convert Datetime to en-US date format.
    convertDateTimeToUsDate(isoString) {
        const date = new Date(isoString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const result = date.toLocaleDateString('en-US', options);
        return result;
    }
    
    // Receives the event with the record ID, sends it on the message channel to the child lwc
    // and stores the information in the variable that triggers the wire.
    handleProjectSelectedRec(event) {
        this.publishChannel(event.detail.recordId);
        this.projectSelectedRec = event.detail.recordId;
        this.showProject = true;
    }

    // Ends the display of the parent component followed by its children 
    // and returns to the home screen to create or access another record.
    handleClose(){
        this.publishChannel(null);
        this.projectSelectedRec = null;
        this.showProject = false;
    }

    // Opens the Lightning record form in edit mode within a record creation modal.
    handleCreateProject() {
        RecordFormModal.open({
            objectName : 'Project__c',
            headerlabel: 'Create Project',
            mode: 'edit'
        }).then((result , error) => {
            console.log(result)
            if(result != null){
                this.publishChannel(result);
                this.projectSelectedRec = result;
                this.showProject = true;
                let toast = this.toastsMsgs.RecordCreated;
                this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
            }else if(error){
                let toast = this.toastsMsgs.CreationFailed;
                this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
            }
        })
    }

    // Opens the Lightning record form in view mode within a modal to view and edit the record.
    handleEdit() {
        if(this.projectSelectedRec != null){
            RecordFormModal.open({
                objectName : 'Project__c',
                headerlabel: 'Edit Project',
                mode: 'view',
                recordid: this.projectSelectedRec
            }).then((result , error) => {
                if(result != null){
                    this.publishChannel(true);
                    this.getRecords();
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
        if(this.projectSelectedRec != null){
            LightningConfirm.open({
                variant: 'header',
                theme: "error",
                message: 'All milestones and tasks related to this project will also be deleted.',
                label: 'Delete Project?',
            }).then((result) => {
                if(result == true){
                    deleteItem({ recordId : this.projectSelectedRec }).then((result) => {
                        if(result == true){
                            this.projectSelectedRec = null;
                            this.showProject = false;
                            let toast = this.toastsMsgs.RecordDeleted;
                            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                        }else{
                            let toast = this.toastsMsgs.DeletionFaild;
                            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                        }
                        this.publishChannel(null, false, Milestone_Channel);
                    })
                }
            });
        }else{
            let toast = this.toastsMsgs.SelectARecord;
            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
        }
    }

    // Displays the information passed in a toast.
    showToast(title, msg, variant, mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant,
            mode: mode ?? 'dismissible'
        });
        this.dispatchEvent(evt);
    }

    // Publishes the payload in message channel
    publishChannel(id){
        const payload = { recordId: id, toastsMsgs: this.toastsMsgs };
        publish(this.messageContext, Milestone_Channel, payload);
    }
}