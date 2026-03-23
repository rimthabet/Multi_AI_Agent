import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsReviewFormComponent } from './funds-review-form.component';

describe('FundsReviewFormComponent', () => {
  let component: FundsReviewFormComponent;
  let fixture: ComponentFixture<FundsReviewFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsReviewFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsReviewFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
