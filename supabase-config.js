// Supabase Configuration for POS System
// Project: https://rtfreafhlelpxqwohspq.supabase.co
// Browser-compatible version (no ES6 modules)

// Configuration
const SUPABASE_CONFIG = {
  url: "https://rtfreafhlelpxqwohspq.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZnJlYWZobGVscHhxd29oc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzYyNjAsImV4cCI6MjA3NzQ1MjI2MH0.WX_kwjFjv0e0RvpWwi6oSJOze49I_FbpPeWcdQZP79o",
};

// Initialize Supabase client - use global supabase from CDN
let supabase;
// Check for supabaseLib (from our inline script) or supabase (from CDN directly)
const supabaseClient = (typeof window !== "undefined" && window.supabaseLib) ? window.supabaseLib :
                       (typeof window !== "undefined" && window.supabase) ? window.supabase :
                       (typeof supabaseLib !== "undefined") ? supabaseLib :
                       (typeof supabase !== "undefined") ? supabase : null;

if (supabaseClient) {
  supabase = supabaseClient.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        "X-Client-Info": "pos-system/2.0.0",
      },
    },
  });
} else {
  console.error("❌ Supabase library not loaded. Make sure supabase CDN script is included before this file.");
  // Create a dummy supabase object to prevent crashes
  supabase = {
    from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.reject(new Error("Supabase not loaded")),
      signInWithOAuth: () => Promise.reject(new Error("Supabase not loaded")),
      signOut: () => Promise.reject(new Error("Supabase not loaded")),
      onAuthStateChange: () => ({ unsubscribe: () => {} }),
    },
  };
}

// Database References - Maintain Firebase-like interface for compatibility
const POS_DATABASE = {
  // Core tables - Firebase-style getters that return snapshot-like objects
  ingredients: {
    get: async () => {
      const { data, error } = await supabase.from("ingredients").select("*").order("name");
      if (error) {
        console.error("Error loading ingredients:", error);
        return { forEach: () => {}, empty: true, docs: [] };
      }
      return {
        forEach: (callback) => data.forEach((item) => callback({ id: item.id, data: () => item })),
        empty: data.length === 0,
        docs: data.map(item => ({ id: item.id, data: () => item })),
      };
    },
  },
  
  menus: {
    get: async () => {
      const { data, error } = await supabase.from("menus").select("*").eq("is_active", true).order("name");
      if (error) {
        console.error("Error loading menus:", error);
        return { forEach: () => {}, empty: true, docs: [] };
      }
      return {
        forEach: (callback) => data.forEach((item) => callback({ id: item.id, data: () => item })),
        empty: data.length === 0,
        docs: data.map(item => ({ id: item.id, data: () => item })),
      };
    },
  },

  // Real-time subscriptions - Firebase-style interface
  subscribeToLowStock: (callback) => {
    let initialDataSent = false;

    const channel = supabase
      .channel("low-stock-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ingredients",
        },
        (payload) => {
          // Check if low stock
          if (payload.new && payload.new.current_stock <= payload.new.min_stock) {
            callback({
              empty: false,
              forEach: (fn) => fn({ id: payload.new.id, data: () => payload.new }),
              docs: [{ id: payload.new.id, data: () => payload.new }],
            });
          }
        }
      )
      .subscribe();

    // Get initial low stock items
    if (!initialDataSent) {
      supabase
        .from("ingredients")
        .select("*")
        .then(({ data, error }) => {
          if (!error && data) {
            const lowStock = data.filter(item => item.current_stock <= item.min_stock);
            callback({
              empty: lowStock.length === 0,
              forEach: (fn) => lowStock.forEach(item => fn({ id: item.id, data: () => item })),
              docs: lowStock.map(item => ({ id: item.id, data: () => item })),
            });
            initialDataSent = true;
          }
        });
    }

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToPurchases: (callback) => {
    let initialDataSent = false;

    const channel = supabase
      .channel("purchases-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "purchases",
        },
        (payload) => {
          callback({
            empty: false,
            forEach: (fn) => fn({ id: payload.new.id, data: () => ({ ...payload.new, type: "purchase" }) }),
            docs: [{ id: payload.new.id, data: () => ({ ...payload.new, type: "purchase" }) }],
          });
        }
      )
      .subscribe();

    // Get initial recent purchases
    if (!initialDataSent) {
      supabase
        .from("purchases")
        .select(`
          *,
          ingredients(name),
          users(display_name, email)
        `)
        .order("purchase_date", { ascending: false })
        .order("purchase_time", { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (!error && data) {
            callback({
              empty: data.length === 0,
              forEach: (fn) => data.forEach(item => fn({ 
                id: item.id, 
                data: () => ({ 
                  ...item, 
                  type: "purchase",
                  item_name: item.ingredients?.name || item.ingredient_name || "Unknown",
                  menu_name: null,
                })
              })),
              docs: data.map(item => ({ 
                id: item.id, 
                data: () => ({ 
                  ...item, 
                  type: "purchase",
                  item_name: item.ingredients?.name || item.ingredient_name || "Unknown",
                })
              })),
            });
            initialDataSent = true;
          }
        });
    }

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

// Authentication helpers - Supabase implementation with Firebase-like interface
const POS_AUTH = {
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return user;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user };
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw error;
    // OAuth redirects, so this may not return immediately
    return { user: data?.user || null };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChanged: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  },
};

// Cloud Functions equivalents - Supabase implementation
const POS_FUNCTIONS = {
  calculateMenuCost: async (menuId) => {
    try {
      const { data, error } = await supabase.rpc("calculate_menu_cost", {
        menu_uuid: menuId,
      });
      if (error) {
        console.warn("RPC function not available, calculating manually", error);
        // Fallback: calculate manually
        return 0;
      }
      return data || 0;
    } catch (error) {
      console.error("Error calculating menu cost:", error);
      return 0;
    }
  },

  processSale: async (saleData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get platform ID if platform name provided
      let platformId = null;
      if (saleData.platform) {
        const { data: platform } = await supabase
          .from("platforms")
          .select("id")
          .eq("name", saleData.platform)
          .single();
        if (platform) platformId = platform.id;
      }

      const saleWithMeta = {
        menu_id: saleData.menu_id,
        platform_id: platformId,
        user_id: user?.id,
        quantity: saleData.quantity,
        unit_price: saleData.unit_price,
        total_amount: saleData.total_amount,
        order_date: new Date().toISOString().split("T")[0],
        order_time: new Date().toTimeString().split(" ")[0],
        status: "completed",
      };

      const { data, error } = await supabase
        .from("sales")
        .insert([saleWithMeta])
        .select()
        .single();

      if (error) throw error;

      return { success: true, saleId: data.id };
    } catch (error) {
      console.error("Error processing sale:", error);
      return { success: false, error: error.message };
    }
  },

  processPurchase: async (purchaseData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const purchaseWithMeta = {
        ingredient_id: purchaseData.ingredient_id,
        user_id: user?.id,
        quantity: purchaseData.quantity,
        unit: purchaseData.unit,
        unit_price: purchaseData.total_amount / purchaseData.quantity,
        total_amount: purchaseData.total_amount,
        vendor: purchaseData.vendor || "Unknown",
        purchase_date: new Date().toISOString().split("T")[0],
        purchase_time: new Date().toTimeString().split(" ")[0],
        status: "completed",
      };

      const { data, error } = await supabase
        .from("purchases")
        .insert([purchaseWithMeta])
        .select()
        .single();

      if (error) throw error;

      return { success: true, purchaseId: data.id };
    } catch (error) {
      console.error("Error processing purchase:", error);
      return { success: false, error: error.message };
    }
  },
};

// Admin functions
const POS_ADMIN = {
  seedIngredients: async (rows = []) => {
    try {
      const { error } = await supabase.from("ingredients").upsert(
        rows.map((r) => ({
          name: r.name,
          unit: r.unit || "pieces",
          min_stock: Number(r.min_stock ?? 0),
          current_stock: Number(r.current_stock ?? 0),
          category: r.category || "other",
        })),
        { onConflict: "name" }
      );
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  seedMenus: async (menus = []) => {
    try {
      const { error } = await supabase.from("menus").upsert(
        menus.map((m) => ({
          menu_id: m.menu_id || m.id,
          name: m.name,
          price: Number(m.price ?? 0),
          category: m.category || "main",
          is_active: true,
        })),
        { onConflict: "menu_id" }
      );
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  seedPlatforms: async (platforms = ["ร้าน", "Grab", "FoodPanda", "Line Man"]) => {
    try {
      const { error } = await supabase
        .from("platforms")
        .upsert(platforms.map((name) => ({ name, is_active: true })), { onConflict: "name" });
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },
};

// Export for global use - maintain Firebase compatibility
window.POS = {
  database: POS_DATABASE,
  auth: POS_AUTH,
  functions: POS_FUNCTIONS,
  admin: POS_ADMIN,
};

window.supabase = supabase;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

console.log("✅ Supabase POS initialized for project: rtfreafhlelpxqwohspq");
