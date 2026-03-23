import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsCreateFormComponent } from './funds-create-form.component';

describe('FundsCreateFormComponent', () => {
  let component: FundsCreateFormComponent;
  let fixture: ComponentFixture<FundsCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
