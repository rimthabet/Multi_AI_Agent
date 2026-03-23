import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart09Component } from './bar-chart-09.component';

describe('BarChart09Component', () => {
  let component: BarChart09Component;
  let fixture: ComponentFixture<BarChart09Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart09Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart09Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
