export interface GalleryImageItem {
  id: string;
  title: string;
  category: 'hair' | 'beard' | 'interior' | 'spa';
  subtitle: string;
  imageUrl: string;
  aspectClass: 'normal' | 'tall';
}

export interface WebsiteMediaConfig {
  heroImageUrl: string;
  heroImageAlt: string;
  aboutImageUrl: string;
  aboutImageAlt: string;
  galleryItems: GalleryImageItem[];
}
