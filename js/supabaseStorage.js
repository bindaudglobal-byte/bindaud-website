const getSupabaseConfig = () => {
  if (typeof window === 'undefined' || !window.BINDAUD_CONFIG) {
    return { supabaseUrl: '', supabaseAnonKey: '' };
  }

  return {
    supabaseUrl: window.BINDAUD_CONFIG.api?.supabaseUrl || '',
    supabaseAnonKey: window.BINDAUD_CONFIG.api?.supabaseAnonKey || ''
  };
};

const getSupabaseClient = async () => {
  if (typeof window === 'undefined') return null;
  if (window.__BINDAUD_SUPABASE_CLIENT) return window.__BINDAUD_SUPABASE_CLIENT;

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
  const client = createClient(supabaseUrl, supabaseAnonKey);
  window.__BINDAUD_SUPABASE_CLIENT = client;
  return client;
};

export const isSupabaseEnabled = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const getSupabaseProducts = async () => {
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await client
    .from('products')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const upsertSupabaseProduct = async (product) => {
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const cleaned = {
    ...product,
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sizeOptions: product.sizeOptions || [],
    colorOptions: product.colorOptions || [],
    features: product.features || [],
    tags: product.tags || []
  };

  if (cleaned.id) {
    const { data, error } = await client
      .from('products')
      .upsert(cleaned, { onConflict: 'id', returning: 'representation' });

    if (error) {
      throw error;
    }

    return Array.isArray(data) ? data[0] : data;
  }

  const id = cleaned.id || `prod-${Date.now()}`;
  const payload = { ...cleaned, id };
  const { data, error } = await client.from('products').insert(payload).single();
  if (error) {
    throw error;
  }

  return data;
};

export const deleteSupabaseProduct = async (productId) => {
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await client.from('products').delete().eq('id', productId);
  if (error) {
    throw error;
  }

  return true;
};

export const getSupabaseOrders = async () => {
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await client
    .from('orders')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const createSupabaseOrder = async (orderData) => {
  const client = await getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const payload = {
    ...orderData,
    id: orderData.id || `ord-${Date.now()}`,
    createdAt: orderData.createdAt || new Date().toISOString(),
    updatedAt: orderData.updatedAt || new Date().toISOString(),
    products: orderData.products || []
  };

  const { data, error } = await client.from('orders').insert(payload).single();
  if (error) {
    throw error;
  }

  return data;
};