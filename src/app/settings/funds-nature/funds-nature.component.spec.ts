import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsNatureComponent } from './funds-nature.component';

describe('FundsNatureComponent', () => {
  let component: FundsNatureComponent;
  let fixture: ComponentFixture<FundsNatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsNatureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsNatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
