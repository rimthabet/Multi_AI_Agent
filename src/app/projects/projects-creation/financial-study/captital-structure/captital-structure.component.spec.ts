import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptitalStructureComponent } from './captital-structure.component';

describe('CaptitalStructureComponent', () => {
  let component: CaptitalStructureComponent;
  let fixture: ComponentFixture<CaptitalStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaptitalStructureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptitalStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
