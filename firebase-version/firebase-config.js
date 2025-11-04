// Firebase Configuration (Compat SDK)
// Ensure index includes firebase compat scripts before this file

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALxB-ZYbtekHa5HBW7NAfQSr1Oui-VHCA",
  authDomain: "pos-agent-8767b.firebaseapp.com",
  projectId: "pos-agent-8767b",
  storageBucket: "pos-agent-8767b.firebasestorage.app",
  messagingSenderId: "601195275617",
  appId: "1:601195275617:web:701350ae108687f2f6d120",
  measurementId: "G-RKJFJZ09SQ",
};

// Enable Firestore offline persistence for better reliability
firebase
  .firestore()
  .enablePersistence({
    synchronizeTabs: true,
  })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "Firestore persistence: Multiple tabs open, persistence can only be enabled in one tab at a time.",
      );
    } else if (err.code === "unimplemented") {
      console.warn(
        "Firestore persistence: The current browser does not support persistence.",
      );
    }
  });

if (typeof firebase === "undefined") {
  console.error(
    "Firebase SDK not loaded. Make sure compat scripts are included before firebase-config.js",
  );
} else {
  // Initialize Firebase (compat)
  firebase.initializeApp(firebaseConfig);

  // Initialize services and expose globals
  const db = firebase.firestore();
  const auth = firebase.auth();
  const storage = firebase.storage();

  window.firebaseDB = db;
  window.firebaseAuth = auth;
  window.firebaseStorage = storage;

  // POS Database References
  const POS_DATABASE = {
    // Core collections
    ingredients: db.collection("ingredients"),
    menus: db.collection("menus"),
    menuRecipes: db.collection("menuRecipes"),
    purchases: db.collection("purchases"), // expenses
    sales: db.collection("sales"), // revenue
    users: db.collection("users"),
    stocks: db.collection("stocks"),

    // Extended bookkeeping (aligning to your sheet tabs)
    expenses: db.collection("expenses"),
    costCenters: db.collection("costCenters"),
    packaging: db.collection("packaging"),
    lots: db.collection("lots"),
    platforms: db.collection("platforms"),
    laborLogs: db.collection("laborLogs"),
    waste: db.collection("waste"),
    marketRuns: db.collection("marketRuns"),
    marketRunItems: db.collection("marketRunItems"),
    cogs: db.collection("cogs"),
    packing: db.collection("packing"),
    packingPurchases: db.collection("packingPurchases"),
    overheads: db.collection("overheads"),
    menuExtras: db.collection("menuExtras"),
    batchCostLines: db.collection("batchCostLines"),
    batches: db.collection("batches"),

    // Real-time listeners
    subscribeToLowStock: (callback) => {
      // Listen to stocks and filter where current_stock <= min_stock
      const unsubscribe = db.collection("stocks").onSnapshot(
        (snap) => {
          const filtered = { docs: [] };
          snap.forEach((doc) => {
            const d = doc.data();
            if (
              (d.current_stock ?? 0) <= (d.min_stock ?? Number.MAX_SAFE_INTEGER)
            ) {
              filtered.docs.push({ id: doc.id, data: () => d });
            }
          });
          // Build a light snapshot-like object for existing callbacks
          filtered.empty = filtered.docs.length === 0;
          callback({
            empty: filtered.empty,
            forEach: (fn) => filtered.docs.forEach(fn),
          });
        },
        (error) => {
          console.error("Low stock listener error:", error);
          // Callback with empty data on error
          callback({ empty: true, forEach: () => {} });
        },
      );
      return unsubscribe;
    },

    subscribeToPurchases: (callback) => {
      const unsubscribe = db
        .collection("purchases")
        .orderBy("date", "desc")
        .limit(50)
        .onSnapshot(callback, (error) => {
          console.error("Purchases listener error:", error);
          // Callback with empty data on error
          callback({ empty: true, forEach: () => {} });
        });
      return unsubscribe;
    },
  };

  // Authentication helpers
  const POS_AUTH = {
    getCurrentUser: () => auth.currentUser,
    signIn: async (email, password) =>
      auth.signInWithEmailAndPassword(email, password),
    signInWithGoogle: async () => {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        // Add additional scopes if needed
        provider.addScope("email");
        provider.addScope("profile");

        // Set custom parameters for better UX
        provider.setCustomParameters({
          prompt: "select_account",
        });

        return await auth.signInWithPopup(provider);
      } catch (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }
    },
    signOut: async () => auth.signOut(),
    onAuthStateChanged: (callback) => auth.onAuthStateChanged(callback),
  };

  // Cloud Functions equivalents (client-side implementations)
  const POS_FUNCTIONS = {
    calculateMenuCost: async (menuId) => {
      try {
        const menuDoc = await db.collection("menus").doc(menuId).get();
        if (!menuDoc.exists) return 0;

        const recipeSnapshot = await db
          .collection("menuRecipes")
          .where("menu_id", "==", menuId)
          .get();

        let totalCost = 0;
        recipeSnapshot.forEach((doc) => {
          const recipe = doc.data();
          totalCost += recipe.qty_per_serve * recipe.cost_per_unit || 0;
        });

        return totalCost;
      } catch (error) {
        console.error("Error calculating menu cost:", error);
        return 0;
      }
    },

    processSale: async (saleData) => {
      try {
        // Add additional validation and metadata
        const saleWithMeta = {
          ...saleData,
          user_id: auth.currentUser?.uid,
          user_email: auth.currentUser?.email,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          created_at: new Date().toISOString(),
          status: "completed",
        };

        const saleRef = await db.collection("sales").add(saleWithMeta);
        await updateStockAfterSale(saleData);
        return { success: true, saleId: saleRef.id };
      } catch (error) {
        console.error("Error processing sale:", error);
        return { success: false, error: error.message };
      }
    },

    processPurchase: async (purchaseData) => {
      try {
        // Add additional validation and metadata
        const purchaseWithMeta = {
          ...purchaseData,
          user_id: auth.currentUser?.uid,
          user_email: auth.currentUser?.email,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          created_at: new Date().toISOString(),
          status: "completed",
        };

        const purchaseRef = await db
          .collection("purchases")
          .add(purchaseWithMeta);
        await updateStockAfterPurchase(purchaseData);
        return { success: true, purchaseId: purchaseRef.id };
      } catch (error) {
        console.error("Error processing purchase:", error);
        return { success: false, error: error.message };
      }
    },
  };

  async function updateStockAfterSale(saleData) {
    console.log("Updating stock after sale:", saleData);
  }

  async function updateStockAfterPurchase(purchaseData) {
    console.log("Updating stock after purchase:", purchaseData);
  }

  // Export for global use
  const POS_ADMIN = {
    // Seed minimal reference data similar to your sheet structure
    seedIngredients: async (rows = []) => {
      // rows: [{ name, unit, min_stock, current_stock }]
      const batch = db.batch();
      rows.forEach((r) => {
        const ref = db.collection("ingredients").doc();
        batch.set(ref, {
          name: r.name,
          unit: r.unit || "",
          min_stock: Number(r.min_stock ?? 0),
          current_stock: Number(r.current_stock ?? 0),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        // Mirror to stocks if you keep a separate stocks collection
        const stockRef = db.collection("stocks").doc(ref.id);
        batch.set(stockRef, {
          ingredient_id: ref.id,
          name: r.name,
          current_stock: Number(r.current_stock ?? 0),
          min_stock: Number(r.min_stock ?? 0),
          need_reorder:
            Number(r.current_stock ?? 0) <= Number(r.min_stock ?? 0),
        });
      });
      await batch.commit();
    },
    seedMenus: async (menus = []) => {
      // menus: [{ name, price }]
      const batch = db.batch();
      menus.forEach((m) => {
        const ref = db.collection("menus").doc();
        batch.set(ref, {
          name: m.name,
          price: Number(m.price ?? 0),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    },
    seedPlatforms: async (
      platforms = ["ร้าน", "Grab", "FoodPanda", "Line Man"],
    ) => {
      const batch = db.batch();
      platforms.forEach((p) => {
        const ref = db.collection("platforms").doc(p);
        batch.set(ref, { name: p });
      });
      await batch.commit();
    },
  };

  window.POS = {
    database: POS_DATABASE,
    auth: POS_AUTH,
    functions: POS_FUNCTIONS,
    admin: POS_ADMIN,
  };

  console.log("Firebase POS initialized");
}
