import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancingSwitchComponent } from './financing-switch.component';

describe('FinancingSwitchComponent', () => {
  let component: FinancingSwitchComponent;
  let fixture: ComponentFixture<FinancingSwitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancingSwitchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancingSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
