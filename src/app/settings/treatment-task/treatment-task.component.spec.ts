import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreatmentTaskComponent } from './treatment-task.component';

describe('TreatmentTaskComponent', () => {
  let component: TreatmentTaskComponent;
  let fixture: ComponentFixture<TreatmentTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentTaskComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TreatmentTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
