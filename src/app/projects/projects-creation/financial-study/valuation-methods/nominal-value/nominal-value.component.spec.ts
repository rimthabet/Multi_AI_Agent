import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NominalValueComponent } from './nominal-value.component';

describe('NominalValueComponent', () => {
  let component: NominalValueComponent;
  let fixture: ComponentFixture<NominalValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NominalValueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NominalValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
