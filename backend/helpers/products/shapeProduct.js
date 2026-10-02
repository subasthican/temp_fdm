// Shapes a product document into the standard API response object, so
// every product response (list, detail, create, update) looks identical.
export const shapeProduct = (product) => ({
  id: product._id,
  name: product.name,
  sku: product.sku,
  barcodes: product.barcodes,
  category: product.categoryId
    ? { id: product.categoryId._id, name: product.categoryId.name }
    : null,
  brand: product.brandId
    ? { id: product.brandId._id, name: product.brandId.name }
    : null,
  taxClass: product.taxClassId
    ? {
        id: product.taxClassId._id,
        name: product.taxClassId.name,
        rate: product.taxClassId.rate,
      }
    : null,
  imageUrl: product.imageUrl,
  sellType: product.sellType,
  pricingMode: product.pricingMode,
  baseUnit: product.baseUnit,
  isAgeRestricted: product.isAgeRestricted,
  isActive: product.isActive,
});

export default shapeProduct;
