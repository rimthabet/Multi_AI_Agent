import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscribedReleasedFundComponent } from './subscribed-released-fund.component';

describe('SubscribedReleasedFundComponent', () => {
  let component: SubscribedReleasedFundComponent;
  let fixture: ComponentFixture<SubscribedReleasedFundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscribedReleasedFundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscribedReleasedFundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
