import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NonFundraisingStructureComponent } from './non-fundraising-structure.component';

describe('NonFundraisingStructureComponent', () => {
  let component: NonFundraisingStructureComponent;
  let fixture: ComponentFixture<NonFundraisingStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NonFundraisingStructureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NonFundraisingStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
