import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase, identityDb, providerCatalogDb } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/error-handling';

type ServiceRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category_id: string;
  supports_hourly: boolean;
  hourly_rate: number | null;
  supports_flat: boolean;
  flat_rate: number | null;
  default_pricing_mode: PricingMode | null;
};

type PricingMode = 'hourly' | 'flat';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

const formatMoney = (value: number) => `P${Number(value || 0).toFixed(2)}`;
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const formatDbError = (error: any, fallback: string) => {
  const base = getErrorMessage(error, fallback);
  const code = error?.code ? ` [${error.code}]` : '';
  const details = error?.details ? `\n${error.details}` : '';
  const hint = error?.hint ? `\nHint: ${error.hint}` : '';
  return `${base}${code}${details}${hint}`;
};

export default function PricingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [lastErrorText, setLastErrorText] = useState('');

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [supportsHourly, setSupportsHourly] = useState(true);
  const [hourlyRateText, setHourlyRateText] = useState('');
  const [supportsFlat, setSupportsFlat] = useState(false);
  const [flatRateText, setFlatRateText] = useState('');
  const [defaultPricingMode, setDefaultPricingMode] = useState<PricingMode>('hourly');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const canSubmit = useMemo(() => {
    const hasHourly = supportsHourly && Number(hourlyRateText) > 0;
    const hasFlat = supportsFlat && Number(flatRateText) > 0;
    return !!title.trim() && categoryIds.length > 0 && (hasHourly || hasFlat) && !isSaving;
  }, [title, categoryIds, supportsHourly, hourlyRateText, supportsFlat, flatRateText, isSaving]);

  const resetForm = useCallback((nextCategoryIds?: string[]) => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setSupportsHourly(true);
    setHourlyRateText('');
    setSupportsFlat(false);
    setFlatRateText('');
    setDefaultPricingMode('hourly');
    if (nextCategoryIds) {
      setCategoryIds(nextCategoryIds);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    let rows: CategoryRow[] = [];

    // Try loading from DB — may fail if RLS blocks access or table is misconfigured.
    const { data, error } = await providerCatalogDb
      .from('service_categories')
      .select('id,name,slug')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.warn('[PricingScreen] loadCategories query failed:', error.message, error.code, error.details);
    } else {
      rows = (data ?? []) as CategoryRow[];
    }

    // If DB has no categories yet, bootstrap from signup metadata so provider can save immediately.
    if (rows.length === 0 && user?.id) {
      const meta = (user.user_metadata ?? {}) as Record<string, any>;
      const fromSignup = String(meta.sub_category || meta.primary_category || '').trim() || 'General Services';
      const slug = slugify(fromSignup) || `general-services-${Date.now()}`;
      const { data: inserted, error: insertError } = await providerCatalogDb
        .from('service_categories')
        .insert({ name: fromSignup, slug, is_active: true })
        .select('id,name,slug')
        .single();

      if (insertError) {
        console.warn('[PricingScreen] category bootstrap insert failed:', insertError.message, insertError.code);
        // Generate a synthetic local-only category so the form is still usable.
        const syntheticId = `local-${Date.now()}`;
        rows = [{ id: syntheticId, name: fromSignup, slug }];
      } else {
        rows = [inserted as CategoryRow];
      }
    }

    const meta = (user?.user_metadata ?? {}) as Record<string, any>;
    const selectedNames = [meta.sub_category, meta.primary_category]
      .map((v) => String(v || '').trim())
      .filter(Boolean);
    const selectedSlugs = selectedNames.map((n) => slugify(n));

    const scopedRows = selectedNames.length
      ? rows.filter((r) => selectedNames.some((n) => n.toLowerCase() === r.name.toLowerCase()) || selectedSlugs.includes(r.slug))
      : rows;

    const finalRows = scopedRows.length > 0 ? scopedRows : rows;
    setCategories(finalRows);

    if (finalRows.length > 0) {
      const preferred = String(meta.sub_category || meta.primary_category || '').trim().toLowerCase();
      const preferredRow = preferred
        ? finalRows.find((r) => r.name.toLowerCase() === preferred || r.slug === slugify(preferred))
        : null;
      if (categoryIds.length === 0 || !categoryIds.every((id) => finalRows.some((r) => r.id === id))) {
        setCategoryIds([preferredRow?.id || finalRows[0].id]);
      }
    }

    return finalRows;
  }, [categoryIds, user]);

  const loadServices = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await providerCatalogDb
      .from('provider_services')
      .select('id,title,description,price,category_id,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[PricingScreen] loadServices query failed:', error.message, error.code, error.details);
      // Don't throw — just leave services empty so the page still renders.
      return;
    }
    setServices((data ?? []) as ServiceRow[]);
  }, [user?.id]);

  const ensureCategoryIds = useCallback(async () => {
    if (categoryIds.length > 0) return categoryIds;

    const rows = categories.length ? categories : await loadCategories();
    if (rows.length > 0) {
      const defaultId = rows[0].id;
      setCategoryIds([defaultId]);
      return [defaultId];
    }

    const slug = `general-services-${Date.now()}`;
    const { data, error } = await providerCatalogDb
      .from('service_categories')
      .insert({ name: 'General Services', slug, is_active: true })
      .select('id,name,slug')
      .single();

    if (error) {
      console.warn('[PricingScreen] ensureCategoryIds insert failed:', error.message, error.code);
      // Use a synthetic category so saving can still be attempted.
      const syntheticId = `local-${Date.now()}`;
      const synthetic: CategoryRow = { id: syntheticId, name: 'General Services', slug };
      setCategories([synthetic]);
      setCategoryIds([syntheticId]);
      return [syntheticId];
    }

    const inserted = data as CategoryRow;
    setCategories([inserted]);
    setCategoryIds([inserted.id]);
    return [inserted.id];
  }, [categories, categoryIds, loadCategories]);

  const ensureProviderIdentityRows = useCallback(async () => {
    if (!user?.id) throw new Error('Missing authenticated user.');

    const meta = (user.user_metadata ?? {}) as Record<string, any>;
    const fullName =
      String(meta.full_name || meta.name || '').trim() || `Provider ${user.id.slice(0, 8)}`;
    const email = String(user.email || '').trim().toLowerCase();
    const contactNumber = String(meta.phone || meta.contact_number || '').trim() || 'N/A';

    if (!email) {
      throw new Error('Authenticated account has no email. Please re-login.');
    }

    const { error: usersUpsertError } = await identityDb.from('users').upsert({
      id: user.id,
      role: 'provider',
      full_name: fullName,
      email,
      contact_number: contactNumber,
    });
    if (usersUpsertError) {
      console.warn('[PricingScreen] users upsert failed:', usersUpsertError.message);
    }

    const { error: profileUpsertError } = await providerCatalogDb.from('provider_profiles').upsert({
      user_id: user.id,
      business_name: fullName,
    });
    if (profileUpsertError) {
      console.warn('[PricingScreen] provider_profiles upsert failed:', profileUpsertError.message);
    }
  }, [user]);

  const bootstrap = useCallback(async () => {
    if (!user?.id) {
      setIsBootLoading(false);
      return;
    }

    setIsBootLoading(true);
    setStatusText('Loading your services...');

    try {
      await Promise.all([loadCategories(), loadServices()]);
      setStatusText('Ready');
    } catch (error: any) {
      console.warn('[PricingScreen] bootstrap error:', error?.message ?? error);
      setStatusText('Loaded with warnings');
    } finally {
      setIsBootLoading(false);
    }
  }, [loadCategories, loadServices, user?.id]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const handleEdit = useCallback((service: ServiceRow) => {
    setEditingId(service.id);
    setTitle(service.title || '');
    setDescription(service.description || '');
    setSupportsHourly(Boolean(service.supports_hourly));
    setHourlyRateText(service.hourly_rate ? String(service.hourly_rate) : '');
    setSupportsFlat(Boolean(service.supports_flat));
    setFlatRateText(service.flat_rate ? String(service.flat_rate) : '');
    setDefaultPricingMode(service.default_pricing_mode || 'hourly');
    setCategoryIds(service.category_id ? [service.category_id] : categoryIds);
    setStatusText('Editing selected service');
  }, [categoryIds]);

  const handleDelete = useCallback((id: string) => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in first.');
      return;
    }

    Alert.alert('Delete Service', 'This will remove the service permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsSaving(true);
          setStatusText('Deleting service...');
          try {
            const { error } = await providerCatalogDb
              .from('provider_services')
              .delete()
              .eq('id', id)
              .eq('provider_id', user.id);

            if (error) throw error;

            await loadServices();
            if (editingId === id) {
              resetForm();
            }
            setStatusText('Service deleted');
          } catch (error) {
            setStatusText('Delete failed');
            Alert.alert('Delete Failed', getErrorMessage(error, 'Could not delete service.'));
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
  }, [editingId, loadServices, resetForm, user?.id]);

  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in again before saving.');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const parsedHourlyRate = Number(hourlyRateText);
    const parsedFlatRate = Number(flatRateText);
    const hasHourly = supportsHourly && Number.isFinite(parsedHourlyRate) && parsedHourlyRate > 0;
    const hasFlat = supportsFlat && Number.isFinite(parsedFlatRate) && parsedFlatRate > 0;

    if (!trimmedTitle) {
      Alert.alert('Missing Fields', 'Service name is required.');
      return;
    }

    if (!supportsHourly && !supportsFlat) {
      Alert.alert('Missing Pricing Mode', 'Enable at least one pricing mode before saving.');
      return;
    }

    if (supportsHourly && !hasHourly) {
      Alert.alert('Invalid Hourly Rate', 'Hourly rate must be a valid number greater than 0.');
      return;
    }

    if (supportsFlat && !hasFlat) {
      Alert.alert('Invalid Flat Rate', 'Flat rate must be a valid number greater than 0.');
      return;
    }

    setIsSaving(true);
    setStatusText('Saving changes...');
    setLastErrorText('');

    try {
      const resolvedCategoryIds = await ensureCategoryIds();
      const fallbackPrice = supportsHourly ? parsedHourlyRate : parsedFlatRate;
      const basePayload = {
        provider_id: user.id,
        title: trimmedTitle,
        description: trimmedDescription || null,
        price: fallbackPrice,
        supports_hourly: supportsHourly,
        hourly_rate: supportsHourly ? parsedHourlyRate : null,
        supports_flat: supportsFlat,
        flat_rate: supportsFlat ? parsedFlatRate : null,
        default_pricing_mode: supportsHourly && supportsFlat
          ? defaultPricingMode
          : supportsHourly
            ? 'hourly'
            : 'flat',
      };

      if (editingId) {
        const payload = {
          ...basePayload,
          category_id: resolvedCategoryIds[0],
        };
        const { error } = await providerCatalogDb
          .from('provider_services')
          .update(payload)
          .eq('id', editingId)
          .eq('provider_id', user.id);
        if (error) {
          // If DB requires parent identity rows, create them once then retry.
          await ensureProviderIdentityRows();
          const { error: retryError } = await providerCatalogDb
            .from('provider_services')
            .update(payload)
            .eq('id', editingId)
            .eq('provider_id', user.id);
          if (retryError) throw retryError;
        }
      } else {
        const payloads = resolvedCategoryIds.map((categoryId) => ({
          ...basePayload,
          category_id: categoryId,
        }));
        const { error } = await providerCatalogDb.from('provider_services').insert(payloads);
        if (error) {
          // If DB requires parent identity rows, create them once then retry.
          await ensureProviderIdentityRows();
          const { error: retryError } = await providerCatalogDb.from('provider_services').insert(payloads);
          if (retryError) throw retryError;
        }
      }

      await loadServices();
      resetForm(resolvedCategoryIds);
      setStatusText(editingId ? 'Service updated in database' : 'Services added in database');
      Alert.alert(
        'Success',
        editingId
          ? 'Service updated successfully.'
          : `Added service to ${resolvedCategoryIds.length} categor${resolvedCategoryIds.length > 1 ? 'ies' : 'y'}.`
      );
    } catch (error) {
      setStatusText('Save failed');
      const richError = formatDbError(error, 'Could not save service right now.');
      setLastErrorText(richError);
      Alert.alert('Save Failed', richError);
    } finally {
      setIsSaving(false);
    }
  }, [
    defaultPricingMode,
    description,
    editingId,
    ensureCategoryIds,
    ensureProviderIdentityRows,
    flatRateText,
    hourlyRateText,
    loadServices,
    resetForm,
    supportsFlat,
    supportsHourly,
    title,
    user?.id,
  ]);

  const selectedCategoryName = useMemo(() => {
    if (categoryIds.length === 0) return 'No category selected';
    const names = categories
      .filter((c) => categoryIds.includes(c.id))
      .map((c) => c.name);
    return names.length ? names.join(', ') : 'Unknown category';
  }, [categories, categoryIds]);

  const toggleCategory = (id: string) => {
    if (editingId) {
      setCategoryIds([id]);
      return;
    }
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack?.() ? router.back() : router.replace('/' as any))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00B761" />
        </Pressable>
        <Text style={styles.headerTitle}>Services & Pricing</Text>
        <View style={{ width: 34 }} />
      </View>

      {isBootLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#00B761" />
          <Text style={styles.status}>{statusText}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editingId ? 'Edit Service' : 'Add Service'}</Text>

            <Text style={styles.label}>Service Name</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Aircon Cleaning"
              editable={!isSaving}
            />

            <Text style={styles.label}>Service Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what is included"
              multiline
              editable={!isSaving}
            />

            <Text style={styles.label}>Pricing Options</Text>
            <View style={styles.pricingCard}>
              <Pressable
                onPress={() => {
                  setSupportsHourly((value) => {
                    const nextValue = !value;
                    if (!nextValue && !supportsFlat) {
                      setSupportsFlat(true);
                      setDefaultPricingMode('flat');
                    } else if (!nextValue && defaultPricingMode === 'hourly') {
                      setDefaultPricingMode('flat');
                    }
                    return nextValue;
                  });
                }}
                disabled={isSaving}
                style={[styles.modeToggle, supportsHourly && styles.modeToggleActive]}
              >
                <Text style={[styles.modeToggleTitle, supportsHourly && styles.modeToggleTitleActive]}>Hourly</Text>
                <Text style={[styles.modeToggleText, supportsHourly && styles.modeToggleTextActive]}>
                  Customer enters hours up front.
                </Text>
              </Pressable>

              {supportsHourly ? (
                <TextInput
                  style={styles.input}
                  value={hourlyRateText}
                  onChangeText={setHourlyRateText}
                  keyboardType="decimal-pad"
                  placeholder="Hourly rate in PHP"
                  editable={!isSaving}
                />
              ) : null}

              <Pressable
                onPress={() => {
                  setSupportsFlat((value) => {
                    const nextValue = !value;
                    if (!nextValue && !supportsHourly) {
                      setSupportsHourly(true);
                      setDefaultPricingMode('hourly');
                    } else if (!nextValue && defaultPricingMode === 'flat') {
                      setDefaultPricingMode('hourly');
                    }
                    return nextValue;
                  });
                }}
                disabled={isSaving}
                style={[styles.modeToggle, supportsFlat && styles.modeToggleActive]}
              >
                <Text style={[styles.modeToggleTitle, supportsFlat && styles.modeToggleTitleActive]}>Flat Rate</Text>
                <Text style={[styles.modeToggleText, supportsFlat && styles.modeToggleTextActive]}>
                  Customer books a slot for one fixed amount.
                </Text>
              </Pressable>

              {supportsFlat ? (
                <TextInput
                  style={styles.input}
                  value={flatRateText}
                  onChangeText={setFlatRateText}
                  keyboardType="decimal-pad"
                  placeholder="Flat rate in PHP"
                  editable={!isSaving}
                />
              ) : null}

              {supportsHourly && supportsFlat ? (
                <View style={styles.defaultModeWrap}>
                  <Text style={styles.defaultModeLabel}>Default pricing mode</Text>
                  <View style={styles.defaultModeRow}>
                    <Pressable
                      onPress={() => setDefaultPricingMode('hourly')}
                      disabled={isSaving}
                      style={[styles.defaultModeChip, defaultPricingMode === 'hourly' && styles.defaultModeChipActive]}
                    >
                      <Text style={[styles.defaultModeChipText, defaultPricingMode === 'hourly' && styles.defaultModeChipTextActive]}>
                        Hourly
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setDefaultPricingMode('flat')}
                      disabled={isSaving}
                      style={[styles.defaultModeChip, defaultPricingMode === 'flat' && styles.defaultModeChipActive]}
                    >
                      <Text style={[styles.defaultModeChipText, defaultPricingMode === 'flat' && styles.defaultModeChipTextActive]}>
                        Flat
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>

            <Text style={styles.label}>Category</Text>
            <Text style={styles.categoryValue}>{selectedCategoryName}</Text>
            <View style={styles.categoryList}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  style={[styles.categoryChip, categoryIds.includes(cat.id) && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, categoryIds.includes(cat.id) && styles.categoryChipTextActive]}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
            >
              <Text style={styles.primaryBtnText}>
                {isSaving ? 'Saving...' : editingId ? 'Confirm Changes' : 'Add New Service'}
              </Text>
            </Pressable>

            {editingId ? (
              <Pressable onPress={() => resetForm(categoryIds)} disabled={isSaving} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Cancel Edit</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.status}>{statusText}</Text>
          {!!lastErrorText ? <Text style={styles.errorText}>{lastErrorText}</Text> : null}

          <Text style={styles.sectionTitle}>Current Services</Text>
          {services.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No services yet. Add one using the form above.</Text>
            </View>
          ) : null}

          {services.map((item) => (
            <View key={item.id} style={styles.serviceCard}>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Text style={styles.serviceDescription}>{item.description || 'No description'}</Text>
              {item.supports_hourly ? (
                <Text style={styles.servicePrice}>
                  Hourly: {formatMoney(item.hourly_rate ?? item.price)} / hour
                </Text>
              ) : null}
              {item.supports_flat ? (
                <Text style={styles.servicePrice}>
                  Flat: {formatMoney(item.flat_rate ?? item.price)} / service
                </Text>
              ) : null}
              {item.supports_hourly && item.supports_flat ? (
                <Text style={styles.defaultModeText}>
                  Default: {item.default_pricing_mode === 'flat' ? 'Flat Rate' : 'Hourly'}
                </Text>
              ) : null}

              <View style={styles.rowActions}>
                <Pressable onPress={() => handleEdit(item)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  loaderWrap: {
    marginTop: 28,
    alignItems: 'center',
    gap: 10,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  pricingCard: {
    gap: 10,
    marginBottom: 8,
  },
  modeToggle: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modeToggleActive: {
    borderColor: '#00B761',
    backgroundColor: '#E8FFF4',
  },
  modeToggleTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  modeToggleTitleActive: {
    color: '#008C4A',
  },
  modeToggleText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  modeToggleTextActive: {
    color: '#047857',
  },
  defaultModeWrap: {
    marginTop: 4,
  },
  defaultModeLabel: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  defaultModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  defaultModeChip: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  defaultModeChipActive: {
    borderColor: '#00B761',
    backgroundColor: '#E8FFF4',
  },
  defaultModeChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  defaultModeChipTextActive: {
    color: '#008C4A',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  categoryValue: {
    color: '#334155',
    fontSize: 13,
    marginBottom: 8,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  categoryChipActive: {
    borderColor: '#00B761',
    backgroundColor: '#E8FFF4',
  },
  categoryChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#008C4A',
  },
  primaryBtn: {
    backgroundColor: '#00B761',
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: 8,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  status: {
    color: '#475569',
    fontSize: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
  },
  emptyText: {
    color: '#64748B',
  },
  serviceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  serviceDescription: {
    color: '#475569',
    marginTop: 5,
  },
  servicePrice: {
    color: '#00B761',
    fontWeight: '700',
    marginTop: 8,
  },
  defaultModeText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 6,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  editBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#1E293B',
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8E8',
  },
  deleteBtnText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
});
