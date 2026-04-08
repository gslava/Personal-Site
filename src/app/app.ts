import { Component } from '@angular/core';
import { SiteShellComponent } from './core/layout/site-shell/site-shell.component';

@Component({
  selector: 'app-root',
  imports: [SiteShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
