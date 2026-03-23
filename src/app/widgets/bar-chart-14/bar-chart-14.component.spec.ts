import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart14Component } from './bar-chart-14.component';

describe('BarChart14Component', () => {
  let component: BarChart14Component;
  let fixture: ComponentFixture<BarChart14Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart14Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart14Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
