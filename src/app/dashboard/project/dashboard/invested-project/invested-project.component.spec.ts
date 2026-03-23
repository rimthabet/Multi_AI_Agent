import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestedProjectComponent } from './invested-project.component';

describe('InvestedProjectComponent', () => {
  let component: InvestedProjectComponent;
  let fixture: ComponentFixture<InvestedProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestedProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestedProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
