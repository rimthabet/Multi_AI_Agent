import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsTreeViewComponent } from './items-tree-view.component';

describe('ItemsTreeViewComponent', () => {
  let component: ItemsTreeViewComponent;
  let fixture: ComponentFixture<ItemsTreeViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemsTreeViewComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ItemsTreeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
