/**
 * @module classManagerStore
 * @description Central state management for the Class Manager feature.
 * Handles classes, students, and their interactions in a reactive way.
 * Uses Svelte 5 runes ($state, $derived, $effect) for reactivity.
 */

import type { Class } from '$lib/schemas/class';
import type { Student } from '$lib/schemas/student';
import type { Document } from '$lib/schemas/document';
import { db } from '$lib/firebase/client';
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    doc, 
    updateDoc, 
    addDoc, 
    deleteDoc, 
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';

/**
 * Core state containing all class management-related data.
 * Using $state rune for reactivity across components.
 */
const classState = $state({
    // Class data
    classes: [] as Class[],
    selectedClass: null as Class | null,
    
    // Student data
    students: [] as Student[],
    selectedStudent: null as Student | null,
    
    // Document data for selected student
    documents: [] as Document[],
    documentCounts: {} as Record<string, number>,
    
    // UI state
    isLoading: false,
    isProcessing: false,
    error: null as string | null,
    
    // Form states
    isEditingClass: false,
    isAddingStudent: false,
    isEditingStudent: false,
    
    // Confirmation dialogs
    showDeleteClassConfirm: false,
    showDeleteStudentConfirm: false,
    
    // User context
    currentUser: null as App.Locals['user'] | null,
    currentUid: null as string | null
});

// Track active listeners for proper cleanup
const activeListeners = {
    classes: null as (() => void) | null,
    students: null as (() => void) | null,
    documents: null as (() => void) | null
};

/**
 * Clean up all active listeners
 */
function cleanupListeners() {
    Object.keys(activeListeners).forEach((key) => {
        const typedKey = key as keyof typeof activeListeners;
        if (activeListeners[typedKey]) {
            activeListeners[typedKey]!();
            activeListeners[typedKey] = null;
        }
    });
}

/**
 * Initialize the store with user data
 * @param user - The current user
 * @param uid - The current user's UID
 * @returns A cleanup function to unsubscribe all listeners
 */
function initializeWithUser(user: App.Locals['user'], uid: string) {
    // Clean up any existing listeners first
    cleanupListeners();
    
    // Store user data
    classState.currentUser = user;
    classState.currentUid = uid;
    
    // Load classes for the user
    loadClassesForUser(uid);
    
    // Return cleanup function
    return cleanupListeners;
}

/**
 * Load classes for the current user
 * @param uid - The user ID to load classes for
 */
function loadClassesForUser(uid: string) {
    // Clean up any existing listener
    if (activeListeners.classes) {
        activeListeners.classes();
        activeListeners.classes = null;
    }
    
    if (!uid || !classState.currentUser?.classes || classState.currentUser.classes.length === 0) {
        classState.classes = [];
        classState.isLoading = false;
        return;
    }
    
    classState.isLoading = true;
    classState.error = null;
    
    try {
        // Log the classes array for debugging
        console.log('Loading classes for user:', {
            uid,
            classesCount: classState.currentUser.classes.length,
            classes: classState.currentUser.classes
        });
        
        // Check if classes array is valid for the 'in' operator (must be an array with valid values)
        if (!Array.isArray(classState.currentUser.classes)) {
            console.error('Classes is not an array:', classState.currentUser.classes);
            classState.error = 'Invalid classes data. Please try again.';
            classState.isLoading = false;
            return;
        }
        
        // Filter out any null, undefined, or invalid values
        const validClassIds = classState.currentUser.classes.filter((id: string) =>
            id && typeof id === 'string' && id.trim() !== ''
        );
        
        // If no valid class IDs, return empty array
        if (validClassIds.length === 0) {
            classState.classes = [];
            classState.isLoading = false;
            return;
        }
        
        // Create the query with valid class IDs
        const classesQuery = query(
            collection(db, 'classes'),
            where('id', 'in', validClassIds)
        );
        
        // Store the listener for later cleanup
        activeListeners.classes = onSnapshot(
            classesQuery,
            (snapshot) => {
                classState.classes = snapshot.docs.map((docSnapshot) => {
                    const data = docSnapshot.data();
                    return {
                        ...data,
                        id: docSnapshot.id,
                        metadata: {
                            createdAt: data.metadata?.createdAt instanceof Timestamp 
                                ? data.metadata.createdAt.toDate() 
                                : new Date(),
                            updatedAt: data.metadata?.updatedAt instanceof Timestamp 
                                ? data.metadata.updatedAt.toDate() 
                                : new Date()
                        }
                    } as Class;
                });
                
                classState.isLoading = false;
                
                // If there was a selected class that's been updated, update it
                if (classState.selectedClass) {
                    const updatedClass = classState.classes.find(
                        c => c.id === classState.selectedClass?.id
                    );
                    if (updatedClass) {
                        classState.selectedClass = updatedClass;
                    }
                }
            },
            (err) => {
                console.error('Firestore error:', err);
                classState.classes = [];
                classState.error = 'Failed to load classes. Please try again.';
                classState.isLoading = false;
            }
        );
    } catch (err) {
        console.error('Error loading classes from Firestore:', err);
        classState.classes = [];
        classState.error = 'Failed to load classes. Please try again.';
        classState.isLoading = false;
    }
}

/**
 * Load students for the selected class
 */
function loadStudentsForClass() {
    // Clean up any existing student listener
    if (activeListeners.students) {
        activeListeners.students();
        activeListeners.students = null;
    }
    
    // If no class is selected, clear students and return
    if (!classState.selectedClass) {
        classState.students = [];
        return;
    }
    
    classState.isLoading = true;
    
    try {
        const studentsQuery = query(
            collection(db, 'students'),
            where('classId', '==', classState.selectedClass.id),
            where('status', '==', 'active')
        );
        
        // Store the listener for later cleanup
        activeListeners.students = onSnapshot(
            studentsQuery,
            (snapshot) => {
                classState.students = snapshot.docs.map((docSnapshot) => {
                    const data = docSnapshot.data();
                    return {
                        ...data,
                        id: docSnapshot.id,
                        metadata: {
                            createdAt: data.metadata?.createdAt instanceof Timestamp 
                                ? data.metadata.createdAt.toDate() 
                                : new Date(),
                            updatedAt: data.metadata?.updatedAt instanceof Timestamp 
                                ? data.metadata.updatedAt.toDate() 
                                : new Date()
                        }
                    } as Student;
                });
                
                classState.isLoading = false;
                
                // Update document counts after loading students
                updateDocumentCounts();
                
                // If there was a selected student that's been updated, update it
                if (classState.selectedStudent) {
                    const updatedStudent = classState.students.find(
                        s => s.id === classState.selectedStudent?.id
                    );
                    if (updatedStudent) {
                        classState.selectedStudent = updatedStudent;
                    }
                }
            },
            (err) => {
                console.error('Firestore error:', err);
                classState.students = [];
                classState.error = 'Failed to load students. Please try again.';
                classState.isLoading = false;
            }
        );
    } catch (err) {
        console.error('Error loading students from Firestore:', err);
        classState.students = [];
        classState.error = 'Failed to load students. Please try again.';
        classState.isLoading = false;
    }
}

/**
 * Load documents for the selected student
 */
function loadDocumentsForStudent() {
    // Clean up any existing document listener
    if (activeListeners.documents) {
        activeListeners.documents();
        activeListeners.documents = null;
    }
    
    // If no student is selected, clear documents and return
    if (!classState.selectedStudent) {
        classState.documents = [];
        return;
    }
    
    try {
        const documentsQuery = query(
            collection(db, 'documents'),
            where('studentId', '==', classState.selectedStudent.id),
            where('status', '==', 'completed')
        );
        
        // Store the listener for later cleanup
        activeListeners.documents = onSnapshot(
            documentsQuery,
            (snapshot) => {
                classState.documents = snapshot.docs.map((docSnapshot) => {
                    const data = docSnapshot.data();
                    return {
                        ...data,
                        id: docSnapshot.id,
                        createdAt: data.createdAt instanceof Timestamp 
                            ? data.createdAt.toDate() 
                            : new Date(),
                        updatedAt: data.updatedAt instanceof Timestamp 
                            ? data.updatedAt.toDate() 
                            : new Date()
                    } as Document;
                });
                
                // Also update document counts
                updateDocumentCounts();
            },
            (err) => {
                console.error('Error fetching documents:', err);
                classState.error = 'Failed to load documents. Please try again.';
                classState.documents = [];
            }
        );
    } catch (err) {
        console.error('Error loading documents from Firestore:', err);
        classState.documents = [];
        classState.error = 'Failed to load documents. Please try again.';
    }
}

/**
 * Update document counts for all students in the selected class
 */
function updateDocumentCounts() {
    if (classState.students.length === 0) {
        classState.documentCounts = {};
        return;
    }
    
    // Get all documents for the selected class
    const selectedClassId = classState.selectedClass?.id;
    if (!selectedClassId) return;
    
    try {
        const documentsQuery = query(
            collection(db, 'documents'),
            where('status', '!=', 'staged')
        );
        
        // One-time listener for document counts
        const unsubscribe = onSnapshot(
            documentsQuery,
            (snapshot) => {
                const documents = snapshot.docs.map((doc) => doc.data() as Document);
                const studentIds = classState.students.map(student => student.id);
                const counts: Record<string, number> = {};
                
                for (const doc of documents) {
                    if (studentIds.includes(doc.studentId)) {
                        counts[doc.studentId] = (counts[doc.studentId] || 0) + 1;
                    }
                }
                
                classState.documentCounts = counts;
                
                // Cleanup this one-time listener
                unsubscribe();
            },
            (err) => {
                console.error('Error fetching documents for counts:', err);
            }
        );
    } catch (err) {
        console.error('Error updating document counts:', err);
    }
}

/**
 * Select a class and load its students
 * @param classData - The class to select
 */
function selectClass(classData: Class | null) {
    // Deselect everything first to clear state
    if (!classData) {
        classState.selectedClass = null;
        classState.selectedStudent = null;
        classState.students = [];
        classState.documents = [];
        classState.isEditingClass = false;
        classState.isAddingStudent = false;
        classState.isEditingStudent = false;
        return;
    }
    
    // Set the selected class
    classState.selectedClass = classData;
    classState.selectedStudent = null;
    classState.documents = [];
    classState.isEditingClass = false;
    classState.isAddingStudent = false;
    classState.isEditingStudent = false;
    
    // Load students for this class
    loadStudentsForClass();
}

/**
 * Select a student and load their documents
 * @param student - The student to select
 */
function selectStudent(student: Student | null) {
    classState.selectedStudent = student;
    classState.isEditingClass = false;
    classState.isAddingStudent = false;
    classState.isEditingStudent = false;
    
    if (student) {
        loadDocumentsForStudent();
    } else {
        classState.documents = [];
    }
}

/**
 * Start editing a class
 * @param classData - The class to edit (if null, creates a new class)
 */
function editClass(classData: Class | null = null) {
    if (classData) {
        classState.selectedClass = classData;
        classState.isEditingClass = true;
    } else {
        // Creating a new class
        classState.selectedClass = null;
        classState.selectedStudent = null;
        classState.isEditingClass = true;
    }
    
    classState.isAddingStudent = false;
    classState.isEditingStudent = false;
}

/**
 * Start adding a new student to the selected class
 */
function addStudent() {
    if (!classState.selectedClass) return;
    
    classState.isAddingStudent = true;
    classState.isEditingClass = false;
    classState.isEditingStudent = false;
}

/**
 * Start editing a student
 * @param student - The student to edit
 */
function editStudent(student: Student) {
    if (!student) return;
    
    classState.selectedStudent = student;
    classState.isEditingStudent = true;
    classState.isAddingStudent = false;
    classState.isEditingClass = false;
}

/**
 * Cancel any editing or adding operations
 */
function cancelOperation() {
    classState.isEditingClass = false;
    classState.isAddingStudent = false;
    classState.isEditingStudent = false;
}

/**
 * Show the delete class confirmation dialog
 */
function showDeleteClassDialog() {
    classState.showDeleteClassConfirm = true;
}

/**
 * Show the delete student confirmation dialog
 */
function showDeleteStudentDialog() {
    classState.showDeleteStudentConfirm = true;
}

/**
 * Cancel delete confirmations
 */
function cancelDelete() {
    classState.showDeleteClassConfirm = false;
    classState.showDeleteStudentConfirm = false;
}

/**
 * Create or update a class
 * @param classData - The class data to save
 */
async function saveClass(classData: Partial<Class>) {
    classState.isProcessing = true;
    
    try {
        if (classData.id) {
            // Update existing class
            await updateDoc(doc(db, 'classes', classData.id), {
                ...classData,
                'metadata.updatedAt': serverTimestamp()
            });
        } else {
            // Create new class
            const newClassRef = await addDoc(collection(db, 'classes'), {
                ...classData,
                students: [],
                status: 'active',
                metadata: {
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            });
            
            // Also update user's classes array
            if (classState.currentUser && classState.currentUid) {
                const userRef = doc(db, 'users', classState.currentUid);
                
                // Update the user document in Firestore
                const updatedClasses = [...(classState.currentUser.classes || []), newClassRef.id];
                await updateDoc(userRef, {
                    classes: updatedClasses
                });
                
                // Update the local user object to ensure reactivity
                classState.currentUser = {
                    ...classState.currentUser,
                    classes: updatedClasses
                };
                
                // No need to force reload classes - the Firestore listener will handle updates
                // This matches the pattern used for students, which works correctly
            }
        }
        
        // Exit edit mode
        classState.isEditingClass = false;
        classState.error = null;
        
        return true;
    } catch (err) {
        console.error('Error saving class:', err);
        classState.error = 'Failed to save class. Please try again.';
        return false;
    } finally {
        classState.isProcessing = false;
    }
}

/**
 * Create or update a student
 * @param studentData - The student data to save
 */
async function saveStudent(studentData: Partial<Student>) {
    classState.isProcessing = true;
    
    try {
        if (studentData.id) {
            // Update existing student
            await updateDoc(doc(db, 'students', studentData.id), {
                ...studentData,
                'metadata.updatedAt': serverTimestamp()
            });
        } else {
            // Create new student
            const newStudentRef = await addDoc(collection(db, 'students'), {
                ...studentData,
                notes: [],
                status: 'active',
                metadata: {
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            });
            
            // Update class's students array
            if (classState.selectedClass) {
                const classRef = doc(db, 'classes', classState.selectedClass.id);
                await updateDoc(classRef, {
                    students: [...(classState.selectedClass.students || []), newStudentRef.id]
                });
            }
        }
        
        // Exit edit mode
        classState.isAddingStudent = false;
        classState.isEditingStudent = false;
        classState.error = null;
        
        return true;
    } catch (err) {
        console.error('Error saving student:', err);
        classState.error = 'Failed to save student. Please try again.';
        return false;
    } finally {
        classState.isProcessing = false;
    }
}

/**
 * Delete the selected class
 */
async function deleteClass() {
    if (!classState.selectedClass) return false;
    
    classState.isProcessing = true;
    
    try {
        // Delete the class document
        await deleteDoc(doc(db, 'classes', classState.selectedClass.id));
        
        // Remove from user's classes array
        if (classState.currentUser && classState.currentUid) {
            const userRef = doc(db, 'users', classState.currentUid);
            const updatedClasses = classState.currentUser.classes?.filter(
                (id: string) => id !== classState.selectedClass?.id
            ) || [];
            
            // Update Firestore user document
            await updateDoc(userRef, {
                classes: updatedClasses
            });
            
            // Update local user object to ensure reactivity
            classState.currentUser = {
                ...classState.currentUser,
                classes: updatedClasses
            };
            
            console.log('Updated user classes after deletion:', {
                deletedClassId: classState.selectedClass?.id,
                updatedClassesCount: updatedClasses.length,
                updatedClasses
            });
        }
        
        // Reset state
        classState.selectedClass = null;
        classState.selectedStudent = null;
        classState.students = [];
        classState.documents = [];
        classState.showDeleteClassConfirm = false;
        classState.error = null;
        
        return true;
    } catch (err) {
        console.error('Error deleting class:', err);
        classState.error = 'Failed to delete class. Please try again.';
        return false;
    } finally {
        classState.isProcessing = false;
    }
}

/**
 * Delete the selected student
 */
async function deleteStudent() {
    if (!classState.selectedStudent) return false;
    
    classState.isProcessing = true;
    
    try {
        // Delete the student document
        await deleteDoc(doc(db, 'students', classState.selectedStudent.id));
        
        // Remove from class's students array
        if (classState.selectedClass) {
            const classRef = doc(db, 'classes', classState.selectedClass.id);
            const updatedStudents = classState.selectedClass.students?.filter(
                id => id !== classState.selectedStudent?.id
            ) || [];
            
            await updateDoc(classRef, {
                students: updatedStudents
            });
        }
        
        // Reset state
        classState.selectedStudent = null;
        classState.documents = [];
        classState.showDeleteStudentConfirm = false;
        classState.error = null;
        
        return true;
    } catch (err) {
        console.error('Error deleting student:', err);
        classState.error = 'Failed to delete student. Please try again.';
        return false;
    } finally {
        classState.isProcessing = false;
    }
}

/**
 * The class manager store object, containing functions and state for managing classes and students.
 */
export const classManagerStore = {
    // Classes
    get classes() {
        return classState.classes;
    },
    get selectedClass() {
        return classState.selectedClass;
    },
    
    // Students
    get students() {
        return classState.students;
    },
    get selectedStudent() {
        return classState.selectedStudent;
    },
    
    // Documents
    get documents() {
        return classState.documents;
    },
    get documentCounts() {
        return classState.documentCounts;
    },
    
    // UI State
    get isLoading() {
        return classState.isLoading;
    },
    get isProcessing() {
        return classState.isProcessing;
    },
    get error() {
        return classState.error;
    },
    
    // Form States
    get isEditingClass() {
        return classState.isEditingClass;
    },
    set isEditingClass(value: boolean) {
        classState.isEditingClass = value;
    },
    
    get isAddingStudent() {
        return classState.isAddingStudent;
    },
    set isAddingStudent(value: boolean) {
        classState.isAddingStudent = value;
    },
    
    get isEditingStudent() {
        return classState.isEditingStudent;
    },
    set isEditingStudent(value: boolean) {
        classState.isEditingStudent = value;
    },
    
    // Confirmation Dialogs
    get showDeleteClassConfirm() {
        return classState.showDeleteClassConfirm;
    },
    set showDeleteClassConfirm(value: boolean) {
        classState.showDeleteClassConfirm = value;
    },
    
    get showDeleteStudentConfirm() {
        return classState.showDeleteStudentConfirm;
    },
    set showDeleteStudentConfirm(value: boolean) {
        classState.showDeleteStudentConfirm = value;
    },
    
    // Initialize
    initializeWithUser,
    
    // Class operations
    selectClass,
    editClass,
    saveClass,
    deleteClass,

    // Access to current user ID
    get currentUid() {
        return classState.currentUid;
    },
    
    // Student operations
    selectStudent,
    addStudent,
    editStudent,
    saveStudent,
    deleteStudent,
    
    // UI operations
    cancelOperation,
    showDeleteClassDialog,
    showDeleteStudentDialog,
    cancelDelete
};