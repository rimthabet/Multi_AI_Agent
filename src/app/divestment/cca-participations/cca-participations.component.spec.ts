import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CCAParticipationsComponent } from './cca-participations.component';

describe('CCAParticipationsComponent', () => {
  let component: CCAParticipationsComponent;
  let fixture: ComponentFixture<CCAParticipationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CCAParticipationsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CCAParticipationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
