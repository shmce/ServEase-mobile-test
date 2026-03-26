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
};

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
  const [priceText, setPriceText] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const canSubmit = useMemo(() => {
    return !!title.trim() && !!priceText.trim() && categoryIds.length > 0 && !isSaving;
  }, [title, priceText, categoryIds, isSaving]);

  const resetForm = useCallback((nextCategoryIds?: string[]) => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPriceText('');
    if (nextCategoryIds) {
      setCategoryIds(nextCategoryIds);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    let { data, error } = await supabase
      .from('service_categories')
      .select('id,name,slug')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    let rows = (data ?? []) as CategoryRow[];

    // If DB has no categories yet, bootstrap from signup metadata so provider can save immediately.
    if (rows.length === 0 && user?.id) {
      const meta = (user.user_metadata ?? {}) as Record<string, any>;
      const fromSignup = String(meta.sub_category || meta.primary_category || '').trim() || 'General Services';
      const slug = slugify(fromSignup) || `general-services-${Date.now()}`;
      const { data: inserted, error: insertError } = await supabase
        .from('service_categories')
        .insert({ name: fromSignup, slug, is_active: true })
        .select('id,name,slug')
        .single();
      if (insertError) throw insertError;
      rows = [inserted as CategoryRow];
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

    const { data, error } = await supabase
      .from('provider_services')
      .select('id,title,description,price,category_id')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
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
    const { data, error } = await supabase
      .from('service_categories')
      .insert({ name: 'General Services', slug, is_active: true })
      .select('id,name,slug')
      .single();

    if (error) throw error;

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
    if (usersUpsertError) throw usersUpsertError;

    const { error: profileUpsertError } = await providerCatalogDb.from('provider_profiles').upsert({
      user_id: user.id,
      business_name: fullName,
    });
    if (profileUpsertError) throw profileUpsertError;
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
    } catch (error) {
      setStatusText('Load failed');
      Alert.alert('Load Failed', getErrorMessage(error, 'Could not load your services right now.'));
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
    setPriceText(String(service.price ?? ''));
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
            const { error } = await supabase
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
    const parsedPrice = Number(priceText);

    if (!trimmedTitle || !priceText.trim()) {
      Alert.alert('Missing Fields', 'Service name and service rate are required.');
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid Rate', 'Rate must be a valid number greater than 0.');
      return;
    }

    setIsSaving(true);
    setStatusText('Saving changes...');
    setLastErrorText('');

    try {
      const resolvedCategoryIds = await ensureCategoryIds();
      const basePayload = {
        provider_id: user.id,
        title: trimmedTitle,
        description: trimmedDescription || null,
        price: parsedPrice,
      };

      if (editingId) {
        const payload = {
          ...basePayload,
          category_id: resolvedCategoryIds[0],
        };
        const { error } = await supabase
          .from('provider_services')
          .update(payload)
          .eq('id', editingId)
          .eq('provider_id', user.id);
        if (error) {
          // If DB requires parent identity rows, create them once then retry.
          await ensureProviderIdentityRows();
          const { error: retryError } = await supabase
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
  }, [description, editingId, ensureCategoryIds, ensureProviderIdentityRows, loadServices, priceText, resetForm, title, user?.id]);

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

            <Text style={styles.label}>Service Rate (PHP)</Text>
            <TextInput
              style={styles.input}
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="numeric"
              placeholder="e.g. 750"
              editable={!isSaving}
            />

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
              <Text style={styles.servicePrice}>{formatMoney(item.price)} / service</Text>

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

