import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareholdersGridComponent } from './shareholders-grid.component';

describe('ShareholdersGridComponent', () => {
  let component: ShareholdersGridComponent;
  let fixture: ComponentFixture<ShareholdersGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareholdersGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareholdersGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
