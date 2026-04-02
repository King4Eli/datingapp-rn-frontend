import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { _http_request, cacheStorage, hostServer, parseCategoryProducts } from '../funcs/functions';
import { Loaderx } from '../funcs/functions_stateful';
import { namer } from '../funcs/static';

const formatPrice = (price: number): string => price?.toFixed(2) ?? '0.00';

export const Screen_PurchaseConsumable = ({ route, navigation }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const requestedCategory = route?.params?.productcategory?.trim();
  const productCategory = (!requestedCategory || requestedCategory === namer.productCategoryName.mainsub)
    ? namer.productCategoryName.superlike
    : requestedCategory;

  // Load products
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rawProducts = await cacheStorage.getProducts();
        const parsed = await parseCategoryProducts(rawProducts, productCategory);
        const productList = Array.isArray(parsed)
          ? parsed
          : parsed?.products && Array.isArray(parsed.products)
            ? parsed.products
            : [];

        if (mounted) {
          setProducts(productList);
          const initial = productList[0] ?? null;
          setSelectedProduct(initial);
          setSelectedVariantId(initial?.variants?.[0]?.id ?? null);
        }
      } catch (error) {
        if (mounted) setProducts([]);
      }
    })();
    return () => { mounted = false; };
  }, [productCategory]);

  const handlePurchase = () => {
    if (!selectedProduct) return;

    const selectedVariant = selectedProduct.variants?.find((v: any) => v.id === selectedVariantId) || selectedProduct.variants?.[0] || null;
    const variantId = selectedVariant?.id || null;

    Loaderx.show();
    _http_request({
      customApiUrl: `${hostServer()}/api/secure/gateway/purchase`,
      reqType: 'POST',
      bodyArray: {
        sku: selectedProduct.sku,
        ot_duration: variantId,
        quantity: 1,
      }
    }).then((res: any) => {
      Loaderx.hide();
      if (res?.code === 301 && res?.type === "external" && res?.url) {
        Linking.openURL(res.url);
        setShowConfirm(false);
      } else {
        Alert.alert('Error', res?.message || 'Purchase failed. Please try again.');
      }
    });
  };

  const VariantItem = ({ variant, product, isSelected, onSelect }: any) => {
    const price = variant?.price || 0;
    const cycle = variant?.metadata?.cycle || variant?.name || 'One-time';
    const discount = variant?.metadata?.discount;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onSelect(variant.id)}
        style={[
          styles.variantItem,
          isSelected && styles.variantItemSelected
        ]}
      >
        <View style={styles.variantContent}>
          <View style={styles.variantInfo}>
            <Text style={[styles.variantCycle, isSelected && styles.variantCycleSelected]}>
              {cycle}
            </Text>
            {discount && (
              <View style={styles.discountBadgeSmall}>
                <Text style={styles.discountTextSmall}>{discount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.variantPrice, isSelected && styles.variantPriceSelected]}>
            ${formatPrice(price)}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Icon name="checkmark-circle" size={24} color="#8B5CF6" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ProductSection = ({ product, index }: { product: any; index: number }) => {
    const isSelected = selectedProduct?.sku === product.sku;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const features = product?.description?.features?.filter((f: any) => f?.d?.trim()) || [];

    return (
      <View style={styles.productSection}>
        {/* Product Header */}
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.name.toUpperCase()}</Text>
          {features.length > 0 && (
            <View style={styles.featureIcons}>
              {features.slice(0, 2).map((_: any, idx: React.Key | null | undefined) => (
                <Icon key={idx} name="star" size={14} color="#8B5CF6" />
              ))}
            </View>
          )}
        </View>

        {/* Features List */}
        {features.length > 0 && (
          <View style={styles.featuresList}>
            {features.map((feature: any, idx: number) => (
              <View key={idx} style={styles.featureItem}>
                <Icon name="checkmark-circle" size={14} color="#8B5CF6" />
                <Text style={styles.featureText}>{feature.d}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Variants Vertical List */}
        <View style={styles.variantsList}>
          {variants.map((variant: any) => (
            <VariantItem
              key={variant.id}
              variant={variant}
              product={product}
              isSelected={selectedProduct?.sku === product.sku && selectedVariantId === variant.id}
              onSelect={(variantId: number) => {
                setSelectedProduct(product);
                setSelectedVariantId(variantId);
                setShowConfirm(true);
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#14141F']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="flash" size={40} color="#8B5CF6" />
          <Text style={styles.title}>Super Likes</Text>
          <Text style={styles.subtitle}>Get noticed instantly</Text>
        </View>

        {/* Products - Vertical List */}
        <View style={styles.productsContainer}>
          {products.map((product, idx) => (
            <ProductSection key={product.sku} product={product} index={idx} />
          ))}
        </View>

        <Text style={styles.disclaimer}>
          One-time purchase. No recurring charges.
        </Text>
      </ScrollView>

      {/* Confirmation Modal */}
      {showConfirm && selectedProduct && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirm(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Icon name="cart" size={32} color="#8B5CF6" />
            </View>

            <Text style={styles.modalTitle}>Confirm Purchase</Text>

            <View style={styles.modalDetails}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Item</Text>
                <Text style={styles.modalValue}>{selectedProduct.name}</Text>
              </View>

              {(() => {
                const variant = selectedProduct.variants?.find((v: any) => v.id === selectedVariantId) || selectedProduct.variants?.[0] || null;
                return (
                  <>
                    {variant && variant.metadata?.cycle && (
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Quantity</Text>
                        <Text style={styles.modalValue}>{variant.metadata.cycle}</Text>
                      </View>
                    )}
                    <View style={[styles.modalRow, styles.modalTotal]}>
                      <Text style={styles.modalLabel}>Total</Text>
                      <Text style={styles.modalPrice}>
                        ${formatPrice(variant?.price || 0)}
                      </Text>
                    </View>
                  </>
                );
              })()}
            </View>

            <TouchableOpacity style={styles.purchaseButtonLarge} onPress={handlePurchase}>
              <Text style={styles.purchaseButtonLargeText}>Complete Purchase</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirm(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 15,
  },

  productsContainer: {
    gap: 24,
    marginBottom: 24,
  },

  productSection: {
    backgroundColor: '#1F1F2A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },

  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featureIcons: {
    flexDirection: 'row',
    gap: 4,
  },

  featuresList: {
    gap: 8,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: '#E5E7EB',
    fontSize: 13,
    flex: 1,
  },

  variantsList: {
    gap: 12,
  },

  variantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181826',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  variantItemSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#2A1F3A',
  },
  variantContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  variantInfo: {
    flex: 1,
    gap: 6,
  },
  variantCycle: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '600',
  },
  variantCycleSelected: {
    color: '#FFF',
  },
  variantPrice: {
    color: '#8B5CF6',
    fontSize: 18,
    fontWeight: '700',
  },
  variantPriceSelected: {
    color: '#8B5CF6',
  },
  checkmark: {
    marginLeft: 12,
  },

  discountBadgeSmall: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  discountTextSmall: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
  },

  disclaimer: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F1F2A',
    borderRadius: 28,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDetails: {
    backgroundColor: '#2A2A35',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  modalValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3A45',
    marginBottom: 0,
  },
  modalPrice: {
    color: '#8B5CF6',
    fontSize: 20,
    fontWeight: '700',
  },
  purchaseButtonLarge: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  purchaseButtonLargeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});