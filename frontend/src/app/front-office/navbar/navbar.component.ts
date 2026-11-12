import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';
import { UserService } from '../services/user.service';
import { User } from '../../user';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  showSessionDropdown = false;

  user: User | null = null;
  avatarUrl: string = 'images/avatar.jpg';
  constructor(
    private router: Router,
    private keycloakService: KeycloakService,
    private userService: UserService
  ) {}

 async ngOnInit(): Promise<void> {
  const loadedUser = await this.userService.loadUser();
  this.user = loadedUser ?? null; // Converts undefined to null

  if (!this.user) {
    this.router.navigate(['/login']);
  }
}
  isSessionRouteActive(): boolean {
    const url = this.router.url;
    return url.includes('/sessions') || url.includes('/planning');
  }

  handleAvatarError(event: any): void {
    event.target.style.display = 'none';
  }

  logout() {

   this.keycloakService.logout();
  // Optionally clear local state
  localStorage.clear();
  console.log('User logged out from app');
  }
}
