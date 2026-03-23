import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsSubscribersComponent } from './funds-subscribers.component';

describe('FundsSubscribersComponent', () => {
  let component: FundsSubscribersComponent;
  let fixture: ComponentFixture<FundsSubscribersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsSubscribersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsSubscribersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
