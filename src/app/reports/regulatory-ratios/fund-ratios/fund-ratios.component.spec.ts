import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundRatiosComponent } from './fund-ratios.component';

describe('FundRatiosComponent', () => {
  let component: FundRatiosComponent;
  let fixture: ComponentFixture<FundRatiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundRatiosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundRatiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
