import { Component, DestroyRef, inject, model, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-feedback',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss'
})
export class FeedbackComponent implements OnInit {
  
  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  // ===== FORMS =====
  feedbackForm!: FormGroup;

  // ===== PROPERTIES =====
  feedbackIconSolid = -1;

  // ===== MODEL =====
  openfeedbackModal = model<boolean>(false);

  // ===== INITIALIZE =====
  ngOnInit(): void {
    this.initForm();
  }

  // INIT FORM
  initForm() {
    this.feedbackForm = this.formBuilder.group({
      emoji: new FormControl(undefined, Validators.required),
      comment: new FormControl(undefined, Validators.required),
    })
  }

  // SET EMOJI
  setEmoji(value: any) {
    this.feedbackForm.get('emoji')?.setValue(value);
  }

  // SUBMIT FEEDBACK
  submitFeedback() {
    const feedback = {
      clId: "",
      emoji: this.feedbackForm.get('emoji')?.value,
      comment: this.feedbackForm.get('comment')?.value,
    };
    this.managementService.addFeedback(feedback)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Feedback envoyé avec succès!');
          this.openfeedbackModal.set(false);
        },
        error: (error) => console.error(error),
      })
  }

  // OPEN FEEDBACK MODAL
  openFeedbackModal() {
    this.openfeedbackModal.set(true);
  }
}
