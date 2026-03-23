import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsComiteStrategicComponent } from './funds-comite-strategic.component';

describe('FundsComiteStrategicComponent', () => {
  let component: FundsComiteStrategicComponent;
  let fixture: ComponentFixture<FundsComiteStrategicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsComiteStrategicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsComiteStrategicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
