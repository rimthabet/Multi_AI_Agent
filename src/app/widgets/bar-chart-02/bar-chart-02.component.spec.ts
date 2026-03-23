import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart02Component } from './bar-chart-02.component';

describe('BarChart02Component', () => {
  let component: BarChart02Component;
  let fixture: ComponentFixture<BarChart02Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart02Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart02Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
