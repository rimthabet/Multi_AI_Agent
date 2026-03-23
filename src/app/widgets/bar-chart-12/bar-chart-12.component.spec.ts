import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChart12Component } from './bar-chart-12.component';

describe('BarChart12Component', () => {
  let component: BarChart12Component;
  let fixture: ComponentFixture<BarChart12Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChart12Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarChart12Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
