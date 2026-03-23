import { Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-alerts-listener',
  imports: [ClarityModule, CdsModule, DatePipe],
  templateUrl: './alerts-listener.component.html',
  styleUrl: './alerts-listener.component.scss'
})
export class AlertsListenerComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  // Side panel
  alertsPanelOpened: boolean = false;
  alertes = signal<any[]>([]);

  glowing: boolean = false;
  readonly glowingEffect = effect(() => this.glowing = this.alertes().length > 0);

  //Initialization
  ngOnInit(): void {
    this.loadAlertes();
  }

  //Load alertes  
  loadAlertes() {

    this.managementService.findBusinessAlertes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.alertes.set(data);
      },
      error: (error) => console.error(error),
      complete: () => console.log('Alertes loaded')
    });
  }
}
