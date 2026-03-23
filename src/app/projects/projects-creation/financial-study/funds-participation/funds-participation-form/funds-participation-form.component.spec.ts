import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsParticipationFormComponent } from './funds-participation-form.component';

describe('FundsParticipationFormComponent', () => {
  let component: FundsParticipationFormComponent;
  let fixture: ComponentFixture<FundsParticipationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsParticipationFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsParticipationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
