import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart07Component } from './bar-chart-07.component';

describe('BarChart07Component', () => {
  let component: BarChart07Component;
  let fixture: ComponentFixture<BarChart07Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart07Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart07Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
