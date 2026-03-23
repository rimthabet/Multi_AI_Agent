import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsSubcriptionCreateFormComponent } from './funds-subcription-create-form.component';

describe('FundsSubcriptionCreateFormComponent', () => {
  let component: FundsSubcriptionCreateFormComponent;
  let fixture: ComponentFixture<FundsSubcriptionCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsSubcriptionCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsSubcriptionCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
