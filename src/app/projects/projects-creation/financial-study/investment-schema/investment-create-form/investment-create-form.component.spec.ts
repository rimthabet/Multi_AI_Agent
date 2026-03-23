import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentCreateFormComponent } from './investment-create-form.component';

describe('InvestmentCreateFormComponent', () => {
  let component: InvestmentCreateFormComponent;
  let fixture: ComponentFixture<InvestmentCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
