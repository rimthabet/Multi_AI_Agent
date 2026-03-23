import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsStatusComponent } from './funds-status.component';

describe('FundsStatusComponent', () => {
  let component: FundsStatusComponent;
  let fixture: ComponentFixture<FundsStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
