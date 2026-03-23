import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart11Component } from './bar-chart-11.component';

describe('BarChart11Component', () => {
  let component: BarChart11Component;
  let fixture: ComponentFixture<BarChart11Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart11Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart11Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
