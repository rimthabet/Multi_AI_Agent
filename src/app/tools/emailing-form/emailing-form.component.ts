import { Component, DestroyRef, input, output, effect, model } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ManagementService } from '../../services/management.service';
import { ToastrService } from 'ngx-toastr';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'emailing-form',
 
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule],
  templateUrl: './emailing-form.component.html',
  styleUrl: './emailing-form.component.scss'
})
export class EmailingFormComponent {
  /// INPUT
  with_attachments = input<boolean>();
  textModel = model<string>();
  selectedFileName = input<string>();
  prospection = input<any>();

  /// OUTPUT
  hideModalEvent = output<any>();

  // Injects
  private readonly formBuilder = inject(FormBuilder);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  // PROPERTIES
  emailSaveForm: FormGroup = this.formBuilder.group({
    adresse: [undefined, [Validators.required]],
    titre: [''],
    textModel: [''] 
  });
  
  selectedFiles: File[] = [];

  // Effect
  private readonly textModelEffect = effect(() => {
    const updatedContent = this.textModel();
    if (updatedContent) {
      this.emailSaveForm.get('textModel')?.setValue(updatedContent);
    }
  });

  // INITIALIZE
  ngOnInit(): void {
    const content = this.textModel();
    if (content) {
      this.emailSaveForm.get('textModel')?.setValue(content);
    }
  }
  
  // Save email
  saveEmail() {
    const destinataire = this.emailSaveForm?.value['adresse'];
    const sujet = this.emailSaveForm?.value['titre'];
    const message = this.emailSaveForm.get('textModel')?.value;

    const filesToSend = this.selectedFiles.length > 0 ? this.selectedFiles : [];

    this.managementService
      .sendEmail(destinataire, sujet, message, filesToSend)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Email envoyé avec succès!');
        },
        error: (error) => {
          console.error(error);
        }
      });
  }

  // Hide modal
  hideModal() {
    this.hideModalEvent.emit(undefined); 
  }

  // Open file selector
  openFileSelector() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  // On files selected
  onFilesSelected(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const files = inputElement?.files;
    if (files) {
      this.selectedFiles.push(...Array.from(files));
    }
  }

  // Remove selected file
  removeSelectedFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter((f) => f !== file);
  }

  // Set message
  setMessage(data: any) {
    this.textModel.set(data);
    this.emailSaveForm.get('textModel')?.setValue(data);
  }
}