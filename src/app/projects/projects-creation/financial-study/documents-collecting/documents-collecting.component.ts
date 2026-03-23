import { Component, DestroyRef, inject, input, OnInit, viewChild } from '@angular/core';
import { DocumentUploadFormComponent } from "../../../../tools/document-upload/document-upload-form/document-upload-form.component";
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../../../services/management.service';
import { TextModel } from '../../../../widgets/emailing-form/constants/TextModel';
import { DocumentUploadComponent } from "../../../../tools/document-upload/document-upload.component";
import { EmailingFormComponent } from "../../../../widgets/emailing-form/emailing-form.component";

@Component({
  selector: 'documents-collecting',
  imports: [ClarityModule, CdsModule, DocumentUploadFormComponent, EmailingFormComponent, DocumentUploadComponent],
  templateUrl: './documents-collecting.component.html',
  styleUrl: './documents-collecting.component.scss'
})
export class DocumentsCollectingComponent implements OnInit {
  // INPUT
  prospection = input<any>();

  // VIEWCHILD
  checklistEmail = viewChild<EmailingFormComponent>("checklist");
  ndaEmail = viewChild<EmailingFormComponent>("nda");
  docUpload = viewChild<DocumentUploadComponent>("docUpload");

  ///DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  ///PROPERTIES
  filteredCheckList: any[] = [];
  checklists: any[] = [];
  conformite_documentaires: any[] = [];

  textFormHTMLINIT: string = TextModel.checkListMessage;
  textFormHTML: string = TextModel.checkListMessage;

  textFormHTMLNDA: string = TextModel.ndaMessaga;

  showUploadDocument: boolean = false;
  selectedCheck: any = null;

  EmailTEXT: string = '';
  opened: boolean = false;
  showEmailChecklist: boolean = false;
  showEmailNda: boolean = false;

  selectedItem: any = null;
  showModal: boolean = false;
  document: any | undefined;

  ///INITIALIZE
  ngOnInit(): void {
    this.loadData();
  }

  /// LOAD DATA
  loadData() {
    this.managementService
      .findChecklistsByTypeInvestissement(
        this.prospection()?.typeInvestissement?.id
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.checklists = data;

          if (data?.length > 0) {
            this.filteredCheckList = data[0].conformiteDocumentaires.map(
              (e: any) => {
                const documentExists = this.prospection()?.documents?.some(
                  (d: any) => d.type?.libelle === e.documentType?.libelle
                );

                return {
                  ...e,
                  checked: !documentExists,
                  enabled: true,
                  hasDocument: documentExists
                };
              }
            );
          }

          this.updateEmailTextCheckList();

          this.textFormHTMLNDA = TextModel.ndaMessaga.replace(
            'NOM_PROMOTEUR',
            this.prospection()?.promoteur?.nom || ''
          );
        },
        error: (err) => console.error('Erreur chargement checklist :', err)
      });
  }

  /// CHECKLIST
  checkListItemStateChanged(event: any, itemIndex: number): void {
    const isChecked = event?.target?.checked;

    this.filteredCheckList = this.filteredCheckList.map((e, index) =>
      index === itemIndex ? { ...e, checked: isChecked } : e
    );

    this.updateEmailTextCheckList();

    if (!isChecked) {
      this.showUploadDocument = true;
      this.selectedCheck = this.filteredCheckList[itemIndex];
    }
  }

  /// EMAIL
  updateEmailTextCheckList(): void {
    const checkedItems = this.filteredCheckList
      .filter(e => e.checked)
      .map(e => `- ${e.documentType?.libelle || e.libelle || 'Document'}`)
      .join('\n');

    const promoteur = this.prospection()?.promoteur?.nom || '';
    const projet = this.prospection()?.nom || '';

    this.textFormHTML = this.textFormHTMLINIT
      .replace('NOM_PROMOTEUR', promoteur)
      .replace('NOM_PROJET', projet)
      .replace('CHECK_LIST', checkedItems);

    this.checklistEmail()?.setMessage(this.textFormHTML);
  }


  /// GET CHECKED LIST
  getCheckedList() {
    return this.filteredCheckList
      .filter((e: any) => e.checked)
      .map(({ checked, enabled, hasDocument, ...rest }) => ({ ...rest }));
  }



  /// SUCCESS UPLOAD
  successUpload(uploaded: any): void {
    if (uploaded) {
      this.selectedCheck.hasDocument = true;
      this.selectedCheck.checked = false;
    } else {
      this.filteredCheckList = this.filteredCheckList.map(e =>
        e.id === this.selectedCheck?.id ? { ...e, checked: true } : e
      );
      this.selectedCheck = null;
    }

    this.showUploadDocument = false;
    this.updateEmailTextCheckList();
  }


  /// MODAL
  showHideModal() {
    this.showEmailChecklist = false;
    this.showEmailNda = false;
  }

  /// EMAIL
  showEmailModalCheckList() {
    this.updateEmailTextCheckList();
    this.EmailTEXT = this.textFormHTML;
    this.showEmailChecklist = true;

    setTimeout(() => {
      this.checklistEmail()?.setMessage(this.textFormHTML);
    }, 100);
  }

  /// EMAIL
  showEmailModalNda() {
    this.EmailTEXT = this.textFormHTMLNDA;
    this.showEmailNda = true;
  }

  /// MODAL
  openModal(item: any) {
    this.selectedItem = item;
    this.showModal = true;
  }

  documentUploaded(event: any): void {
    if (event) {
      this.document = event;
      this.loadData();
    }

    this.updateEmailTextCheckList();
  }


  onToggleChange(item: any, event: any): void {
    const isChecked = event?.target?.checked;
    const targetItem = this.filteredCheckList.find(e => e.id === item.id);
    if (!targetItem) return;

    if (item.hasDocument && isChecked) {
      event.target.checked = false;
      return;
    }

    targetItem.checked = isChecked;
    this.updateEmailTextCheckList();

    if (!isChecked && !item.hasDocument) {
      this.openModal(item);
    }
  }


  isToggleDisabled(item: any): boolean {
    return item.hasDocument;
  }

  onHasDocuments(hasDocuments: boolean): void {
    if (!this.selectedItem) return;
    const item = this.filteredCheckList.find(e => e.id === this.selectedItem.id);
    if (!item) return;

    item.hasDocument = hasDocuments;
    if (!hasDocuments) item.checked = true;

    this.updateEmailTextCheckList();
  }

}
