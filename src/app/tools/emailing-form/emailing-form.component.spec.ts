import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailingFormComponent } from './emailing-form.component';

describe('EmailingFormComponent', () => {
  let component: EmailingFormComponent;
  let fixture: ComponentFixture<EmailingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailingFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
