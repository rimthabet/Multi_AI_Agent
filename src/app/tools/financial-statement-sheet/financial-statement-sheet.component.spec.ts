import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialStatementSheetComponent } from './financial-statement-sheet.component';

describe('FinancialStatementSheetComponent', () => {
  let component: FinancialStatementSheetComponent;
  let fixture: ComponentFixture<FinancialStatementSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStatementSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialStatementSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
