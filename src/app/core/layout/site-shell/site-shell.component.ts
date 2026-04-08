import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-site-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './site-shell.component.html',
  styleUrl: './site-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteShellComponent {
  protected readonly localeService = inject(LocaleService);
}
