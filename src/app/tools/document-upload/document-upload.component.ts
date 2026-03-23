import {
  Component,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DocumentUploadFormComponent } from './document-upload-form/document-upload-form.component';
import { ClarityModule } from '@clr/angular';
import { CdsFileModule } from '@cds/angular';

@Component({
  selector: 'document-upload',
  imports: [ClarityModule, CdsFileModule, DocumentUploadFormComponent],
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss'],
})
export class DocumentUploadComponent {

  // ViewChild pour le formulaire interne (optionnel)
  docUpldForm = viewChild<ElementRef>("docUpldForm");

  // The style flat or modal
  mode = input<any>('flat'); // can be 'modal'

  // The button style icon or regular
  button_style = input<any>('regular'); // can be icon

  // The fund object
  data = input<any>();

  // We track the changes in the data to refresh the views
  dataRefreshEffect = effect(() => {
    if (this.data()) {
      this.refresh();
    }
  });

  refresh() {
    this.docUpldForm()?.nativeElement?.refresh();
  }

  with_description = input<boolean>(false);

  // The elementary task
  task_row = input<any>(); //creation fonds, projet, souscription, liberation

  // The phase
  phase_row = input<any>();

  // The document compliance (mandatory, optional ...)
  compliance = input<any>();

  // The tag
  tag = input<any>();

  // The event to raise up
  documentUploadedEvent = output<any>();

  // The event is for documents availability
  hasDocumentsEvent = output<boolean>();

  uploading: boolean = false;
  show: boolean = false;

  documentUploaded($event: any) {
    this.documentUploadedEvent.emit($event);
  }

  hasDocuments($event: boolean) {
    this.hasDocumentsEvent.emit($event);
  }


}
