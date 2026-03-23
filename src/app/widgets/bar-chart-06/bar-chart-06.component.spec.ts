import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart06Component } from './bar-chart-06.component';

describe('BarChart06Component', () => {
  let component: BarChart06Component;
  let fixture: ComponentFixture<BarChart06Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart06Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart06Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
