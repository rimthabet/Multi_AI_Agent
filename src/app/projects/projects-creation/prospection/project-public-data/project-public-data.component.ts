import { Component, DestroyRef, inject, input, model, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ManagementService } from '../../../../services/management.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'project-public-data',
  imports: [ClarityModule, FormsModule, CdsModule, ReactiveFormsModule],
  templateUrl: './project-public-data.component.html',
  styleUrl: './project-public-data.component.scss'
})
export class ProjectPublicDataComponent implements OnInit {

  // inputs
  prospection = input<any>();

  // loading
  loading = model<boolean>(false);

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);


  // forms
  publicDataForm!: FormGroup;


  // lifecycle
  ngOnInit(): void {
    this.publicDataForm = this.formBuilder.group({
      id: null,
      web: [''],
      email: [''],
      telephone: [''],
      activite: [''],
      description: [''],
      banner: [undefined],
    });

    this.loadPublicData();
  }


  // load public data
  loadPublicData() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.managementService
      .findProjetPublicDataById(Number(id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projetData: any) => {
          this.publicDataForm.patchValue({
            id: projetData.id,
            web: projetData.web,
            email: projetData.email,
            telephone: projetData.telephone,
            activite: projetData.activite,
            description: projetData.description,
          });
        },
        error: (data: any) => this.toastr.error('', 'Erreur de chargement des données!'),
      })
  }


  // select file
  selectFile(event: any) {
    this.publicDataForm.controls['banner'].patchValue(event.target.files[0]);
  }

  // save
  savePublicData() {
    let data = {
      id: this.publicDataForm.controls['id'].value,
      projet: this.prospection()?.id,
      web: this.publicDataForm.controls['web'].value,
      email: this.publicDataForm.controls['email'].value,
      telephone: this.publicDataForm.controls['telephone'].value,
      activite: this.publicDataForm.controls['activite'].value,
      description: this.publicDataForm.controls['description'].value,
      banner: this.publicDataForm.controls['banner'].value,
    };

    this.managementService
      .saveProjectPublicData(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('', 'Données sauvegardées vec succès !');
          this.publicDataForm.reset();
          this.loadPublicData();
        },
        error: (data: any) => this.toastr.error('', 'Erreur de sauvegarde des données!'),
      })
  }

}
