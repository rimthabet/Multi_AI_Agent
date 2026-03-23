import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharesParticipationsComponent } from './shares-participations.component';

describe('SharesParticipationsComponent', () => {
  let component: SharesParticipationsComponent;
  let fixture: ComponentFixture<SharesParticipationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharesParticipationsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SharesParticipationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
