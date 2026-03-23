import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancingPlanComponent } from './financing-plan.component';

describe('FinancingPlanComponent', () => {
  let component: FinancingPlanComponent;
  let fixture: ComponentFixture<FinancingPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancingPlanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancingPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
