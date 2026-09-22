import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATALOGUE_PRODUCTS = [
  { sku: 'EDU-UNI-001', folders: ['polo_t-shirt'], name: 'Student T-Shirt' },
  { sku: 'EDU-UNI-002', folders: ['student_half_pant', 'student_skirt'], name: 'Student Lower (Pant / Skirt)' },
  { sku: 'EDU-UNI-003', folders: ['pt_track_pants'], name: 'Student Track Pant' },
  { sku: 'EDU-UNI-004', folders: ['hooded_jacket'], name: 'Student Hooded Jacket' },
  { sku: 'EDU-ACC-001', folders: ['school_backpack'], name: 'School Bag' },
  { sku: 'EDU-ACC-002', folders: ['striped_school_socks'], name: 'School Socks' },
];

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function catalogueRoot(): string {
  return path.resolve(
    process.env.CATALOGUE_ASSET_ROOT ?? path.join(process.cwd(), '..', 'edunest_productcatalogue_assets', 'edunest_productcatalogue_assets'),
  );
}

function uploadRoot(): string {
  return path.resolve(process.env.UPLOAD_ROOT ?? path.join(process.cwd(), 'uploads'));
}

export async function importCatalogueImages(): Promise<{ products: number; images: number }> {
  const sourceRoot = catalogueRoot();
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`Catalogue asset directory not found: ${sourceRoot}`);
  }

  let importedProducts = 0;
  let importedImages = 0;

  for (const definition of CATALOGUE_PRODUCTS) {
    const product = await prisma.product.findUnique({ where: { sku: definition.sku } });
    if (!product) continue;
    importedProducts += 1;

    let displayOrder = 0;
    for (const folder of definition.folders) {
      const sourceFolder = path.join(sourceRoot, folder);
      if (!fs.existsSync(sourceFolder)) continue;

      const files = fs
        .readdirSync(sourceFolder)
        .filter((fileName) => imageExtensions.has(path.extname(fileName).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      for (const fileName of files) {
        const sourcePath = path.join(sourceFolder, fileName);
        const relativePath = path.join('catalogue', folder, fileName);
        const destinationPath = path.join(uploadRoot(), relativePath);
        fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
        if (!fs.existsSync(destinationPath)) fs.copyFileSync(sourcePath, destinationPath);

        const filePath = `/uploads/${relativePath.replaceAll(path.sep, '/')}`;
        const stats = fs.statSync(destinationPath);
        const uploadedFile = await prisma.uploadedFile.findFirst({ where: { filePath, deletedAt: null } });
        const file =
          uploadedFile ??
          (await prisma.uploadedFile.create({
            data: {
              fileName,
              filePath,
              mimeType: 'image/jpeg',
              fileSizeBytes: BigInt(stats.size),
              storageProvider: 'local',
            },
          }));

        const existingImage = await prisma.productImage.findFirst({
          where: { productId: product.id, fileId: file.id },
        });
        if (!existingImage) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              fileId: file.id,
              altText: definition.name,
              displayOrder,
              isPrimary: displayOrder === 0,
            },
          });
          importedImages += 1;
        }
        displayOrder += 1;
      }
    }
  }

  return { products: importedProducts, images: importedImages };
}

if (require.main === module) {
  importCatalogueImages()
    .then((result) => console.log(`Catalogue import complete: ${result.products} products, ${result.images} new images`))
    .catch((error) => {
      console.error('Catalogue import failed:', error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
