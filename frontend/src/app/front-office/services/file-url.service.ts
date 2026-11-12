// src/app/front-office/services/file-url.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../front-office/environment/envirement';

export interface UploadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  coursId?: number;
  chapitreId?: number;
  type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FileUrlService {
  private gatewayUrl = environment.apiGatewayUrl; // http://localhost:8082
  private uploadBasePath = environment.uploadBasePath; // /api/files

  constructor(private http: HttpClient) {}

  /**
   * Upload a file (requires coursId and chapitreId, optional contentBlockId)
   */
  uploadFile(
    file: File,
    type: string,
    coursId: number,
    chapitreId: number,
    contentBlockId?: number,
  ): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('coursId', coursId.toString());
    formData.append('chapitreId', chapitreId.toString());

    // Add contentBlockId if provided
    if (contentBlockId !== undefined && contentBlockId !== null) {
      formData.append('contentBlockId', contentBlockId.toString());
    }

    // URL: http://localhost:8082/api/files/content
    const url = `${this.gatewayUrl}${this.uploadBasePath}/content`;
    console.log('Uploading to:', url, 'with contentBlockId:', contentBlockId);
    return this.http.post<UploadResponse>(url, formData);
  }

  /**
   * Get thumbnail URL - handles both absolute paths and filenames
   * Backend returns just the filename (e.g., "1234567890_image.jpg")
   */
  getThumbnailUrl(filename: string): string {
    if (!filename) return 'assets/images/default-course.jpg';
    if (filename.startsWith('http')) return filename;

    // If it starts with /api, it's already a complete path from backend
    if (filename.startsWith('/api')) {
      return `${this.gatewayUrl}${filename}`;
    }

    // If it's an absolute file path (from backend), extract just the filename
    if (filename.includes('\\') || filename.includes('/')) {
      const parts = filename.split(/[\\\/]/);
      filename = parts[parts.length - 1];
    }

    // Return the file URL through the gateway
    return `${this.gatewayUrl}${this.uploadBasePath}/thumbnails/${filename}`;
  }

  /**
   * Get image URL
   */
  getImageUrl(filename: string): string {
    if (!filename) return '';
    if (filename.startsWith('http')) return filename;

    if (filename.includes('\\') || filename.includes('/')) {
      const parts = filename.split(/[\\\/]/);
      filename = parts[parts.length - 1];
    }

    return `${this.gatewayUrl}${this.uploadBasePath}/images/${filename}`;
  }

  /**
   * Get video URL
   */
  getVideoUrl(filename: string): string {
    if (!filename) return '';
    if (filename.startsWith('http')) return filename;

    if (filename.includes('\\') || filename.includes('/')) {
      const parts = filename.split(/[\\\/]/);
      filename = parts[parts.length - 1];
    }

    return `${this.gatewayUrl}${this.uploadBasePath}/videos/${filename}`;
  }

  /**
   * Get PDF URL
   */
  getPdfUrl(filename: string): string {
    if (!filename) return '';
    if (filename.startsWith('http')) return filename;

    if (filename.includes('\\') || filename.includes('/')) {
      const parts = filename.split(/[\\\/]/);
      filename = parts[parts.length - 1];
    }

    return `${this.gatewayUrl}${this.uploadBasePath}/pdfs/${filename}`;
  }

  /**
   * Get content URL for any subfolder
   */
  getContentUrl(subfolder: string, filename: string): string {
    if (!filename) return '';
    if (filename.startsWith('http')) return filename;

    if (filename.includes('\\') || filename.includes('/')) {
      const parts = filename.split(/[\\\/]/);
      filename = parts[parts.length - 1];
    }

    return `${this.gatewayUrl}${this.uploadBasePath}/${subfolder}/${filename}`;
  }

  /**
   * Get file URL from various formats - handles backend file paths
   */
  getFileUrl(filePath: string): string {
    if (!filePath) return '';

    // Already a complete URL
    if (filePath.startsWith('http')) return filePath;

    // Already starts with /api/courses/uploads - prepend gateway URL
    if (filePath.startsWith('/api/courses/uploads')) {
      return `${this.gatewayUrl}${filePath}`;
    }

    // If it's an absolute file path from backend (C:\uploads\...), extract filename
    if (filePath.includes('\\') || filePath.match(/^[A-Z]:/)) {
      const parts = filePath.split(/[\\\/]/);
      const filename = parts[parts.length - 1];
      // Try to determine the type from the path
      if (filePath.includes('thumbnail')) {
        return this.getThumbnailUrl(filename);
      }
      return `${this.gatewayUrl}/api/courses/uploads/content/${filename}`;
    }

    // If path starts with /api/files (legacy gateway route)
    if (filePath.startsWith('/api/files')) {
      return `${this.gatewayUrl}${filePath}`;
    }

    // If path starts with /uploads (legacy)
    if (filePath.startsWith('/uploads')) {
      const filename = filePath.split('/').pop();
      return `${this.gatewayUrl}/api/courses/uploads/content/${filename}`;
    }

    // Default: treat as filename
    return `${this.gatewayUrl}/api/courses/uploads/content/${filePath}`;
  }

  /**
   * Get URL for a file with course/chapter/content_block structure
   * This matches the backend file organization
   */
  getContentBlockFileUrl(
    coursId: number,
    chapitreId: number,
    contentBlockId: number,
    type: string,
    filename: string,
  ): string {
    if (!filename) return '';

    // If already a complete URL
    if (filename.startsWith('http')) return filename;

    // If it starts with /api, prepend gateway URL
    if (filename.startsWith('/api')) {
      return `${this.gatewayUrl}${filename}`;
    }

    // Extract just the filename if it's a full path
    if (filename.includes('\\') || filename.includes('/')) {
      const parts = filename.split(/[\\\/]/);
      filename = parts[parts.length - 1];
    }

    const typeFolder = this.mapTypeToFolder(type);
    // URL format: /api/files/cours_{id}/chapitre_{id}/content_block_{id}/{type}/{filename}
    return `${this.gatewayUrl}${this.uploadBasePath}/cours_${coursId}/chapitre_${chapitreId}/content_block_${contentBlockId}/${typeFolder}/${filename}`;
  }

  /**
   * Get URL for a file with course/chapter structure
   */
  getCourseFileUrl(
    coursId: number,
    chapitreId: number,
    type: string,
    filename: string,
  ): string {
    if (!filename) return 'assets/images/default-course.jpg';

    // If already a complete URL
    if (filename.startsWith('http')) return filename;

    // If it starts with /api, prepend gateway URL
    if (filename.startsWith('/api')) {
      return `${this.gatewayUrl}${filename}`;
    }

    // Extract just the filename if it's a full path
    if (filename.includes('\\') || filename.includes('/')) {
      const parts = filename.split(/[\\\/]/);
      filename = parts[parts.length - 1];
    }

    const typeFolder = this.mapTypeToFolder(type);
    return `${this.gatewayUrl}${this.uploadBasePath}/${typeFolder}/${filename}`;
  }

  /**
   * Helper method to map type to folder
   */
  private mapTypeToFolder(type: string): string {
    switch (type?.toUpperCase()) {
      case 'IMAGE':
        return 'images';
      case 'VIDEO':
        return 'videos';
      case 'PDF':
        return 'pdfs';
      case 'FILE':
        return 'files';
      default:
        return 'content';
    }
  }
}
