import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart15Component } from './bar-chart-15.component';

describe('BarChart15Component', () => {
  let component: BarChart15Component;
  let fixture: ComponentFixture<BarChart15Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart15Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart15Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
