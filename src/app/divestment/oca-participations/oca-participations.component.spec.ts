import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OCAParticipationsComponent } from './oca-participations.component';

describe('OCAParticipationsComponent', () => {
  let component: OCAParticipationsComponent;
  let fixture: ComponentFixture<OCAParticipationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OCAParticipationsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OCAParticipationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
