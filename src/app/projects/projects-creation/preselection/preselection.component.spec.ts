import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreselectionComponent } from './preselection.component';

describe('PreselectionComponent', () => {
  let component: PreselectionComponent;
  let fixture: ComponentFixture<PreselectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreselectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreselectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
