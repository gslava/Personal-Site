import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PortfolioPageComponent } from '../../../portfolio/portfolio-page.component';
@Component({
  selector: 'app-home-page',
  imports: [PortfolioPageComponent],
  template: '<app-portfolio-page />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {}
