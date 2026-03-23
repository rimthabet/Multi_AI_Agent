import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsCreateFormV2Component } from './funds-create-form-v2.component';

describe('FundsCreateFormV2Component', () => {
  let component: FundsCreateFormV2Component;
  let fixture: ComponentFixture<FundsCreateFormV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsCreateFormV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsCreateFormV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
