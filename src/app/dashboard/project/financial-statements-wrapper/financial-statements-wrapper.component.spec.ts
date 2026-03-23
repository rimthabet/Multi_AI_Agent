import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialStatementsWrapperComponent } from './financial-statements-wrapper.component';

describe('FinancialStatementsWrapperComponent', () => {
  let component: FinancialStatementsWrapperComponent;
  let fixture: ComponentFixture<FinancialStatementsWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStatementsWrapperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialStatementsWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
