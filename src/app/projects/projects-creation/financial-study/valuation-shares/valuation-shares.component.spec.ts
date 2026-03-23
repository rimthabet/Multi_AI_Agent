import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValuationSharesComponent } from './valuation-shares.component';

describe('ValuationSharesComponent', () => {
  let component: ValuationSharesComponent;
  let fixture: ComponentFixture<ValuationSharesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValuationSharesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValuationSharesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
