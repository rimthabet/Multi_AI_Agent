import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationMethodComponent } from './evaluation-method.component';

describe('EvaluationMethodComponent', () => {
  let component: EvaluationMethodComponent;
  let fixture: ComponentFixture<EvaluationMethodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluationMethodComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluationMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
