import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriCapitalComponent } from './tri-capital.component';

describe('TriCapitalComponent', () => {
  let component: TriCapitalComponent;
  let fixture: ComponentFixture<TriCapitalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriCapitalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriCapitalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
