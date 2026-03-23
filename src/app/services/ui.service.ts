import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  //// THEME 
  private readonly themeSubject = new BehaviorSubject<string>('light');
  public theme: Observable<string> = this.themeSubject.asObservable();

  private readonly menuCollapsedSubject = new BehaviorSubject<boolean>(false);
  public menuCollapsed: Observable<boolean> = this.menuCollapsedSubject.asObservable();

  constructor() {
    this.theme.subscribe((theme) => {
      document.body.setAttribute('cds-theme', theme);
    });
  }

  //// SET THEME 
  public setTheme(theme: string) {
    this.themeSubject.next(theme);
  }

  public setMenuCollapsed(collapsed: boolean) {
    this.menuCollapsedSubject.next(collapsed);
  }


  //// SCROLLABLE STICKERS 
  addScrollingCapability(step: number, wrapper: string): void {

    const leftArrow = document.querySelector(wrapper + " .left-arrow cds-icon");
    const rightArrow = document.querySelector(wrapper + " .right-arrow cds-icon");
    const stickersArea = document.querySelector(wrapper + " .stickers-area");

    const rightArrowContainer = document.querySelector(wrapper + " .right-arrow");
    const leftArrowContainer = document.querySelector(wrapper + " .left-arrow");

    rightArrow?.addEventListener("click", () => {
      stickersArea!.scrollLeft += step;
      manageIcons();
    });

    leftArrow?.addEventListener("click", () => {
      stickersArea!.scrollLeft -= step;
      manageIcons();
    });

    stickersArea?.addEventListener("scroll", () => manageIcons());

    let dragging = false;
    stickersArea?.addEventListener("mousedown", () => {
      dragging = true;
    });
    document.addEventListener("mouseup", () => {
      dragging = false;
      stickersArea!.classList.remove("dragging");
    })

    const drag = (e: any) => {
      if (!dragging) return;
      stickersArea!.classList.add("dragging");
      stickersArea!.scrollLeft -= e.movementX;
    }
    stickersArea?.addEventListener("mousemove", ($event) => drag($event))

    const manageIcons = () => {

      if (stickersArea!.scrollLeft > 0) {
        leftArrowContainer?.classList.add("active");
      } else {
        leftArrowContainer?.classList.remove("active");
      }

      let maxScrollValue = stickersArea!.scrollWidth - stickersArea!.clientWidth;

      if (stickersArea!.scrollLeft >= maxScrollValue) {
        rightArrowContainer?.classList.remove("active");
      } else {
        rightArrowContainer?.classList.add("active");
      }
    }

    manageIcons();
  }


  //// LOCATION 
  private _location = new BehaviorSubject({ menu: '', subMenu: '' });
  location = this._location.asObservable();
  setLocation(location: { menu: string, subMenu: string }) {
    this._location.next(location);
  }


}
