import { Component, OnInit, AfterViewInit, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Event } from '../models/event.model';
import { EventService } from '../services/event.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParticipationService } from '../services/participation.service';
import { Participant } from '../models/participant.model';

@Component({
    selector: 'app-event-details',
    templateUrl: './event-details.component.html',
    styleUrls: ['./event-details.component.scss']
})
export class EventDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
    event: Event | null = null;
    loading = true;
    private map: any = null;
    private countdownIntervalId: any = null;
    // Participation UI state
    showParticipation = false;
    participationForm: FormGroup;
    participants: Participant[] = [];
    submitting = false;
    apiMessage: string | null = null;
    apiError: string | null = null;
    lastParticipation: { name: string; email: string } | null = null;
    countdownText: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private eventService: EventService,
        private fb: FormBuilder,
        private participationService: ParticipationService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.participationForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) {
            // Avoid long-running HTTP calls during SSR which can keep the app unstable and hit the 30s render timeout.
            this.loading = false;
            return;
        }
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.loadEvent(id);
        }
    }

    ngOnDestroy(): void {
        if (this.countdownIntervalId) {
            clearInterval(this.countdownIntervalId);
            this.countdownIntervalId = null;
        }
        if (isPlatformBrowser(this.platformId)) {
            document.body.style.overflow = '';
        }
    }

    ngAfterViewInit(): void {
        // Map will be initialized after event is loaded
    }

    loadEvent(id: number): void {
        this.loading = true;
        this.eventService.getEventById(id).subscribe({
            next: (event) => {
                this.event = event;
                this.loading = false;
                this.startCountdown();
                // Initialize map after event is loaded
                if (isPlatformBrowser(this.platformId)) {
                    setTimeout(() => this.initMap(), 100);
                }
            },
            error: (error) => {
                console.error('Error loading event:', error);
                this.loading = false;
                this.router.navigate(['/events']);
            }
        });
    }

    private startCountdown(): void {
        if (!this.event) return;
        if (this.countdownIntervalId) {
            clearInterval(this.countdownIntervalId);
            this.countdownIntervalId = null;
        }

        const update = () => {
            if (!this.event) return;
            const eventTime = new Date(this.event.date).getTime();
            const now = Date.now();
            const diff = eventTime - now;

            if (isNaN(eventTime)) {
                this.countdownText = '';
                return;
            }

            if (diff <= 0) {
                this.countdownText = 'Event started';
                return;
            }

            const totalSeconds = Math.floor(diff / 1000);
            const days = Math.floor(totalSeconds / (24 * 3600));
            const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            const pad = (v: number) => v.toString().padStart(2, '0');
            if (days > 0) {
                this.countdownText = `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            } else {
                this.countdownText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            }
        };

        // Always compute once (SSR + browser)
        update();

        // Only keep live timers in the browser; SSR must stay stable and finish rendering.
        if (isPlatformBrowser(this.platformId)) {
            this.countdownIntervalId = setInterval(update, 1000);
        }
    }

    loadParticipants(id: number): void {
        this.participationService.getParticipants(id).subscribe({
            next: (list) => this.participants = list,
            error: (err) => console.error('Failed to load participants', err)
        });
    }

    toggleParticipation(): void {
        this.showParticipation = !this.showParticipation;
        this.apiMessage = null;
        this.apiError = null;
        if (isPlatformBrowser(this.platformId)) {
            document.body.style.overflow = this.showParticipation ? 'hidden' : '';
        }
    }

    submitParticipation(): void {
        if (!this.event?.id || this.participationForm.invalid) {
            this.participationForm.markAllAsTouched();
            return;
        }
        this.submitting = true;
        this.apiMessage = null;
        this.apiError = null;
        this.participationService.addParticipant(this.event.id, this.participationForm.value).subscribe({
            next: (p) => {
                this.apiMessage = 'Participation registered successfully.';
                this.lastParticipation = {
                    name: this.participationForm.value?.name,
                    email: this.participationForm.value?.email
                };
                this.participationForm.reset();
                this.submitting = false;
            },
            error: (err) => {
                this.apiError = err?.error?.message || 'Failed to participate. Please try again.';
                this.submitting = false;
            }
        });
    }

    async downloadParticipationPdf(): Promise<void> {
        if (!isPlatformBrowser(this.platformId)) return;
        if (!this.event || !this.lastParticipation) return;

        const [{ jsPDF }, QRCode] = await Promise.all([
            import('jspdf'),
            import('qrcode')
        ]);

        const qrText = [
            'Participation Confirmation',
            `Name: ${this.lastParticipation.name}`,
            `Email: ${this.lastParticipation.email}`,
            `Event: ${this.event.name}`,
            `Event ID: ${this.event.id}`,
            `Date: ${this.formatDate(this.event.date)}`,
            `Location: ${this.event.location}`,
        ].join('\n');
        const qrDataUrl = await (QRCode as any).toDataURL(qrText, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 240
        });

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Participation Confirmation', 40, 60);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        const lines: string[] = [
            `Event: ${this.event.name}`,
            `Date: ${this.formatDate(this.event.date)}`,
            `Location: ${this.event.location}`,
            `Name: ${this.lastParticipation.name}`,
            `Email: ${this.lastParticipation.email}`,
        ];

        let y = 100;
        for (const line of lines) {
            doc.text(line, 40, y);
            y += 18;
        }

        doc.setDrawColor(200);
        doc.line(40, y + 10, pageWidth - 40, y + 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('QR Code', 40, y + 40);

        const qrSize = 170;
        const qrX = 40;
        const qrY = y + 55;
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Participant: ${this.lastParticipation.name}`, 40, qrY + qrSize + 18);
        doc.text('Scan to view participation details.', 40, qrY + qrSize + 34);

        const safeName = (this.event.name || 'event').replace(/[^a-z0-9]+/gi, '_');
        doc.save(`participation_${safeName}_${this.event.id}.pdf`);
    }

    removeParticipant(participant: Participant): void {
        if (!this.event?.id) return;
        this.participationService.removeParticipant(this.event.id, participant.id).subscribe({
            next: () => {
                this.participants = this.participants.filter(p => p.id !== participant.id);
            },
            error: (err) => {
                this.apiError = err?.error?.message || 'Failed to remove participant.';
            }
        });
    }

    async initMap(): Promise<void> {
        if (!this.event || this.map || !isPlatformBrowser(this.platformId)) return;

        const el = document.getElementById('map');
        if (!el) {
            setTimeout(() => this.initMap(), 100);
            return;
        }

        const L = await import('leaflet');

        // Fix default marker icons when bundling with Angular (use CDN so no assets are required)
        const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
        const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
        const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
        (L as any).Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

        const lat = this.event.latitude || 36.8065;
        const lng = this.event.longitude || 10.1815;

        this.map = L.map(el, {
            scrollWheelZoom: false,
            dragging: false,
            doubleClickZoom: false,
            touchZoom: false,
            boxZoom: false,
            keyboard: false,
            zoomControl: false
        }).setView([lat, lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        L.marker([lat, lng], { draggable: false }).addTo(this.map);

        setTimeout(() => this.map?.invalidateSize?.(), 0);
    }

    editEvent(): void {
        if (this.event?.id) {
            this.router.navigate(['/events', this.event.id, 'edit']);
        }
    }

    deleteEvent(): void {
        if (this.event?.id && confirm('Are you sure you want to delete this event?')) {
            this.eventService.deleteEvent(this.event.id).subscribe({
                next: () => {
                    this.router.navigate(['/events']);
                },
                error: (error) => {
                    console.error('Error deleting event:', error);
                }
            });
        }
    }

    goBack(): void {
        this.router.navigate(['/events']);
    }

    formatDate(date: Date): string {
        const eventDate = new Date(date);
        return eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
