import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationMethodFormComponent } from './evaluation-method-form.component';

describe('EvaluationMethodFormComponent', () => {
  let component: EvaluationMethodFormComponent;
  let fixture: ComponentFixture<EvaluationMethodFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluationMethodFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluationMethodFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
