import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LitigationViewComponent } from './litigation-view.component';

describe('LitigationViewComponent', () => {
  let component: LitigationViewComponent;
  let fixture: ComponentFixture<LitigationViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LitigationViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LitigationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
