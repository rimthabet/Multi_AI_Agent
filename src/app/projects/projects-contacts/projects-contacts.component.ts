// Angular core modules and common utilities
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular forms modules
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';

// Angular router
import { RouterModule } from '@angular/router';

// Clarity Design System modules
import { CdsModule } from '@cds/angular';
import { ClarityModule, ClrCommonFormsModule } from '@clr/angular';

// Third-party services
import { ToastrService } from 'ngx-toastr';

// Application services
import { ManagementService } from '../../services/management.service';

/**
 * Component for managing project contacts
 * Handles CRUD operations for contacts with form validation and data management
 */
@Component({
  selector: 'app-projects-contacts',
  imports: [
    // Angular modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Clarity Design System modules
    ClarityModule,
    CdsModule,
    // Router
    RouterModule,
    // Clarity forms
    ClrCommonFormsModule
  ],
  templateUrl: './projects-contacts.component.html',
  styleUrl: './projects-contacts.component.scss'
})
export class ProjectsContactsComponent implements OnInit {

  // --- DEPENDENCY INJECTION ---
  private readonly destroyRef = inject(DestroyRef);

  // Service for API calls and data management
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);

  selectedItem: { id?: number; nom: string; email: string; activite: string; observation: string; telephone: string } | null = null;

  // UI state flags
  loading = true;        // Indicates if data is being loaded
  openModal = false;     // Controls the visibility of the contact form modal

  contacts: Array<{ id: number; nom: string; email: string; activite: string; observation: string; telephone: string }> = [];

  // --- FORM CONFIGURATION ---
  /**
   * Reactive form for contact management
   * Uses strong typing for form controls
   */
  contactForm: FormGroup<{
    nom: FormControl<string | null>;        // Contact name (required)
    email: FormControl<string | null>;      // Email address (required, must be valid email)
    activite: FormControl<string | null>;   // Activity/role of the contact
    observation: FormControl<string | null>; // Additional notes/observations
    telephone: FormControl<string | null>;   // Phone number
  }> = this.formBuilder.group({
    nom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    activite: [''],
    observation: [''],
    telephone: [''],
  });

  /**
   * Getter for easy access to form controls in the template
   */
  get formControls() {
    return this.contactForm.controls;
  }

  /**
   * Angular lifecycle hook - Component initialization
   * Loads the initial list of contacts
   */
  ngOnInit(): void {
    this.loadContacts();
  }

  /**
   * Loads the list of contacts from the API
   * Sorts contacts alphabetically by name
   */
  loadContacts(): void {
    this.loading = true;

    // Fetch contacts from the management service
    this.managementService.findContact()
      // Automatically unsubscribe when component is destroyed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        // Success handler
        next: (data: any) => {
          // Sort contacts alphabetically by name
          data.sort((c1: any, c2: any) =>
            c1.nom > c2.nom ? 1 : c1.nom < c2.nom ? -1 : 0
          );
          this.contacts = data;
        },
        // Error handler
        error: (err) => {
          console.error('Erreur lors du chargement des contacts :', err);
          this.loading = false;
        },
        // Completion handler
        complete: () => {
          this.loading = false;
        },
      });
  }

  /**
   * Opens the contact modal in either create or edit mode
   * @param clear - If true, clears the form for a new contact
   */
  showContactModal(clear: boolean): void {
    if (clear) {
      // Clear the form for a new contact
      this.selectedItem = null;
      this.contactForm.reset();
    } else if (this.selectedItem) {
      // Populate form with selected contact's data
      this.contactForm.patchValue({
        nom: this.selectedItem.nom,
        email: this.selectedItem.email,
        activite: this.selectedItem.activite,
        observation: this.selectedItem.observation,
        telephone: this.selectedItem.telephone,
      });
    }
    // Show the modal
    this.openModal = true;
  }


  /**
   * Handles saving a new contact or updating an existing one
   * Validates the form and makes the appropriate API call
   */
  saveContact(): void {
    // Don't proceed if form is invalid
    if (this.contactForm.invalid) {
      return;
    }

    // Prepare contact data from form values
    const contact = {
      // Include ID if we're updating an existing contact
      ...(this.selectedItem?.id && { id: this.selectedItem.id }),
      // Get values from form with fallback to empty strings
      nom: this.contactForm.value.nom || '',
      email: this.contactForm.value.email || '',
      activite: this.contactForm.value.activite || '',
      observation: this.contactForm.value.observation || '',
      telephone: this.contactForm.value.telephone || ''
    };

    // Determine whether to save new contact or update existing
    const saveOrUpdate$ = this.selectedItem?.id
      ? this.managementService.updateContact(contact)  // Update existing
      : this.managementService.saveContact(contact);   // Create new

    // Execute the appropriate API call
    saveOrUpdate$
      .pipe(takeUntilDestroyed(this.destroyRef))  // Auto-unsubscribe
      .subscribe({
        // Success handler
        next: () => {
          // Show appropriate success message
          const message = this.selectedItem?.id
            ? 'Contact mis à jour avec succès!'  // Updated
            : 'Contact ajouté avec succès!';     // Created

          this.toastr.success('', message);

          // Reset form and UI state
          this.contactForm.reset();
          this.openModal = false;
          this.loadContacts();  // Refresh the list
          this.selectedItem = null;
        },
        // Error handler
        error: (error) => {
          console.error('Erreur lors de la sauvegarde du contact:', error);
          this.toastr.error('Une erreur est survenue lors de la sauvegarde du contact');
        }
      });
  }


  /**
   * Deletes the currently selected contact after confirmation
   * Shows success/error messages and refreshes the contact list
   */
  deleteContact(): void {
    // Guard clause if no contact is selected
    if (!this.selectedItem?.id) {
      return;
    }

    // Confirm before deletion
    if (confirm('Veuillez confirmer cette suppression!')) {
      // Call delete API
      this.managementService.deleteContact(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))  // Auto-unsubscribe
        .subscribe({
          // Success handler
          next: () => {
            this.toastr.success('', 'Contact supprimé avec succès !');
            this.loadContacts();  // Refresh the list
            this.selectedItem = null;  // Clear selection
          },
          // Error handler
          error: (error) => {
            console.error('Erreur lors de la suppression du contact:', error);
            this.toastr.error(
              "Suppression échouée, veuillez vérifier que ce contact n'est référencé par aucun promoteur!"
            );
          }
        });
    }
  }
}

