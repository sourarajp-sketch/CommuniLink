import { 
  collection, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  serverTimestamp,
  getDocs,
  limit
} from "firebase/firestore";
import { db, auth } from "./firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const issuesCollection = collection(db, "issues");
export const volunteersCollection = collection(db, "volunteers");
export const assignmentsCollection = collection(db, "assignments");

export const FirestoreService = {
  // --- Issues ---
  async reportIssue(issue: any) {
    try {
      return await addDoc(issuesCollection, {
        ...issue,
        reportedBy: auth.currentUser?.uid,
        reportedAt: serverTimestamp(),
        status: "Open"
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "issues");
    }
  },

  subscribeToIssues(callback: (issues: any[]) => void) {
    const q = query(issuesCollection, orderBy("reportedAt", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(issues);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "issues"));
  },

  // --- Volunteers ---
  async saveVolunteerProfile(profile: any) {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, "volunteers", auth.currentUser.uid);
      return await setDoc(docRef, {
        ...profile,
        userId: auth.currentUser.uid,
        status: profile.status || "Available"
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "volunteers");
    }
  },

  async updateIssueStatus(issueId: string, status: string) {
    try {
      const docRef = doc(db, "issues", issueId);
      return await updateDoc(docRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "issues");
    }
  },

  async deleteIssue(issueId: string) {
    try {
      const docRef = doc(db, "issues", issueId);
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "issues");
    }
  },

  async clearAllData() {
    try {
      const issueSnap = await getDocs(collection(db, "issues"));
      const volunteerSnap = await getDocs(collection(db, "volunteers"));
      
      const deletions = [
        ...issueSnap.docs.map(d => deleteDoc(doc(db, "issues", d.id))),
        ...volunteerSnap.docs.map(d => deleteDoc(doc(db, "volunteers", d.id)))
      ];
      
      await Promise.all(deletions);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "system");
    }
  },

  async assignVolunteer(issueId: string, volunteerId: string) {
    try {
      const issueRef = doc(db, "issues", issueId);
      const volunteerRef = doc(db, "volunteers", volunteerId);

      // Batch or sequence: 1. Set issue to In Progress, 2. Set volunteer to Busy
      await updateDoc(issueRef, {
        status: "In Progress",
        assignedVolunteerId: volunteerId
      });

      await updateDoc(volunteerRef, {
        status: "Busy"
      });

      // Optionally create an assignment record
      await addDoc(assignmentsCollection, {
        issueId,
        volunteerId,
        status: "Assigned",
        assignedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "assignments");
    }
  },

  async markIssueResolved(issueId: string, volunteerId?: string) {
    try {
      const issueRef = doc(db, "issues", issueId);
      await updateDoc(issueRef, { status: "Resolved" });

      if (volunteerId) {
        const volunteerRef = doc(db, "volunteers", volunteerId);
        await updateDoc(volunteerRef, { status: "Available" });
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "issues");
    }
  },

  subscribeToVolunteers(callback: (volunteers: any[]) => void) {
    return onSnapshot(volunteersCollection, (snapshot) => {
      const volunteers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(volunteers);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "volunteers"));
  }
};
