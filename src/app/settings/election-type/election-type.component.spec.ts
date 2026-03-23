import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElectionTypeComponent } from './election-type.component';

describe('ElectionTypeComponent', () => {
  let component: ElectionTypeComponent;
  let fixture: ComponentFixture<ElectionTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElectionTypeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ElectionTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
