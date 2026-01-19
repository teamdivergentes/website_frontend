import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-sponsor',
    imports: [],
    templateUrl: './sponsors.html',
    styleUrls: ['./sponsors.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SponsorComponent {
    
}