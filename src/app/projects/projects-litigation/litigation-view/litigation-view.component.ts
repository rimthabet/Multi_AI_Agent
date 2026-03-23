import { Component, DestroyRef, inject, input, model, viewChild, effect, output, AfterViewInit } from '@angular/core';
import { CdsButtonModule, CdsIconModule, CdsDropdownModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';
import { LitigationService } from '../../../services/litigation.service';

@Component({
  selector: 'litigation-view',
  imports: [ClarityModule, CdsButtonModule, CdsIconModule, CdsDropdownModule, FullCalendarModule],
  templateUrl: './litigation-view.component.html',
  styleUrl: './litigation-view.component.scss'
})
export class LitigationViewComponent implements AfterViewInit {

  // Input
  project = input<any>();
  open = model<boolean>(false);

  // View child
  calendarComponent = viewChild.required<FullCalendarComponent>('calendar');

  private readonly destroyRef = inject(DestroyRef);
  private readonly litigationService = inject(LitigationService);

  calendarInitialized: boolean = false;
  dossiersContentieux: any[] = [];
  selectedDossier: any;
  calendarOptions!: CalendarOptions;

  // Lifecycle hooks
  ngAfterViewInit(): void {
    this.loadDossiersContentieux();
    this.initializeCalendar();
  }

  // Methods
  setupCalendarOptions(): void {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView: 'dayGridMonth',
      locale: frLocale,
      height: '480px',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      slotMinTime: '08:00:00',
      slotMaxTime: '18:00:00',
      slotDuration: '01:00:00',
      eventColor: '#0f62fe',
      events: [],
    };
  }

  // Initialize the calendar
  initializeCalendar(): void {
    if (!this.calendarInitialized) {
      this.setupCalendarOptions();
      this.calendarInitialized = true;
      setTimeout(() => {
        this.calendarComponent()?.getApi().render();
      }, 100);
    }
  }

  // Selecting a dossier
  selectDossier(dossier: any): void {
    this.selectedDossier = dossier;
    sessionStorage.setItem('LastVisitedDossier', dossier.id);
  }

  // Loading the dossiers contentieux
  loadDossiersContentieux(): void {
    this.litigationService.findDossiers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.dossiersContentieux = data;
          const lastId = sessionStorage.getItem('LastVisitedDossier');
          const restored = data.find((d: any) => d.id == lastId) || data[0];
          this.selectDossier(restored);
        },
        error: err => console.error('Erreur chargement dossiers:', err)
      });
  }


}
