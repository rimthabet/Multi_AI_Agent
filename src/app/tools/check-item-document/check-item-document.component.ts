import { Component, input, output, EventEmitter } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DocumentUploadFormComponent } from "../document-upload/document-upload-form/document-upload-form.component";

@Component({
  selector: 'check-item-document',
 
  imports: [ClarityModule, CdsModule, DocumentUploadFormComponent],
  templateUrl: './check-item-document.component.html',
  styleUrl: './check-item-document.component.scss'
})
export class CheckItemDocumentComponent {
  data = input<any>();
  projet = input<any>();
  checked = input<boolean>();
  task_row = input<number>();
  phase_row = input<number>();

  checkedChange = output<boolean>();
  hideEvent = output<boolean>();

  show: boolean = false;
  document: any | undefined;


  // State changed event
  stateChanged($event: any) {
    this.show = !$event.target.checked;
  }


  // Document uploaded event
  documentUploaded($event: any) {
    if ($event) {
      this.document = $event;
      this.checkedChange.emit(false);
    } else {
      this.checkedChange.emit(true);
    }
  }
}
