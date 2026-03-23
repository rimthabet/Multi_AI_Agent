import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart04Component } from './bar-chart-04.component';

describe('BarChart04Component', () => {
  let component: BarChart04Component;
  let fixture: ComponentFixture<BarChart04Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart04Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart04Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
