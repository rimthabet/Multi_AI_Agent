import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancingCreateFormComponent } from './financing-create-form.component';

describe('FinancingCreateFormComponent', () => {
  let component: FinancingCreateFormComponent;
  let fixture: ComponentFixture<FinancingCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancingCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancingCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
