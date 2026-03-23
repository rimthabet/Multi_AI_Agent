import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriHomeComponent } from './tri-home.component';

describe('TriHomeComponent', () => {
  let component: TriHomeComponent;
  let fixture: ComponentFixture<TriHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
