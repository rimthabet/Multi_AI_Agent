import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentNatureComponent } from './investment-nature.component';

describe('InvestmentNatureComponent', () => {
  let component: InvestmentNatureComponent;
  let fixture: ComponentFixture<InvestmentNatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentNatureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentNatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
