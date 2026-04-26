import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-logo-with-hover',
  imports: [],
  templateUrl: './logo-with-hover.html',
  styleUrl: './logo-with-hover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoWithHover {

  fromAdmin = input<boolean>(false);

  protected readonly router = inject(Router);

  navigate(): void {
    this.router.navigateByUrl(this.fromAdmin() ? '/admin' : '/');
  }

}
