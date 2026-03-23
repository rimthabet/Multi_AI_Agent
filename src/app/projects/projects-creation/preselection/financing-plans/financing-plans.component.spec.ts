import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancingPlansComponent } from './financing-plans.component';

describe('FinancingPlansComponent', () => {
  let component: FinancingPlansComponent;
  let fixture: ComponentFixture<FinancingPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancingPlansComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancingPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
