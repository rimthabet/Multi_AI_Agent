import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsParticipationComponent } from './funds-participation.component';

describe('FundsParticipationComponent', () => {
  let component: FundsParticipationComponent;
  let fixture: ComponentFixture<FundsParticipationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsParticipationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsParticipationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
