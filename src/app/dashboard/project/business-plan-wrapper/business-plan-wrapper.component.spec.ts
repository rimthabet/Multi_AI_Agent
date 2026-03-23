import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessPlanWrapperComponent } from './business-plan-wrapper.component';

describe('BusinessPlanWrapperComponent', () => {
  let component: BusinessPlanWrapperComponent;
  let fixture: ComponentFixture<BusinessPlanWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessPlanWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessPlanWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
