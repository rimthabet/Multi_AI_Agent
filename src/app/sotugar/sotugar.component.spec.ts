import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SotugarComponent } from './sotugar.component';

describe('SotugarComponent', () => {
  let component: SotugarComponent;
  let fixture: ComponentFixture<SotugarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SotugarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SotugarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
