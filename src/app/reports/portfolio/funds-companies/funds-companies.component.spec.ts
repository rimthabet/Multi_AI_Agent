import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsCompaniesComponent } from './funds-companies.component';

describe('FundsCompaniesComponent', () => {
  let component: FundsCompaniesComponent;
  let fixture: ComponentFixture<FundsCompaniesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsCompaniesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsCompaniesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
