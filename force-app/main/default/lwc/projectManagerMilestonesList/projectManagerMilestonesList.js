import { LightningElement, api, track, wire } from 'lwc';
import {subscribe, publish, MessageContext} from 'lightning/messageService';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import LightningConfirm from "lightning/confirm";
import RecordFormModal from 'c/recordFormModal';
import To_Do_Channel from '@salesforce/messageChannel/toDoChannel__c';
import Milestone_Channel from '@salesforce/messageChannel/milestoneChannel__c';
import Project_Channel from '@salesforce/messageChannel/parentProjectChannel__c';
import getMilestonesByParentId from '@salesforce/apex/ProjectManagerMilestonesListController.getMilestonesByParentId';
import deleteItem from '@salesforce/apex/ProjectManagerMilestonesListController.deleteItem';

export default class ProjectManagerMilestonesList extends LightningElement {

    parentId;
    toastsMsgs;
    baseURL;
    showMilestones;
    selectedMilestone;
    milestoneList;
    
    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        subscribe(this.messageContext, Milestone_Channel, (payload) => {
            this.baseURL = payload.baseURL;
            if(payload.reload == true){
                this.getRecords();
                this.publishChannel( null, true, Project_Channel);
            }else{
                if(payload.recordId != null){
                    this.parentId = payload.recordId;
                    this.toastsMsgs = payload.toastsMsgs
                    this.getRecords();
                }else{
                    this.publishChannel(null, true, To_Do_Channel);
                    this.parentId = null;
                    this.showMilestones = false;
                }
            }
        })
    }

    getRecords(){
        getMilestonesByParentId({parentId: this.parentId})
        .then((data)=>{
            console.log("DATA>>>> " + JSON.stringify(data));
            this.milestoneList = data;
            this.showMilestones = true;
        }).catch((error)=>{
            let toast = this.toastsMsgs.GenericError;
            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c)
        })
    }

    handleCreate() {
        RecordFormModal.open({
            objectName : 'Milestone__c',
            headerlabel: 'Create Milestone',
            mode: 'edit'
        }).then((result) => {
            console.log(' Milestone__c result' + JSON.stringify(result));
            if(result != null){
                this.publishChannel(result, false, To_Do_Channel);
                this.getRecords();
                this.showMilestones = true;
                let toast = this.toastsMsgs.SuccessfulCreation;
                this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
            }
        })
    }

    handleEdit() {
        if(this.selectedMilestone != null){
            console.log('Edit Clicked ' + this.selectedMilestone)
            RecordFormModal.open({
                objectName : 'Milestone__c',
                headerlabel: 'Edit Milestone',
                mode: 'view',
                recordid: this.selectedMilestone
            }).then((result) => {
                if(result != null){
                    this.publishChannel(result, false, To_Do_Channel);
                    this.getRecords();
                    this.showMilestones = true;
                    let toast = this.toastsMsgs.SuccessfulCreation;
                    this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                }
            })
        }else{
            this.showToast('Select a Record', 'Select a Milestone','warning' );
        }
    }

    handleNavigate(){
        window.open(this.selectedMilestone);
    }

    handleSelection(event){
        this.selectedMilestone = event.detail.name;
        this.publishChannel(event.detail.name, false, To_Do_Channel);
        console.log(event.detail.name);
    }

    handleDeleteItem() {
        console.log('this.selectedMilestone >>> ' + this.selectedMilestone)
        if(this.selectedMilestone != null){
            LightningConfirm.open({
                variant: 'header',
                message: 'All tasks related to this milestone will be deleted as well.',
                theme: "error",
                label: 'Delete Milestone?',
            }).then((result) => {
                if(result == true){
                    deleteItem({ recordId : this.selectedMilestone }).then((result) => {
                        if(result == true){
                            this.selectedMilestone = null;
                            this.showToast('Success', 'Milestone deleted','success' );
                        }else{
                            let toast = this.toastsMsgs.GenericError;
                            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                        }
                        this.getRecords();
                        this.publishChannel(null, true, Project_Channel);
                        this.publishChannel(null, true, To_Do_Channel);
                    })
                }
            });
        }
    }

    publishChannel(id, reloadParent, channel){
        const payload = { recordId: id, reload: reloadParent, toastsMsgs: this.toastsMsgs, baseURL : this.baseURL };
        publish(this.messageContext, channel, payload);
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
}