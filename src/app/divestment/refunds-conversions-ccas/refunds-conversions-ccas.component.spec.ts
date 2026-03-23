import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundsConversionsCCAsComponent } from './refunds-conversions-ccas.component';

describe('RefundsConversionsCCAsComponent', () => {
  let component: RefundsConversionsCCAsComponent;
  let fixture: ComponentFixture<RefundsConversionsCCAsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundsConversionsCCAsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundsConversionsCCAsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
