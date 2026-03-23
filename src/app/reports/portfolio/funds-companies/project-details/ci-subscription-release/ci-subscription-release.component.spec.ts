import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CiSubscriptionReleaseComponent } from './ci-subscription-release.component';

describe('CiSubscriptionReleaseComponent', () => {
  let component: CiSubscriptionReleaseComponent;
  let fixture: ComponentFixture<CiSubscriptionReleaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CiSubscriptionReleaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CiSubscriptionReleaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
