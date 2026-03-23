import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiBadge01Component } from './kpi-badge-01.component';

describe('KpiBadge01Component', () => {
  let component: KpiBadge01Component;
  let fixture: ComponentFixture<KpiBadge01Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiBadge01Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiBadge01Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
