import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class RecordFormModal extends LightningModal {
   @api headerlabel;
   @api objectName;
   @api mode;
   @api recordid


   handleCancel(event){
      this.close(null);
   }

   handleSuccess(event){
      this.close(event.detail.id);
   }

}