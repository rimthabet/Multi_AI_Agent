import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriCalculionComponent } from './tri-calculion.component';

describe('TriCalculionComponent', () => {
  let component: TriCalculionComponent;
  let fixture: ComponentFixture<TriCalculionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriCalculionComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TriCalculionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
