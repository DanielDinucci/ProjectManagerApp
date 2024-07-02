import { LightningElement, wire, api } from 'lwc';
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
    baseURL;
    projectSelectedRec;
    projectName = '';
    projectStatus = '';
    projectCompletion = 0;
    createdDate;
    dataWired;
    spinner = true;
    
    connectedCallback(){
        subscribe(this.messageContext, Project_Channel, (payload) => {
            if(payload.reload == true){
               refreshApex(this.dataWired);
            }
        })
        getProjectManagerAppMessageMDT().then((data)=>{
            this.toastsMsgs = data;
        });
        this.baseURL = window.location.origin + '/';
        this.spinner = false;
    }

    // Convert Datetime to en-US date format
    convertDateTimeToUsDate(isoString) {
        const date = new Date(isoString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const result = date.toLocaleDateString('en-US', options);
        return result;
    }

    @wire(MessageContext)
    messageContext;

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
        this.spinner = false;
    }
    
    handleProjectSelectedRec(event) {
        this.publishChannel(event.detail.recordId);
        this.showProject = true;
        this.projectSelectedRec = event.detail.recordId;
    }

    handleClose(){
        this.publishChannel(null);
        this.showProject = false;
        this.projectSelectedRec = null;
    }

    handleCreateProject() {
        RecordFormModal.open({
            objectName : 'Project__c',
            headerlabel: 'Create Project',
            mode: 'edit'
        }).then((result) => {
            console.log(result)
            if(result != null){
                this.publishChannel(result);
                this.projectSelectedRec = result;
                this.showProject = true;
                let toast = this.toastsMsgs.SuccessfulCreation;
                this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
            }
        })
    }

    handleEdit() {
        if(this.projectSelectedRec != null){
            RecordFormModal.open({
                objectName : 'Project__c',
                headerlabel: 'Edit Project',
                mode: 'view',
                recordid: this.projectSelectedRec
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
        console.log('this.projectSelectedRec >>> ' + this.projectSelectedRec)
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
                            this.showToast('Success', 'Milestone deleted','success' );
                        }else{
                            let toast = this.toastsMsgs.GenericError;
                            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                        }
                        this.publishChannel(null, false, Milestone_Channel);
                    })
                }
            });
        }
    }

    showToast(title, msg, variant , mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }

    publishChannel(id){
        const payload = { recordId: id, toastsMsgs: this.toastsMsgs, baseURL: this.baseURL };
        publish(this.messageContext, Milestone_Channel, payload);
    }
}