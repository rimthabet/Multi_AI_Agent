import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  OnInit,
  output,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environment/environment';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { CdsButtonModule, CdsFileModule } from '@cds/angular';

@Component({
  selector: 'app-document-upload-form',
  imports: [ClarityModule, CdsFileModule, FormsModule, CdsButtonModule],
  templateUrl: './document-upload-form.component.html',
  styleUrls: ['./document-upload-form.component.scss'],
})
export class DocumentUploadFormComponent implements OnInit {

  // The style flat or modal
  mode = input<string>('flat'); // can be 'modal'

  // The fund object
  data = model<any>();

  // With description
  with_description = input<boolean>(false);

  // The elementary task
  task_row = input<any>(); //creation fonds, projet, souscription, liberation

  // The phase
  phase_row = input<any>('');

  // The document compliance (mandatory, optional ...)
  compliance = input<any>();

  // The tag
  tag = input<string>('');

  // The event to raise up
  documentUploadedEvent = output<any>();

  // The event is for documents availability
  hasDocumentsEvent = output<boolean>();

  // Dependencies
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);


  constructor() {
    effect(() => {
      this.initForm();
    })
  }

  // State
  documents: any[] | undefined;
  dataFile: any | undefined;
  fileTitle: string | undefined;
  fileDescription: any | undefined;
  uploading: boolean = false;


  // Lifecycle hooks
  ngOnInit(): void {
    this.initForm();
  }

  // Methods
  uploadDocument() {
    this.uploading = true;

    let titre = this.compliance()?.conformite?.documentType?.libelle;

    if (this.fileTitle && this.fileTitle?.trim() != '') titre = this.fileTitle;
    if (this.tag() && this.tag()?.trim() != '') titre = this.tag() + '_' + titre;

    this.managementService
      .uploadAttachement(
        this.data().id,
        this.phase_row(),
        this.compliance()?.conformite?.documentType?.id,
        titre,
        this.task_row(),
        this.dataFile,
        this.fileDescription
      ).pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.toastr.success(
              this.compliance()?.conformite?.documentType?.libelle +
              ' téléchargé avec succès!',
              'Téléchargement des données!'
            );
            if (this.documents) this.documents.push(data);
            else this.documents = [data];
            this.documentUploadedEvent.emit(data);
          } else {
            this.toastr.error('Erreur de téléchargement!');
          }
        },
        error: (error: any) => {
          this.toastr.error('Erreur de téléchargement!', error);
        },
        complete: () => {
          this.uploading = false;
        }
      });
  }

  initForm(data?: any) {
    if (data) this.data.set(data);

    if (this.data()?.documents) {
      this.documents = this.data()?.documents?.filter(
        (datum: any) =>
          datum.type.id == this.compliance()?.conformite?.documentType?.id
      );
    } else if (this.data()?.document) {
      this.documents = [this.data()?.document];
    }

    if (this.tag() && this.tag()?.trim() != '') {
      this.documents = this.documents?.filter((d: any) => {
        return d.titre.indexOf(this.tag()) == 0;
      });
    }

    let hasDocuments =
      this.documents !== undefined && this.documents.length > 0;
    this.hasDocuments(hasDocuments);
  }

  selectFile(event: any) {
    this.dataFile = event.target.files[0];

    if (!this.fileTitle || this.fileTitle == '') {
      let fileName = event.target.files[0]?.name;
      this.fileTitle = fileName?.substring(0, fileName.lastIndexOf('.'));
    }
  }

  supprimerDocument(doc: any) {
    if (confirm('Êtes-vous sûr de vouloir supprimer?')) {
      this.managementService.deleteDocument(doc.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (data: any) => {
          this.toastr.success('Document supprimé avec succès!');
          this.documents = this.documents!.filter((d: any) => d.id != doc.id);
          this.documentUploadedEvent.emit(undefined);
          this.hasDocuments(this.documents?.length > 0);
        },
        error: (error: any) => {
          this.toastr.error('Erreur de suppression!', error);
        }
      })
    }
  }

  trimPath(path: any) {
    let basePath =
      environment.company_short_name === 'MAXULA'
        ? '/opt/fms/maxgest'
        : '/opt/fms/mpm';

    try {
      path = (path as string).replace(basePath, '');
      return path;
    } catch {
      return '';
    }
  }

  refresh() {
    this.initForm();
  }

  hasDocuments($event: boolean) {
    this.hasDocumentsEvent.emit($event);
  }
}
