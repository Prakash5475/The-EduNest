import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATALOGUE_PRODUCTS = [
  { sku: 'EDU-UNI-001', slugs: ['polo-t-shirt'] },
  { sku: 'EDU-UNI-002', slugs: ['student-half-pant', 'student-skirt'] },
  { sku: 'EDU-UNI-003', slugs: ['pt-track-pants'] },
  { sku: 'EDU-UNI-004', slugs: ['hooded-jacket'] },
  { sku: 'EDU-ACC-001', slugs: ['school-backpack'] },
  { sku: 'EDU-ACC-002', slugs: ['striped-school-socks'] },
];

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

interface CatalogueManifestProduct {
  slug: string;
  image_folder: string;
  primary_image: string;
}

interface CatalogueInfoProduct extends CatalogueManifestProduct {
  gallery_images: string[];
}

interface ProductImageRecord {
  fileId: bigint;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
}

function catalogueRoot(): string {
  return path.resolve(
    process.env.CATALOGUE_ASSET_ROOT ?? path.join(process.cwd(), '..', 'edunest_productcatalog_assets_v2', 'edunest_productcatalog_assets_v2'),
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

  const manifestPath = path.join(sourceRoot, 'catalogue_manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { products: CatalogueManifestProduct[] };
  const productInfoPath = path.join(sourceRoot, 'product_info.json');
  const productInfo = JSON.parse(fs.readFileSync(productInfoPath, 'utf8')) as { products: CatalogueInfoProduct[] };
  const manifestBySlug = new Map(manifest.products.map((product) => [product.slug, product]));
  const infoBySlug = new Map(productInfo.products.map((product) => [product.slug, product]));

  let importedProducts = 0;
  let importedImages = 0;

  for (const definition of CATALOGUE_PRODUCTS) {
    const product = await prisma.product.findUnique({ where: { sku: definition.sku } });
    if (!product) continue;
    importedProducts += 1;

    const catalogueProducts = definition.slugs
      .map((slug) => ({ manifest: manifestBySlug.get(slug), info: infoBySlug.get(slug) }))
      .filter((entry): entry is { manifest: CatalogueManifestProduct; info: CatalogueInfoProduct } => Boolean(entry.manifest && entry.info));
    const imageRecords: ProductImageRecord[] = [];
    for (const { manifest: manifestProduct, info: infoProduct } of catalogueProducts) {
      const sourceFolder = path.join(sourceRoot, manifestProduct.image_folder);
      const imageNames = [infoProduct.primary_image, ...infoProduct.gallery_images.filter((name) => name !== infoProduct.primary_image)];
      for (const fileName of imageNames) {
        if (!imageExtensions.has(path.extname(fileName).toLowerCase())) continue;
        const sourcePath = path.join(sourceFolder, fileName);
        if (!fs.existsSync(sourcePath)) throw new Error(`Catalogue image not found: ${sourcePath}`);
        const relativePath = path.join('catalogue-v2', manifestProduct.image_folder, fileName);
        const destinationPath = path.join(uploadRoot(), relativePath);
        fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
        if (!fs.existsSync(destinationPath)) fs.copyFileSync(sourcePath, destinationPath);

        const filePath = `/uploads/${relativePath.replaceAll(path.sep, '/')}`;
        const stats = fs.statSync(destinationPath);
        const uploadedFile = await prisma.uploadedFile.findFirst({ where: { filePath, deletedAt: null } });
        const file = uploadedFile ?? (await prisma.uploadedFile.create({
          data: { fileName, filePath, mimeType: 'image/jpeg', fileSizeBytes: BigInt(stats.size), storageProvider: 'local' },
        }));
        imageRecords.push({ fileId: file.id, altText: product.name, displayOrder: imageRecords.length, isPrimary: imageRecords.length === 0 });
      }
    }
    await prisma.$transaction(async (transaction) => {
      const fileIds = imageRecords.map((image) => image.fileId);
      await transaction.productImage.deleteMany({ where: { productId: product.id, fileId: { notIn: fileIds } } });
      for (const image of imageRecords) {
        const existing = await transaction.productImage.findFirst({ where: { productId: product.id, fileId: image.fileId } });
        if (existing) {
          await transaction.productImage.update({ where: { id: existing.id }, data: image });
        } else {
          await transaction.productImage.create({ data: { ...image, productId: product.id } });
        }
      }
    });
    importedImages += imageRecords.length;
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
