import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessPlanTrackingComponent } from './business-plan-tracking.component';

describe('BusinessPlanTrackingComponent', () => {
  let component: BusinessPlanTrackingComponent;
  let fixture: ComponentFixture<BusinessPlanTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessPlanTrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessPlanTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
