import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { KeycloakService } from '../../services/keycloak.service';
import { FeedbackService, FeedbackInput } from '../../services/feedback.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'feedback',
  standalone: true,
  imports: [ClarityModule, CdsModule, TranslateModule, FormsModule, ReactiveFormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent {

  feedbackForm = new FormGroup({
    emoji: new FormControl<number | undefined>(undefined, Validators.required),
    comment: new FormControl<string | undefined>(undefined),
  });

  commentPlaceholder: string = '';

  private readonly toastr = inject(ToastrService);
  private readonly keycloakService = inject(KeycloakService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);

  setEmoji(value: any) {
    this.feedbackForm.get('emoji')?.setValue(value);
    this.updateCommentValidation();
    this.updatePlaceholder();
  }

  updateCommentValidation() {
    const emojiValue = this.feedbackForm.get('emoji')?.value ?? null;
    const commentControl = this.feedbackForm.get('comment');

    if (emojiValue !== null && emojiValue === 1) {
      commentControl?.setValidators([Validators.required]);
    } else {
      commentControl?.clearValidators();
    }
    commentControl?.updateValueAndValidity();
  }

  updatePlaceholder() {
    const emojiValue = this.feedbackForm.get('emoji')?.value ?? null;

    if (emojiValue === 1) {
      this.commentPlaceholder = "Veuillez spécifier les choses qui ne vous plaisent pas et on vous remercie.";
    } else {
      this.commentPlaceholder = "Qu'aimez-vous ou n'aimez-vous pas à propos de PAMS?";
    }
  }

  isSubmitDisabled(): boolean {
    const emojiValue = this.feedbackForm.get('emoji')?.value ?? null;
    const commentValue = this.feedbackForm.get('comment')?.value;

    // Disable if no emoji selected
    if (emojiValue === null) {
      return true;
    }

    // Disable if emoji is 1 and no comment
    if (emojiValue === 1 && (!commentValue || (typeof commentValue === 'string' && commentValue.trim() === ''))) {
      return true;
    }

    return false;
  }

  submitFeedback(): void {
    const feedbackInput: FeedbackInput = {
      rate: this.feedbackForm.get('emoji')?.value ?? 1,
      comment: this.feedbackForm.get('comment')?.value ?? undefined,
      author: this.keycloakService.getUserInfo()?.username,
    };

    this.feedbackService.createFeedback(feedbackInput).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toastr.info('', 'Feedback successfully saved!');
        this.feedbackForm.reset();
      },
      error: (error: any) => {
        this.toastr.error('', 'Error saving feedback. Please try again.');
        console.error('Error saving feedback:', error);
      }
    })
  }

}
