import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowupDesicionResolutionComponent } from './followup-desicion-resolution.component';

describe('FollowupDesicionResolutionComponent', () => {
  let component: FollowupDesicionResolutionComponent;
  let fixture: ComponentFixture<FollowupDesicionResolutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FollowupDesicionResolutionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FollowupDesicionResolutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
