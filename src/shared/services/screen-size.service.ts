import {inject, Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';

export type ScreenSize = 'handset' | 'tablet' | 'desktop';

@Injectable({
  providedIn: 'root'
})
export class ScreenSizeService {

  private breakpointObserver = inject(BreakpointObserver);

  screenSize$: Observable<ScreenSize>;

  constructor() {
    this.screenSize$ = this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
        Breakpoints.Handset,
        Breakpoints.Tablet,
        Breakpoints.Web,
      ])
      .pipe(map(result => {
        if (result.breakpoints[Breakpoints.XSmall]) {
          return 'handset';
        } else if (result.breakpoints[Breakpoints.Small]) {
          return 'tablet';
        } else if (result.breakpoints[Breakpoints.Medium]) {
          return 'desktop'
        } else if (result.breakpoints[Breakpoints.Large]) {
          return 'desktop';
        } else if (result.breakpoints[Breakpoints.XLarge]) {
          return 'desktop';
        }
        return 'desktop';
      }));
  }
}
