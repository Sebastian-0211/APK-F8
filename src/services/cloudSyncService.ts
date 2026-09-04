import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AutoPart, StockMovement, SaleInvoice, RackConfig, Promotion } from '../types';

export type SyncStatus = 'connecting' | 'synced' | 'syncing' | 'offline' | 'error';

/**
 * Remove undefined values recursively because Firestore throws an error if an object contains undefined.
 */
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// -------------------------------------------------------------
// Real-Time Subscriptions
// -------------------------------------------------------------

export function subscribeToParts(
  onData: (parts: AutoPart[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collPath = 'parts';
  const collRef = collection(db, collPath);

  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: AutoPart[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as AutoPart;
        items.push({
          ...d,
          id: docSnap.id,
          compatibleVehicles: Array.isArray(d.compatibleVehicles) ? d.compatibleVehicles : [],
        });
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, collPath);
    }
  );
}

export function subscribeToMovements(
  onData: (movements: StockMovement[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collPath = 'movements';
  const collRef = collection(db, collPath);

  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: StockMovement[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as StockMovement),
          id: docSnap.id,
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, collPath);
    }
  );
}

export function subscribeToSales(
  onData: (sales: SaleInvoice[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collPath = 'sales';
  const collRef = collection(db, collPath);

  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: SaleInvoice[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as SaleInvoice;
        items.push({
          ...d,
          id: docSnap.id,
          items: Array.isArray(d.items) ? d.items : [],
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, collPath);
    }
  );
}

export function subscribeToRacks(
  onData: (racks: RackConfig[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collPath = 'racks';
  const collRef = collection(db, collPath);

  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: RackConfig[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as RackConfig);
      });
      items.sort((a, b) => a.rackNumber - b.rackNumber);
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, collPath);
    }
  );
}

export function subscribeToPromotions(
  onData: (promos: Promotion[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collPath = 'promotions';
  const collRef = collection(db, collPath);

  return onSnapshot(
    collRef,
    (snapshot) => {
      const items: Promotion[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Promotion),
          id: docSnap.id,
        });
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, collPath);
    }
  );
}

// -------------------------------------------------------------
// Cloud Persistence Mutations
// -------------------------------------------------------------

export async function savePartToCloud(part: AutoPart): Promise<void> {
  const path = `parts/${part.id}`;
  try {
    const docRef = doc(db, 'parts', part.id);
    await setDoc(docRef, sanitizeForFirestore(part), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePartFromCloud(partId: string): Promise<void> {
  const path = `parts/${partId}`;
  try {
    const docRef = doc(db, 'parts', partId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveMovementToCloud(movement: StockMovement): Promise<void> {
  const path = `movements/${movement.id}`;
  try {
    const docRef = doc(db, 'movements', movement.id);
    await setDoc(docRef, sanitizeForFirestore(movement));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function saveSaleToCloud(sale: SaleInvoice): Promise<void> {
  const path = `sales/${sale.id}`;
  try {
    const docRef = doc(db, 'sales', sale.id);
    await setDoc(docRef, sanitizeForFirestore(sale));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function saveRacksToCloud(racks: RackConfig[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const r of racks) {
      const docRef = doc(db, 'racks', `rack-${r.rackNumber}`);
      batch.set(docRef, sanitizeForFirestore(r));
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'racks');
  }
}

export async function savePromotionToCloud(promo: Promotion): Promise<void> {
  const path = `promotions/${promo.id}`;
  try {
    const docRef = doc(db, 'promotions', promo.id);
    await setDoc(docRef, sanitizeForFirestore(promo));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Initial Data Seeding (runs once if Firestore is empty)
// -------------------------------------------------------------

export async function seedInitialDataIfEmpty(
  initialParts: AutoPart[],
  initialMovements: StockMovement[],
  initialSales: SaleInvoice[],
  initialRacks: RackConfig[],
  initialPromotions: Promotion[]
): Promise<boolean> {
  try {
    const partsSnapshot = await getDocs(collection(db, 'parts'));
    if (!partsSnapshot.empty) {
      // Cloud database already contains data
      return false;
    }

    console.log('🌱 Base de datos vacía. Sembrando datos iniciales en la nube para gemelos digitales...');
    
    // Seed parts
    const partsBatch = writeBatch(db);
    initialParts.forEach((p) => {
      const docRef = doc(db, 'parts', p.id);
      partsBatch.set(docRef, sanitizeForFirestore(p));
    });
    await partsBatch.commit();

    // Seed racks
    const racksBatch = writeBatch(db);
    initialRacks.forEach((r) => {
      const docRef = doc(db, 'racks', `rack-${r.rackNumber}`);
      racksBatch.set(docRef, sanitizeForFirestore(r));
    });
    await racksBatch.commit();

    // Seed movements
    const movementsBatch = writeBatch(db);
    initialMovements.forEach((m) => {
      const docRef = doc(db, 'movements', m.id);
      movementsBatch.set(docRef, sanitizeForFirestore(m));
    });
    await movementsBatch.commit();

    // Seed sales
    const salesBatch = writeBatch(db);
    initialSales.forEach((s) => {
      const docRef = doc(db, 'sales', s.id);
      salesBatch.set(docRef, sanitizeForFirestore(s));
    });
    await salesBatch.commit();

    // Seed promotions
    const promosBatch = writeBatch(db);
    initialPromotions.forEach((pr) => {
      const docRef = doc(db, 'promotions', pr.id);
      promosBatch.set(docRef, sanitizeForFirestore(pr));
    });
    await promosBatch.commit();

    console.log('✅ Catálogo inicial sincronizado en la nube.');
    return true;
  } catch (err) {
    console.error('Error sembrando catálogo inicial en Firestore:', err);
    return false;
  }
}
