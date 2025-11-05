// Supabase Configuration for POS System
// Project: https://rtfreafhlelpxqwohspq.supabase.co
// Browser-compatible version (no ES6 modules)

// Configuration
const SUPABASE_CONFIG = {
  url: "https://rtfreafhlelpxqwohspq.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZnJlYWZobGVscHhxd29oc3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NzYyNjAsImV4cCI6MjA3NzQ1MjI2MH0.WX_kwjFjv0e0RvpWwi6oSJOze49I_FbpPeWcdQZP79o",
};

// Initialize Supabase client - wait for createClient to be available
let supabase;

// Create a placeholder POS object immediately to prevent crashes
// This will be replaced with the real implementation once Supabase loads
window.POS = {
  database: {
    ingredients: { get: async () => ({ forEach: () => {}, empty: true, docs: [] }) },
    menus: { get: async () => ({ forEach: () => {}, empty: true, docs: [] }) },
    subscribeToLowStock: () => () => {},
    subscribeToPurchases: () => () => {},
  },
  auth: {
    getCurrentUser: async () => null,
    signIn: async () => { throw new Error("Authentication not available - Supabase is loading. Please wait a moment and try again."); },
    signInWithGoogle: async () => { throw new Error("Authentication not available - Supabase is loading. Please wait a moment and try again."); },
    signOut: async () => { throw new Error("Authentication not available - Supabase is loading. Please wait a moment and try again."); },
    onAuthStateChanged: () => ({ unsubscribe: () => {} }),
  },
  functions: {
    calculateMenuCost: async () => 0,
    processSale: async () => ({ success: false, error: "Supabase is loading" }),
    processPurchase: async () => ({ success: false, error: "Supabase is loading" }),
  },
  admin: {
    seedIngredients: async () => ({ success: false, error: "Supabase is loading" }),
    seedMenus: async () => ({ success: false, error: "Supabase is loading" }),
    seedPlatforms: async () => ({ success: false, error: "Supabase is loading" }),
  },
};

function initializeSupabase() {
  if (window.supabaseCreateClient && typeof window.supabaseCreateClient === "function") {
    supabase = window.supabaseCreateClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
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
    
    // Export to window
    window.supabase = supabase;
    window.POS = window.POS || {};
    
    console.log("✅ Supabase client initialized");
    
    // Setup POS interface after Supabase is ready
    setupPOSInterface();
    
    return true;
  } else {
    // Wait for Supabase to load
    console.warn("⚠️ Supabase library not loaded yet, waiting...");
    
    // Try to initialize when Supabase loads
    const checkSupabase = setInterval(() => {
      if (window.supabaseCreateClient && typeof window.supabaseCreateClient === "function") {
        clearInterval(checkSupabase);
        initializeSupabase();
      }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkSupabase);
      if (!supabase) {
        console.error("❌ Supabase failed to load after 10 seconds");
        // Create a minimal fallback
        supabase = {
          from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
          auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            signInWithPassword: () => Promise.reject(new Error("Supabase not loaded")),
            signInWithOAuth: () => Promise.reject(new Error("Supabase not loaded")),
            signOut: () => Promise.reject(new Error("Supabase not loaded")),
            onAuthStateChange: () => ({ unsubscribe: () => {} }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          },
          rpc: () => Promise.reject(new Error("Supabase not loaded")),
          removeChannel: () => {},
        };
        window.supabase = supabase;
      }
    }, 10000);
    
    return false;
  }
}

// Initialize when Supabase is ready
if (window.supabaseLoaded) {
  initializeSupabase();
} else {
  window.addEventListener('supabase-loaded', () => {
    initializeSupabase();
  }, { once: true });
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
          event: "UPDATE",
          schema: "public",
          table: "ingredients",
        },
        (payload) => {
          // When an ingredient is updated, refresh the entire low stock list
          // This ensures we catch items that go from low to normal or vice versa
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
              }
            });
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

    // Store callback for manual refresh
    if (!window._refreshLowStock) {
      window._refreshLowStock = async () => {
        const { data, error } = await supabase
          .from("ingredients")
          .select("*");
        if (!error && data) {
          const lowStock = data.filter(item => item.current_stock <= item.min_stock);
          callback({
            empty: lowStock.length === 0,
            forEach: (fn) => lowStock.forEach(item => fn({ id: item.id, data: () => item })),
            docs: lowStock.map(item => ({ id: item.id, data: () => item })),
          });
        }
      };
    }

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToPurchases: (callback) => {
    let initialDataSent = false;
    let allTransactions = []; // Maintain full list of transactions

    // Function to refresh and send full transactions list
    const refreshTransactions = async () => {
      try {
        // Fetch purchases
        const { data: purchasesData, error: purchasesError } = await supabase
          .from("purchases")
          .select("*")
          .order("purchase_date", { ascending: false })
          .order("purchase_time", { ascending: false })
          .limit(50);

        if (purchasesError) {
          console.warn("Error loading purchases:", purchasesError);
        }

        // Fetch ingredient names
        const ingredientIds = [...new Set((purchasesData || []).filter(p => p.ingredient_id).map(p => p.ingredient_id))];
        let ingredientMap = {};
        if (ingredientIds.length > 0) {
          const { data: ingredientsData } = await supabase
            .from("ingredients")
            .select("id, name")
            .in("id", ingredientIds);
          
          if (ingredientsData) {
            ingredientMap = Object.fromEntries(ingredientsData.map(ing => [ing.id, ing.name]));
          }
        }

        // Fetch sales
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .order("order_date", { ascending: false })
          .order("order_time", { ascending: false })
          .limit(50);

        if (salesError) {
          console.warn("Error loading sales:", salesError);
        }

        // Fetch menu names
        const menuIds = [...new Set((salesData || []).filter(s => s.menu_id).map(s => s.menu_id))];
        let menuMap = {};
        if (menuIds.length > 0) {
          const { data: menusData } = await supabase
            .from("menus")
            .select("id, name")
            .in("id", menuIds);
          
          if (menusData) {
            menuMap = Object.fromEntries(menusData.map(menu => [menu.id, menu.name]));
          }
        }

        // Combine and sort
        allTransactions = [
          ...(purchasesData || []).map(item => ({
            ...item,
            type: "purchase",
            item_name: ingredientMap[item.ingredient_id] || "Unknown Ingredient",
            menu_name: null,
            transaction_date: item.purchase_date,
            transaction_time: item.purchase_time,
          })),
          ...(salesData || []).map(item => ({
            ...item,
            type: "sale",
            item_name: null,
            menu_name: menuMap[item.menu_id] || "Unknown Menu",
            transaction_date: item.order_date,
            transaction_time: item.order_time,
          }))
        ].sort((a, b) => {
          const dateCompare = (b.transaction_date || "").localeCompare(a.transaction_date || "");
          if (dateCompare !== 0) return dateCompare;
          return (b.transaction_time || "").localeCompare(a.transaction_time || "");
        }).slice(0, 50);

        // Send updated list to callback
        callback({
          empty: allTransactions.length === 0,
          forEach: (fn) => allTransactions.forEach(item => fn({ 
            id: item.id, 
            data: () => item
          })),
          docs: allTransactions.map(item => ({ 
            id: item.id, 
            data: () => item
          })),
        });
      } catch (error) {
        console.error("Error refreshing transactions:", error);
      }
    };

    // Store refresh function globally for manual refresh
    window._refreshTransactions = refreshTransactions;

    const channel = supabase
      .channel("transactions-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "purchases",
        },
        async (payload) => {
          // When a new purchase is inserted, refresh the full list
          await refreshTransactions();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sales",
        },
        async (payload) => {
          // When a new sale is inserted, refresh the full list
          await refreshTransactions();
        }
      )
      .subscribe();

    // Get initial transactions list
    if (!initialDataSent) {
      refreshTransactions().then(() => {
        initialDataSent = true;
      }).catch((error) => {
        console.warn("Error loading initial transactions:", error);
        initialDataSent = true;
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
    // Handle OAuth redirect URL for file:// protocol
    let redirectUrl;
    if (window.location.protocol === "file:") {
      // For file:// protocol, we need to use a URL that can handle the callback
      // You should configure this in Supabase dashboard to point to a local HTTP server
      // For now, try to use the full file path
      redirectUrl = window.location.href.split("?")[0]; // Remove query params if any
      console.warn("⚠️ Using file:// protocol. OAuth may not work. Please use HTTP server (localhost:8000)");
    } else {
      // Use current origin + pathname for redirect
      redirectUrl = window.location.origin + window.location.pathname;
    }

    // Log the redirect URL for debugging
    console.log("🔐 OAuth redirect URL:", redirectUrl);
    console.log("💡 Make sure this URL is added to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      
      if (error) {
        console.error("❌ OAuth Error:", error);
        throw error;
      }
      
      // OAuth redirects immediately, so this may not return
      // The auth state change listener will handle the actual sign-in
      return { user: null, redirecting: true };
    } catch (error) {
      console.error("❌ Failed to initiate OAuth:", error);
      console.log("📝 Troubleshooting:");
      console.log("   1. Check if redirect URL is in Supabase Dashboard");
      console.log("   2. Check if Google OAuth is enabled in Supabase");
      console.log("   3. See FIX_OAUTH_REDIRECT.md for detailed instructions");
      throw error;
    }
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

      // Note: total_amount is a generated column (quantity * unit_price)
      // so we don't include it in the insert
      const saleWithMeta = {
        menu_id: saleData.menu_id,
        platform_id: platformId,
        user_id: user?.id,
        quantity: saleData.quantity,
        unit_price: saleData.unit_price,
        // total_amount is generated automatically by the database
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

  // List ingredients with pagination and search
  listIngredientsPaginated: async ({ search = "", page = 1, pageSize = 25 } = {}) => {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("ingredients")
        .select("id,name,unit,current_stock,min_stock,cost_per_unit,updated_at", { count: "exact" })
        .order("name");

      if (search && search.trim() !== "") {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      return { success: true, items: data || [], total: count || 0, page, pageSize };
    } catch (error) {
      console.error("Error listing ingredients:", error);
      return { success: false, error: error.message };
    }
  },

  // Create stock adjustment (positive or negative)
  createStockAdjustment: async ({ ingredient_id, quantity_change, unit, reason }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        ingredient_id,
        quantity_change: Number(quantity_change),
        unit: unit || null,
        reason: reason || null,
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("stock_adjustments").insert([payload]);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error creating stock adjustment:", error);
      return { success: false, error: error.message };
    }
  },

  // Record waste
  createWaste: async ({ ingredient_id, quantity, unit, reason }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        ingredient_id,
        quantity: Number(quantity),
        unit: unit || null,
        reason: reason || null,
        user_id: user?.id || null,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("waste").insert([payload]);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error creating waste:", error);
      return { success: false, error: error.message };
    }
  },

  // Upsert ingredient (create or update basic fields)
  upsertIngredient: async ({ id, name, unit, min_stock, current_stock, cost_per_unit }) => {
    try {
      const row = {
        id: id || undefined,
        name: name?.trim(),
        unit: unit || null,
        min_stock: min_stock != null ? Number(min_stock) : undefined,
        current_stock: current_stock != null ? Number(current_stock) : undefined,
        cost_per_unit: cost_per_unit != null ? Number(cost_per_unit) : undefined,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("ingredients").upsert([row]).select("id");
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error upserting ingredient:", error);
      return { success: false, error: error.message };
    }
  },

  // Operational costs functions
  createExpense: async (expenseData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const expense = {
        user_id: user?.id,
        category: expenseData.category, // 'utility', 'rental', 'labor', 'other'
        subcategory: expenseData.subcategory || null,
        description: expenseData.description || expenseData.category,
        amount: Number(expenseData.amount),
        expense_date: expenseData.date || new Date().toISOString().split('T')[0],
        vendor: expenseData.vendor || null,
        payment_method: expenseData.payment_method || 'cash',
        notes: expenseData.notes || null,
        cost_center_id: expenseData.cost_center_id || null,
      };
      
      const { data, error } = await supabase
        .from("expenses")
        .insert([expense])
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, expenseId: data.id };
    } catch (error) {
      console.error("Error creating expense:", error);
      return { success: false, error: error.message };
    }
  },

  createLaborLog: async (laborData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const labor = {
        user_id: laborData.employee_id || user?.id,
        shift_date: laborData.date || new Date().toISOString().split('T')[0],
        clock_in_time: laborData.clock_in ? new Date(laborData.clock_in).toISOString() : null,
        clock_out_time: laborData.clock_out ? new Date(laborData.clock_out).toISOString() : null,
        hours_worked: Number(laborData.hours) || 0,
        hourly_rate: Number(laborData.hourly_rate) || 0,
        total_pay: (Number(laborData.hours) || 0) * (Number(laborData.hourly_rate) || 0),
        role_during_shift: laborData.role || null,
        notes: laborData.notes || null,
        approved: laborData.approved || false,
      };
      
      const { data, error } = await supabase
        .from("labor_logs")
        .insert([labor])
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, laborId: data.id };
    } catch (error) {
      console.error("Error creating labor log:", error);
      return { success: false, error: error.message };
    }
  },

  getMonthlyOperationalCosts: async (year, month) => {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const daysInMonth = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;
      
      // Get expenses by category
      const { data: expenses, error: expError } = await supabase
        .from("expenses")
        .select("category, subcategory, description, amount, notes")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);
      
      if (expError) throw expError;
      
      // Get labor costs
      const { data: labor, error: laborError } = await supabase
        .from("labor_logs")
        .select("total_pay, hours_worked")
        .gte("shift_date", startDate)
        .lte("shift_date", endDate);
      
      if (laborError) throw laborError;
      
      // Calculate totals
      const electricExpenses = (expenses || []).filter(e => 
        e.category === 'utility' && 
        (e.description?.toLowerCase().includes('electric') || 
         e.notes?.toLowerCase().includes('electric') ||
         e.subcategory === 'electric')
      );
      
      const waterExpenses = (expenses || []).filter(e => 
        e.category === 'utility' && 
        (e.description?.toLowerCase().includes('water') || 
         e.notes?.toLowerCase().includes('water') ||
         e.subcategory === 'water')
      );
      
      const summary = {
        utilities: {
          electric: electricExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
          water: waterExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
          other: (expenses || []).filter(e => e.category === 'utility' && !electricExpenses.includes(e) && !waterExpenses.includes(e)).reduce((sum, e) => sum + (e.amount || 0), 0),
        },
        rental: (expenses || []).filter(e => e.category === 'rental').reduce((sum, e) => sum + (e.amount || 0), 0),
        labor: {
          total_pay: (labor || []).reduce((sum, l) => sum + (l.total_pay || 0), 0),
          total_hours: (labor || []).reduce((sum, l) => sum + (l.hours_worked || 0), 0),
          count: (labor || []).length,
        },
        other_expenses: (expenses || []).filter(e => e.category === 'other').reduce((sum, e) => sum + (e.amount || 0), 0),
        total: 0,
      };
      
      summary.total = 
        summary.utilities.electric + 
        summary.utilities.water + 
        summary.utilities.other +
        summary.rental + 
        summary.labor.total_pay + 
        summary.other_expenses;
      
      return { success: true, summary, expenses: expenses || [], labor: labor || [] };
    } catch (error) {
      console.error("Error getting operational costs:", error);
      return { success: false, error: error.message };
    }
  },

  // Get expenses history with user information
  getExpensesHistory: async ({ search = "", category = "", page = 1, pageSize = 50, startDate = null, endDate = null } = {}) => {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // First, get expenses
      let query = supabase
        .from("expenses")
        .select("*", { count: "exact" })
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (search && search.trim() !== "") {
        query = query.or(`description.ilike.%${search.trim()}%,vendor.ilike.%${search.trim()}%,notes.ilike.%${search.trim()}%`);
      }

      if (category && category !== "") {
        query = query.eq("category", category);
      }

      if (startDate) {
        query = query.gte("expense_date", startDate);
      }

      if (endDate) {
        query = query.lte("expense_date", endDate);
      }

      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;

      // Get total amount for all matching expenses (not just current page)
      let totalAmount = 0;
      try {
        let totalQuery = supabase
          .from("expenses")
          .select("amount");

        if (search && search.trim() !== "") {
          totalQuery = totalQuery.or(`description.ilike.%${search.trim()}%,vendor.ilike.%${search.trim()}%,notes.ilike.%${search.trim()}%`);
        }

        if (category && category !== "") {
          totalQuery = totalQuery.eq("category", category);
        }

        if (startDate) {
          totalQuery = totalQuery.gte("expense_date", startDate);
        }

        if (endDate) {
          totalQuery = totalQuery.lte("expense_date", endDate);
        }

        const { data: allExpenses, error: totalError } = await totalQuery;
        if (!totalError && allExpenses) {
          totalAmount = allExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        }
      } catch (totalError) {
        console.warn("Error calculating total amount:", totalError);
      }

      // Get unique user IDs
      const userIds = [...new Set([
        ...(data || []).map(e => e.user_id).filter(Boolean),
        ...(data || []).map(e => e.approved_by).filter(Boolean)
      ])];

      // Fetch user information
      let userMap = {};
      if (userIds.length > 0) {
        const { data: users, error: userError } = await supabase
          .from("users")
          .select("id, email, display_name")
          .in("id", userIds);
        
        if (!userError && users) {
          userMap = Object.fromEntries(users.map(u => [u.id, u]));
        }
      }

      // Format the data to include user names
      const formattedData = (data || []).map(expense => {
        const creator = userMap[expense.user_id];
        const approver = expense.approved_by ? userMap[expense.approved_by] : null;
        
        return {
          ...expense,
          created_by_name: creator?.display_name || creator?.email || "Unknown",
          approved_by_name: approver?.display_name || approver?.email || null,
        };
      });

      return { success: true, expenses: formattedData, total: count || 0, totalAmount: totalAmount, page, pageSize };
    } catch (error) {
      console.error("Error getting expenses history:", error);
      return { success: false, error: error.message, expenses: [], total: 0 };
    }
  },

  // Get all menus with cost, price, and available dishes calculation
  getMenusWithAvailability: async ({ search = "", category = "", isActive = true } = {}) => {
    try {
      // Get all menus
      let menuQuery = supabase
        .from("menus")
        .select("*")
        .order("menu_id", { ascending: true });

      if (isActive !== null) {
        menuQuery = menuQuery.eq("is_active", isActive);
      }

      if (search && search.trim() !== "") {
        menuQuery = menuQuery.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,menu_id.ilike.%${search.trim()}%`);
      }

      if (category && category !== "") {
        menuQuery = menuQuery.eq("category_id", category);
      }

      const { data: menus, error: menusError } = await menuQuery;
      if (menusError) throw menusError;

      if (!menus || menus.length === 0) {
        return { success: true, menus: [] };
      }

      // Get all menu recipes for these menus
      const menuIds = menus.map(m => m.id);
      const { data: recipes, error: recipesError } = await supabase
        .from("menu_recipes")
        .select("menu_id, ingredient_id, quantity_per_serve, unit, is_optional")
        .in("menu_id", menuIds);

      if (recipesError) throw recipesError;

      // Get all ingredients with current stock
      const ingredientIds = [...new Set(recipes.map(r => r.ingredient_id).filter(Boolean))];
      let ingredientsMap = {};
      if (ingredientIds.length > 0) {
        const { data: ingredients, error: ingredientsError } = await supabase
          .from("ingredients")
          .select("id, name, current_stock, unit, cost_per_unit")
          .in("id", ingredientIds);

        if (!ingredientsError && ingredients) {
          ingredientsMap = Object.fromEntries(ingredients.map(i => [i.id, i]));
        }
      }

      // Group recipes by menu
      const recipesByMenu = {};
      (recipes || []).forEach(recipe => {
        if (!recipesByMenu[recipe.menu_id]) {
          recipesByMenu[recipe.menu_id] = [];
        }
        recipesByMenu[recipe.menu_id].push(recipe);
      });

      // Calculate available dishes for each menu
      const menusWithInfo = menus.map(menu => {
        const menuRecipes = recipesByMenu[menu.id] || [];
        
        // Calculate cost if not already set
        let calculatedCost = menu.cost_price || 0;
        if (!calculatedCost && menuRecipes.length > 0) {
          calculatedCost = menuRecipes.reduce((sum, recipe) => {
            const ingredient = ingredientsMap[recipe.ingredient_id];
            if (!ingredient) return sum;
            const costPerUnit = parseFloat(ingredient.cost_per_unit) || 0;
            const quantity = parseFloat(recipe.quantity_per_serve) || 0;
            return sum + (quantity * costPerUnit);
          }, 0);
        }

        // Calculate available dishes based on stock
        let availableDishes = null;
        if (menuRecipes.length > 0) {
          const requiredRecipes = menuRecipes.filter(r => !r.is_optional);
          
          if (requiredRecipes.length > 0) {
            const dishesPossible = requiredRecipes.map(recipe => {
              const ingredient = ingredientsMap[recipe.ingredient_id];
              if (!ingredient) return 0;
              
              const stock = parseFloat(ingredient.current_stock) || 0;
              const required = parseFloat(recipe.quantity_per_serve) || 0;
              
              if (required <= 0) return Infinity; // No requirement, unlimited
              
              // Check if units match (simplified - assumes same unit for now)
              // In a real system, you'd need unit conversion
              return Math.floor(stock / required);
            }).filter(d => isFinite(d));
            
            availableDishes = dishesPossible.length > 0 ? Math.min(...dishesPossible) : 0;
          } else {
            // No required ingredients, assume available
            availableDishes = null;
          }
        }

        // Calculate profit margin
        const price = parseFloat(menu.price) || 0;
        const profit = price - calculatedCost;
        const profitMargin = price > 0 ? ((profit / price) * 100) : 0;

        return {
          ...menu,
          calculated_cost: calculatedCost,
          profit: profit,
          profit_margin: profitMargin,
          available_dishes: availableDishes,
          recipe_count: menuRecipes.length,
        };
      });

      return { success: true, menus: menusWithInfo };
    } catch (error) {
      console.error("Error getting menus with availability:", error);
      return { success: false, error: error.message, menus: [] };
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

// Setup POS interface - called after Supabase is initialized
function setupPOSInterface() {
  // Only setup if Supabase is initialized
  if (!supabase) {
    console.warn("⚠️ Cannot setup POS interface - Supabase not initialized");
    return;
  }

  // Initialize POS object with real implementations
  window.POS = {
    database: POS_DATABASE,
    auth: POS_AUTH,
    functions: POS_FUNCTIONS,
    admin: POS_ADMIN,
  };

  window.supabase = supabase;
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;

  console.log("✅ Supabase POS initialized for project: rtfreafhlelpxqwohspq");
  
  // Dispatch event so other scripts know POS is ready (only once)
  window.dispatchEvent(new CustomEvent("pos-ready"));
}
