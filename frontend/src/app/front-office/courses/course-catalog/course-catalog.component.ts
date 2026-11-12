import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { CourseSummary, Level } from '../../courses/modules/course.model';
import { FileUrlService } from '../../services/file-url.service';
import { UserService } from '../../services/user.service';
import { User } from '../../../user';

@Component({
  selector: 'app-course-catalog',
  templateUrl: './course-catalog.component.html',
  styleUrls: ['./course-catalog.component.scss'],
})
export class CourseCatalogComponent implements OnInit {
  courses: CourseSummary[] = [];
  filteredCourses: CourseSummary[] = [];
  loading = true;
  searchTerm = '';
  selectedLevel: Level | 'ALL' = 'ALL';
  sortBy: 'newest' | 'popular' | 'price-low' | 'price-high' = 'newest';
  Currentuser: User | null = null;
  Level = Level;

  constructor(
    private courseService: CourseService,
    private fileUrlService: FileUrlService,
    private router: Router,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.Currentuser = this.userService.getUser() || null;
    this.loadCourses();
  }
  loadCourses(): void {
    this.loading = true;

    // 1. Get the trainerId (using your environment variable or a hardcoded ID)
    const trainerId = this.userService.getUser()?.id;

    if (!trainerId) {
      console.error('Trainer ID is not available');
      this.loading = false;
      return;
    }

    this.courseService.getCoursesByTrainer(trainerId).subscribe({
      next: (response: CourseSummary[]) => {
        console.log('Received courses from API:', response);
        this.courses = response;

        this.applyFilters();
        this.loading = false;
        console.log(
          `Loaded ${this.courses.length} published courses for trainer ${trainerId}`,
        );
      },
      error: (error) => {
        console.error('Error loading trainer courses:', error);
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.courses];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(term) ||
          course.description.toLowerCase().includes(term),
      );
    }

    // Filter by level
    if (this.selectedLevel !== 'ALL') {
      filtered = filtered.filter(
        (course) => course.level === this.selectedLevel,
      );
    }

    // Sort
    switch (this.sortBy) {
      case 'newest':
        // Assuming courses are already sorted by creation date
        break;
      case 'popular':
        filtered.sort(
          (a, b) => (b.enrolledStudents || 0) - (a.enrolledStudents || 0),
        );
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    this.filteredCourses = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onLevelChange(level: Level | 'ALL'): void {
    this.selectedLevel = level;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  getLevelBadgeClass(level: Level): string {
    switch (level) {
      case Level.BEGINNER:
        return 'level-beginner';
      case Level.INTERMEDIATE:
        return 'level-intermediate';
      case Level.ADVANCED:
        return 'level-advanced';
      default:
        return '';
    }
  }

  getLevelLabel(level: Level): string {
    switch (level) {
      case Level.BEGINNER:
        return 'Beginner';
      case Level.INTERMEDIATE:
        return 'Intermediate';
      case Level.ADVANCED:
        return 'Advanced';
      default:
        return level;
    }
  }

  formatDuration(minutes?: number): string {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }

  getThumbnailUrl(thumbnailUrl?: string): string {
    return this.fileUrlService.getThumbnailUrl(thumbnailUrl || '');
  }

  onImageError(event: any): void {
    // Fallback to placeholder gradient background
    event.target.style.display = 'none';
    const parent = event.target.parentElement;
    if (parent) {
      parent.classList.add('thumbnail-error');
    }
  }

  enrollInCourse(courseId: number): void {
    // Navigate to course preview page
    this.router.navigate(['/catalog', courseId]);
  }

  viewCourseDetails(courseId: number): void {
    // Navigate to course preview page
    this.router.navigate(['/catalog', courseId]);
  }

  isTrainer(): boolean {
    return this.Currentuser?.roles?.includes('TRAINER') || false;
  }


}
