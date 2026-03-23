import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValuationMethodsComponent } from './valuation-methods.component';

describe('ValuationMethodsComponent', () => {
  let component: ValuationMethodsComponent;
  let fixture: ComponentFixture<ValuationMethodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValuationMethodsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValuationMethodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
