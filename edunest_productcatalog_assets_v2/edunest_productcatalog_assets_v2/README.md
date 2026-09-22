# EduNest Product Catalogue Assets v2

This package is a replacement asset pack for the EduNest Shop.

## What changed

- Gallery images are split into individual single-view images instead of using the original multi-panel collage as one product image.
- For uniform/backpack collages, the gallery uses individual back and side views.
- Standalone product assets remain individual images.
- Product metadata is included in `product_info.json`.
- The package is intended to work with a slider/gallery in the existing EduNest Product Details page.
- Do not hardcode these files directly into React components; use the existing ProductImage/media importer.

## Important

The original source assets contained school-logo placeholder graphics in some front-view panels. The v2 Shop gallery intentionally avoids those front-view panels where possible, so the supplied Shop gallery images do not display those placeholder logos.

The asset pack does not add an invented brand logo or AI watermark.

## Suggested Shop behavior

- Product card: show only the primary image.
- Product details: show the primary image plus the gallery in a horizontal slider/carousel.
- Do not display all gallery images simultaneously.
- Provide previous/next arrows and small thumbnails/dots.
- Preserve the existing EduNest UI.

## Integration

Replace the existing catalogue asset folder with this folder only after backing up the current one, then run the existing catalogue importer/seed. Do not reset the database.
