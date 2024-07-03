import { LightningElement, wire } from 'lwc';
import {subscribe, publish, MessageContext} from 'lightning/messageService';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from "@salesforce/apex";
import LightningConfirm from "lightning/confirm";
import RecordFormModal from 'c/recordFormModal';
import To_Do_Channel from '@salesforce/messageChannel/toDoChannel__c';
import Milestone_Channel from '@salesforce/messageChannel/milestoneChannel__c';
import Project_Channel from '@salesforce/messageChannel/parentProjectChannel__c';
import getMilestonesByParentId from '@salesforce/apex/ProjectManagerMilestonesListController.getMilestonesByParentId';
import deleteItem from '@salesforce/apex/ProjectManagerMilestonesListController.deleteItem';

export default class ProjectManagerMilestonesList extends NavigationMixin(LightningElement) {

    parentId;
    toastsMsgs;
    showMilestones;
    dataWired;
    selectedMilestone;
    milestoneList;

    @wire(MessageContext)
    messageContext;

    // The connectedCallBack initiates the subscription to the messaging channel to receive new information in real time.
    // In this case, triggering refreshApex to update the information in the panel.
    connectedCallback() {
        subscribe(this.messageContext, Milestone_Channel, (payload) => {
            if(payload.reload == true){
                refreshApex(this.dataWired);
                this.publishChannel( null, true, Project_Channel);
            }else{
                if(payload.recordId != null){
                    this.parentId = payload.recordId;
                    this.toastsMsgs = payload.toastsMsgs
                }else{
                    this.publishChannel(null, true, To_Do_Channel);
                    this.parentId = null;
                    this.showMilestones = false;
                }
            }
        })
    }

    // @Wire promotes the most responsive connection to the backend by updating data when necessary.
    @wire(getMilestonesByParentId, { parentId: '$parentId' })
    milestones(value){
        this.dataWired = value;
        const {data} = value
        if(data){
            this.milestoneList = data;
            this.showMilestones = true;
        }
    }

    // View a custom object record in new tab.
    handleNavigate(){
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.selectedMilestone,
                objectApiName: 'Milestone__c',
                actionName: "view"
            },
        }).then(url => {
            window.open(url, "_blank");
        });
    }

    //  Selects the record that starts the string when filled
    handleSelection(event){
        this.selectedMilestone = event.detail.name;
        this.publishChannel(event.detail.name, false, To_Do_Channel);
    }

    // Opens the Lightning record form in edit mode within a record creation modal.
    handleCreate() {
        RecordFormModal.open({
            objectName : 'Milestone__c',
            headerlabel: 'Create Milestone',
            mode: 'edit'
        }).then((result, error) => {
            if(result != null){
                this.publishChannel(result, false, To_Do_Channel);
                refreshApex(this.dataWired);
                this.showMilestones = true;
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
        if(this.selectedMilestone != null){
            RecordFormModal.open({
                objectName : 'Milestone__c',
                headerlabel: 'Edit Milestone',
                mode: 'view',
                recordid: this.selectedMilestone
            }).then((result, error) => {
                if(result != null){
                    this.publishChannel(result, false, To_Do_Channel);
                    refreshApex(this.dataWired);
                    this.showMilestones = true;
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
                            let toast = this.toastsMsgs.RecordDeleted;
                            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                        }else{
                            let toast = this.toastsMsgs.DeletionFaild;
                            this.showToast(toast.MasterLabel, toast.Message__c, toast.Type__c, toast.Mode__c);
                        }
                        refreshApex(this.dataWired);
                        this.publishChannel(null, true, Project_Channel);
                        this.publishChannel(null, true, To_Do_Channel);
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

    // Publishes the payload in message channel
    publishChannel(id, reloadParent, channel){
        const payload = { recordId: id, reload: reloadParent, toastsMsgs: this.toastsMsgs };
        publish(this.messageContext, channel, payload);
    }
}