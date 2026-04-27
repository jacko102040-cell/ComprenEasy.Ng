import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-content-home-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './content-home-page.component.html',
  styleUrl: './content-home-page.component.css'
})
export class ContentHomePageComponent {}
