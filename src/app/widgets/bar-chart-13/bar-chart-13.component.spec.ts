import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart13Component } from './bar-chart-13.component';

describe('BarChart13Component', () => {
  let component: BarChart13Component;
  let fixture: ComponentFixture<BarChart13Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart13Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart13Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
