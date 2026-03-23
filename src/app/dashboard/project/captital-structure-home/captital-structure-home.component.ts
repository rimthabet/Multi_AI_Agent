import { Component, input, inject, OnInit, effect, AfterViewInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../../services/management.service';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { CaptitalStructureWrapperComponent } from "./captital-structure-wrapper/captital-structure-wrapper.component";

@Component({
  selector: 'captital-structure-home',
  imports: [ClarityModule, CdsModule, DatePipe, CaptitalStructureWrapperComponent],
  templateUrl: './captital-structure-home.component.html',
  styleUrl: './captital-structure-home.component.scss'
})
export class CaptitalStructureHomeComponent implements AfterViewInit {

  // inputs
  projet = input<any>();
  financement = input<any>();

  // dependencies
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  financements: any[] = [];



  // INITIALIZE
  ngAfterViewInit(): void {
    if (this.projet()?.projet?.id) this.setProjet(this.projet);
  }


  // EFFECTS
  readonly projetEffect = effect(() => {
    if (this.projet()?.id) {
      this.loadFinancements();
    }
  });

  // SET PROJET
  setProjet(data: any) {
    this.projet = data;
    this.loadFinancements();
  }

  // LOAD FINANCEMENTS
  loadFinancements() {
    this.managementService
      .findFinancementByProjectId(this.projet()?.projet.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.financements = data;
        },
        error: (error: any) => {
          console.error(error);
        }
      })

  }

}
