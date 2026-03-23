import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectorActivityComponent } from './sector-activity.component';

describe('SectorActivityComponent', () => {
  let component: SectorActivityComponent;
  let fixture: ComponentFixture<SectorActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectorActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
