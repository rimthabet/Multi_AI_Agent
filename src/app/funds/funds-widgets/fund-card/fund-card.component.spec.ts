import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundCardV2Component } from './fund-card-v2.component';

describe('FundCardV2Component', () => {
  let component: FundCardV2Component;
  let fixture: ComponentFixture<FundCardV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundCardV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundCardV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
