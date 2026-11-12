import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { FileUrlService } from '../../services/file-url.service';
import { Level, ContentType, AttachmentCategory } from '../modules/course.model';
import { UserService } from '../../services/user.service';

interface ChapterForm {
  title: string;
  description: string;
  contentBlocks: ContentBlockForm[];
  isExpanded?: boolean;
}

interface ContentBlockForm {
  type: ContentType;
  title: string;
  data: string;
  file?: File;
  filePreview?: string;
  orderIndex?: number;
}

@Component({
  selector: 'app-course-create',
  templateUrl: './course-create.component.html',
  styleUrls: ['./course-create.component.scss']
})
export class CourseCreateComponent implements OnInit {
  currentStep = 1;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  
  // Step 1: Course Info
  courseForm!: FormGroup;
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  
  // Step 2: Chapters and Content
  chapters: ChapterForm[] = [];
  
  // Step 3: Attachments
  attachments: Array<{file: File, category: AttachmentCategory, description: string, preview?: string}> = [];
  
  // Created course ID (after step 1)
  createdCourseId: number | null = null;
  
  // Pending content block creation (for file types)
  pendingContentBlockType: ContentType | null = null;
  pendingChapterIndex: number | null = null;
  
  // Pending attachment creation
  pendingAttachmentCategory: AttachmentCategory | null = null;
  
  levels = Object.values(Level);
  contentTypes = [ContentType.TEXT, ContentType.IMAGE, ContentType.VIDEO, ContentType.FILE, ContentType.PDF];
  attachmentCategories = Object.values(AttachmentCategory);
  
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private fileUrlService: FileUrlService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initCourseForm();
  }

  initCourseForm(): void {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      level: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      durationMinutes: [null, [Validators.min(1)]],
      status: ['DRAFT', Validators.required], // DRAFT or PUBLISHED
      trainerId: [1, [Validators.required]] // TODO: Get from logged-in user
    });
  }

  // ==================== STEP 1: COURSE INFO ====================
  
  onThumbnailChange(event: any): void {
    const file = event.target.files[0];
    this.errorMessage = '';

    if (file) {
      if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        this.errorMessage = 'Only JPG and PNG images are allowed for thumbnail.';
        this.resetThumbnail();
        return;
      }

      if (file.size > this.MAX_FILE_SIZE) {
        this.errorMessage = 'Thumbnail size exceeds 5MB limit.';
        this.resetThumbnail();
        return;
      }

      this.thumbnailFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.thumbnailPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  resetThumbnail(): void {
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
    const fileInput = document.getElementById('thumbnail') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  async saveStep1(): Promise<void> {
    if (this.courseForm.invalid) {
      this.markFormGroupTouched(this.courseForm);
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    // Don't create course yet, just validate and move to step 2
    this.successMessage = 'Course information saved! Now add chapters.';
    
    setTimeout(() => {
      this.successMessage = '';
      this.currentStep = 2;
    }, 500);
  }

  // ==================== STEP 2: CHAPTERS & CONTENT ====================
  
  addChapter(): void {
    this.chapters.push({
      title: '',
      description: '',
      contentBlocks: [],
      isExpanded: true
    });
  }

  toggleChapter(index: number): void {
    this.chapters[index].isExpanded = !this.chapters[index].isExpanded;
  }

  removeChapter(index: number): void {
    this.chapters.splice(index, 1);
  }

  addContentBlock(chapterIndex: number): void {
    const currentBlocks = this.chapters[chapterIndex].contentBlocks;
    this.chapters[chapterIndex].contentBlocks.push({
      type: ContentType.TEXT,
      title: '',
      data: '',
      file: undefined,
      filePreview: undefined,
      orderIndex: currentBlocks.length
    });
  }

  addContentBlockWithType(chapterIndex: number, type: ContentType): void {
    // For TEXT type, create block immediately
    if (type === ContentType.TEXT) {
      const currentBlocks = this.chapters[chapterIndex].contentBlocks;
      this.chapters[chapterIndex].contentBlocks.push({
        type: type,
        title: '',
        data: '',
        file: undefined,
        filePreview: undefined,
        orderIndex: currentBlocks.length
      });
    } else {
      // For IMAGE, VIDEO, FILE, PDF - trigger file picker first
      this.pendingContentBlockType = type;
      this.pendingChapterIndex = chapterIndex;
      
      // Trigger hidden file input
      const fileInput = document.getElementById(`file-picker-${chapterIndex}`) as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  }

  onPendingFileSelected(event: any, chapterIndex: number): void {
    const file = event.target.files[0];
    if (!file || !this.pendingContentBlockType) {
      // Reset if no file selected
      this.pendingContentBlockType = null;
      this.pendingChapterIndex = null;
      return;
    }

    // Create the content block with the selected file
    const currentBlocks = this.chapters[chapterIndex].contentBlocks;
    const newBlock: ContentBlockForm = {
      type: this.pendingContentBlockType,
      title: '',
      data: '',
      file: file,
      filePreview: undefined,
      orderIndex: currentBlocks.length
    };

    // Generate preview for images and videos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = () => {
        newBlock.filePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }

    this.chapters[chapterIndex].contentBlocks.push(newBlock);

    // Reset pending state
    this.pendingContentBlockType = null;
    this.pendingChapterIndex = null;

    // Clear the file input
    event.target.value = '';
  }

  removeContentBlock(chapterIndex: number, blockIndex: number): void {
    this.chapters[chapterIndex].contentBlocks.splice(blockIndex, 1);
    // Update order indices
    this.updateContentBlockOrder(chapterIndex);
  }

  moveContentBlockUp(chapterIndex: number, blockIndex: number): void {
    if (blockIndex === 0) return;
    const blocks = this.chapters[chapterIndex].contentBlocks;
    [blocks[blockIndex], blocks[blockIndex - 1]] = [blocks[blockIndex - 1], blocks[blockIndex]];
    this.updateContentBlockOrder(chapterIndex);
  }

  moveContentBlockDown(chapterIndex: number, blockIndex: number): void {
    const blocks = this.chapters[chapterIndex].contentBlocks;
    if (blockIndex === blocks.length - 1) return;
    [blocks[blockIndex], blocks[blockIndex + 1]] = [blocks[blockIndex + 1], blocks[blockIndex]];
    this.updateContentBlockOrder(chapterIndex);
  }

  private updateContentBlockOrder(chapterIndex: number): void {
    this.chapters[chapterIndex].contentBlocks.forEach((block, index) => {
      block.orderIndex = index;
    });
  }

  onContentFileChange(event: any, chapterIndex: number, blockIndex: number): void {
    const file = event.target.files[0];
    if (!file) return;

    const block = this.chapters[chapterIndex].contentBlocks[blockIndex];
    block.file = file;

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        block.filePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    // Generate preview for videos
    else if (file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = () => {
        block.filePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeContentFile(chapterIndex: number, blockIndex: number): void {
    const block = this.chapters[chapterIndex].contentBlocks[blockIndex];
    block.file = undefined;
    block.filePreview = undefined;
  }

  async saveStep2(): Promise<void> {
    // Validate chapters
    if (this.chapters.length === 0) {
      this.errorMessage = 'Please add at least one chapter.';
      return;
    }

    // Validate each chapter has a title and at least one content block
    for (let i = 0; i < this.chapters.length; i++) {
      const chapter = this.chapters[i];
      
      if (!chapter.title || chapter.title.trim() === '') {
        this.errorMessage = `Chapter ${i + 1} must have a title.`;
        return;
      }

      if (chapter.contentBlocks.length === 0) {
        this.errorMessage = `Chapter ${i + 1} must have at least one content block.`;
        return;
      }

      // Validate content blocks
      for (let j = 0; j < chapter.contentBlocks.length; j++) {
        const block = chapter.contentBlocks[j];
        
        if (block.type === 'TEXT') {
          if (!block.data || block.data.trim() === '') {
            this.errorMessage = `Content block ${j + 1} in chapter ${i + 1} must have text content.`;
            return;
          }
        } else {
          if (!block.file) {
            this.errorMessage = `Content block ${j + 1} in chapter ${i + 1} must have a file uploaded.`;
            return;
          }
        }
      }
    }

    this.successMessage = 'Chapters validated! Now add attachments.';
    
    setTimeout(() => {
      this.successMessage = '';
      this.currentStep = 3;
    }, 500);
  }

  // ==================== STEP 3: ATTACHMENTS ====================
  
  addAttachment(): void {
    this.attachments.push({
      file: null as any,
      category: AttachmentCategory.RESOURCES,
      description: '',
      preview: undefined
    });
  }

  addAttachmentWithCategory(category: AttachmentCategory): void {
    this.pendingAttachmentCategory = category;
    
    // Trigger hidden file input
    const fileInput = document.getElementById('attachment-file-picker') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onPendingAttachmentFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.pendingAttachmentCategory) {
      // Reset if no file selected
      this.pendingAttachmentCategory = null;
      return;
    }

    // Create the attachment with the selected file
    const newAttachment: {file: File, category: AttachmentCategory, description: string, preview?: string} = {
      file: file,
      category: this.pendingAttachmentCategory,
      description: '',
      preview: undefined
    };

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        newAttachment.preview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }

    this.attachments.push(newAttachment);

    // Reset pending state
    this.pendingAttachmentCategory = null;

    // Clear the file input
    event.target.value = '';
  }

  changeAttachmentFile(index: number): void {
    const category = this.attachments[index].category;
    
    // Remove old attachment
    this.attachments.splice(index, 1);
    
    // Trigger file picker for new file with same category
    this.pendingAttachmentCategory = category;
    const fileInput = document.getElementById('attachment-file-picker') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  removeAttachmentFile(index: number): void {
    this.attachments[index].file = null as any;
    this.attachments[index].preview = undefined;
  }

  onAttachmentFileChange(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.attachments[index].file = file;
      
      // Preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.attachments[index].preview = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  async saveStep3(): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      console.log('=== Starting course creation ===');
      
      // Step 1: Create the course
      const formData = new FormData();
      formData.append('title', this.courseForm.get('title')?.value);
      formData.append('description', this.courseForm.get('description')?.value);
      formData.append('level', this.courseForm.get('level')?.value);
      formData.append('price', this.courseForm.get('price')?.value.toString());
      formData.append('status', this.courseForm.get('status')?.value); // Add status field
      formData.append('trainerId',this.userService.getUser()?.id.toString() || '12');
      
      const durationMinutes = this.courseForm.get('durationMinutes')?.value;
      if (durationMinutes) {
        formData.append('durationMinutes', durationMinutes.toString());
      }

      if (this.thumbnailFile) {
        formData.append('thumbnail', this.thumbnailFile);
      }

      console.log('Creating course with status:', this.courseForm.get('status')?.value);
      const courseResponse = await this.courseService.createCourse(formData).toPromise();
      this.createdCourseId = courseResponse?.id || null;
      console.log('Course created with ID:', this.createdCourseId);

      if (!this.createdCourseId) {
        throw new Error('Failed to create course - no ID returned');
      }

      // Step 2: Create chapters and content blocks
      console.log('Creating', this.chapters.length, 'chapters...');
      for (let i = 0; i < this.chapters.length; i++) {
        const chapter = this.chapters[i];
        
        console.log(`Creating chapter ${i + 1}:`, chapter.title);
        
        // Create chapter
        const chapterData = {
          title: chapter.title,
          description: chapter.description,
          orderIndex: i
        };

        const createdChapter = await this.courseService.createChapter(this.createdCourseId, chapterData).toPromise();
        const chapterId = createdChapter?.id;
        console.log(`Chapter ${i + 1} created with ID:`, chapterId);

        if (!chapterId) {
          console.error('Failed to create chapter - no ID returned');
          continue;
        }

        // Create content blocks for this chapter
        console.log(`Creating ${chapter.contentBlocks.length} content blocks for chapter ${i + 1}...`);
        for (let j = 0; j < chapter.contentBlocks.length; j++) {
          const block = chapter.contentBlocks[j];
          
          console.log(`Processing content block ${j + 1} (${block.type})...`);
          let blockData = block.data;

          // For file types, upload file FIRST to get the URL
          if (block.file && block.type !== 'TEXT') {
            try {
              console.log(`Uploading file for block ${j + 1}...`);
              // Upload without contentBlockId (will go to temp folder temporarily)
              const uploadResponse = await this.fileUrlService.uploadFile(
                block.file,
                block.type as any,
                this.createdCourseId,
                chapterId,
                undefined // No contentBlockId yet
              ).toPromise();
              
              blockData = uploadResponse?.fileUrl || block.file.name;
              console.log(`File uploaded, URL:`, blockData);
            } catch (uploadErr) {
              console.error('Error uploading file:', uploadErr);
              this.errorMessage = `Failed to upload file for content block ${j + 1} in chapter ${i + 1}.`;
              this.isSubmitting = false;
              return;
            }
          }

          // Now create the content block with the file URL
          const contentBlockData = {
            type: block.type,
            title: block.title,
            data: blockData,
            orderIndex: j
          };

          console.log(`Creating content block ${j + 1}...`, contentBlockData);
          const createdBlock = await this.courseService.createContentBlock(chapterId, contentBlockData).toPromise();
          console.log(`Content block ${j + 1} created with ID:`, createdBlock?.id);
        }
      }

      // Step 3: Upload attachments
      console.log('Uploading', this.attachments.length, 'attachments...');
      for (let i = 0; i < this.attachments.length; i++) {
        const attachment = this.attachments[i];
        if (attachment.file) {
          console.log(`Uploading attachment ${i + 1} (${attachment.category})...`);
          await this.courseService.uploadAttachment(
            this.createdCourseId,
            attachment.file,
            attachment.category,
            attachment.description || ''
          ).toPromise();
          console.log(`Attachment ${i + 1} uploaded successfully`);
        }
      }

      console.log('=== Course creation completed successfully ===');
      this.successMessage = 'Course created successfully with all content!';
      this.isSubmitting = false;
      
      // Redirect to course list
      setTimeout(() => {
        this.router.navigate(['/courses']);
      }, 2000);
    } catch (err: any) {
      console.error('=== Error creating course ===');
      console.error('Error:', err);
      console.error('Error details:', err.error);
      console.error('Error message:', err.message);
      
      // Extract the actual error message from the backend
      const backendMessage = err.error?.message || err.message;
      this.errorMessage = backendMessage || 'Failed to create course. Please try again.';
      
      this.isSubmitting = false;
    }
  }

  // ==================== NAVIGATION ====================
  
  nextStep(): void {
    if (this.currentStep === 1) {
      this.saveStep1();
    } else if (this.currentStep === 2) {
      this.saveStep2();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canGoNext(): boolean {
    if (this.currentStep === 1) {
      return this.courseForm.valid;
    } else if (this.currentStep === 2) {
      // Must have at least 1 chapter
      if (this.chapters.length === 0) return false;
      
      // Each chapter must have a title and at least 1 content block
      return this.chapters.every(chapter => {
        if (!chapter.title || chapter.title.trim() === '') return false;
        if (chapter.contentBlocks.length === 0) return false;
        
        // Each content block must have data or file
        return chapter.contentBlocks.every(block => {
          if (block.type === 'TEXT') {
            return block.data && block.data.trim() !== '';
          } else {
            return !!block.file;
          }
        });
      });
    }
    return true;
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
      this.router.navigate(['/courses']);
    }
  }

  // ==================== HELPERS ====================
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.courseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.courseForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
    }
    return '';
  }

  getContentTypeIcon(type: ContentType): string {
    const icons: { [key in ContentType]: string } = {
      [ContentType.TEXT]: '📝',
      [ContentType.IMAGE]: '🖼️',
      [ContentType.VIDEO]: '🎥',
      [ContentType.FILE]: '📁',
      [ContentType.PDF]: '📄',
      [ContentType.QUIZ]: '❓',
      [ContentType.ASSIGNMENT]: '📋'
    };
    return icons[type] || '📄';
  }

  getLevelIcon(level: Level): string {
    const icons: { [key in Level]: string } = {
      [Level.BEGINNER]: '🌱',
      [Level.INTERMEDIATE]: '🚀',
      [Level.ADVANCED]: '⭐'
    };
    return icons[level] || '📚';
  }

  getCategoryIcon(category: AttachmentCategory): string {
    const icons: { [key in AttachmentCategory]: string } = {
      [AttachmentCategory.SYLLABUS]: '📋',
      [AttachmentCategory.PREREQUISITES]: '📌',
      [AttachmentCategory.RESOURCES]: '📚'
    };
    return icons[category] || '📎';
  }
}
