import { TestBed } from '@angular/core/testing';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default curated gallery items and banners', () => {
    expect(service.galleryItems().length).toBeGreaterThanOrEqual(6);
    expect(service.config().heroImageUrl).toBeTruthy();
    expect(service.config().aboutImageUrl).toBeTruthy();
  });

  it('should update hero banner and persist', () => {
    const newUrl = 'https://example.com/new-hero.jpg';
    const newAlt = 'New Hero Alt';
    service.updateHeroBanner(newUrl, newAlt);

    expect(service.config().heroImageUrl).toBe(newUrl);
    expect(service.config().heroImageAlt).toBe(newAlt);
  });

  it('should add, update, and delete gallery items', () => {
    const initialCount = service.galleryItems().length;

    service.addGalleryItem({
      title: 'Precision Beard Sculpt',
      category: 'beard',
      subtitle: 'Sharp razor lines',
      imageUrl: 'https://example.com/beard.jpg',
      aspectClass: 'normal'
    });

    expect(service.galleryItems().length).toBe(initialCount + 1);
    const added = service.galleryItems()[0];
    expect(added.title).toBe('Precision Beard Sculpt');

    service.updateGalleryItem({
      ...added,
      title: 'Updated Beard Sculpt'
    });
    expect(service.galleryItems()[0].title).toBe('Updated Beard Sculpt');

    service.deleteGalleryItem(added.id);
    expect(service.galleryItems().length).toBe(initialCount);
  });
});
