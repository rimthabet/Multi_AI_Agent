import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapitalStructureComponent } from './capital-structure.component';

describe('CapitalStructureComponent', () => {
  let component: CapitalStructureComponent;
  let fixture: ComponentFixture<CapitalStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapitalStructureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapitalStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
