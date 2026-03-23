import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart01Component } from './bar-chart-01.component';

describe('BarChart01Component', () => {
  let component: BarChart01Component;
  let fixture: ComponentFixture<BarChart01Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart01Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart01Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
