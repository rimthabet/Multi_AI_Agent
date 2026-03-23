import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart08Component } from './bar-chart-08.component';

describe('BarChart08Component', () => {
  let component: BarChart08Component;
  let fixture: ComponentFixture<BarChart08Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart08Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart08Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
