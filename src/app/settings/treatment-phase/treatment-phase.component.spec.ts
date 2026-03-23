import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreatmentPhaseComponent } from './treatment-phase.component';

describe('TreatmentPhaseComponent', () => {
  let component: TreatmentPhaseComponent;
  let fixture: ComponentFixture<TreatmentPhaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentPhaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreatmentPhaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
