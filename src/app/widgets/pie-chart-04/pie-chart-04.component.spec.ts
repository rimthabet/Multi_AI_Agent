import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieChart04Component } from './pie-chart-04.component';

describe('PieChart04Component', () => {
  let component: PieChart04Component;
  let fixture: ComponentFixture<PieChart04Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChart04Component]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PieChart04Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
