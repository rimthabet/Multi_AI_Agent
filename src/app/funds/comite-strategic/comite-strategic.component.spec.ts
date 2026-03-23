import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteStrategicComponent } from './comite-strategic.component';

describe('ComiteStrategicComponent', () => {
  let component: ComiteStrategicComponent;
  let fixture: ComponentFixture<ComiteStrategicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteStrategicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteStrategicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
