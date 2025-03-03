/**
 * @module classManagerStore
 * @description Central state management for the Class Manager feature.
 * Uses a client-first approach where UI updates happen immediately,
 * and Firestore operations run in the background.
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
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    Timestamp,
    getDocs,
    writeBatch,
    documentId
} from 'firebase/firestore';
import { documentStore } from './documentStore.svelte';

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
    isRefreshing: false,
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

/**
 * Initialize the store with user data
 * @param user - The current user
 * @param uid - The current user's UID
 */
function initializeWithUser(user: App.Locals['user'], uid: string) {
    // Store user data
    classState.currentUser = user;
    classState.currentUid = uid;
    
    // Load classes for the user
    loadClassesForUser(uid);
}

/**
 * Load classes for the current user
 * @param uid - The user ID to load classes for
 */
async function loadClassesForUser(uid: string) {
    if (!uid) {
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
            classesCount: classState.currentUser?.classes?.length || 0,
            classes: classState.currentUser?.classes || []
        });
        
        // Check if classes array exists and is valid
        if (!classState.currentUser?.classes || !Array.isArray(classState.currentUser.classes)) {
            console.log('No classes array or invalid array:', classState.currentUser?.classes);
            classState.classes = [];
            classState.isLoading = false;
            return;
        }
        
        // Filter out any null, undefined, or invalid values
        const validClassIds = classState.currentUser.classes.filter((id: string) =>
            id && typeof id === 'string' && id.trim() !== ''
        );
        
        // If no valid class IDs, return empty array
        if (validClassIds.length === 0) {
            console.log('No valid class IDs found');
            classState.classes = [];
            classState.isLoading = false;
            return;
        }
        
        console.log('Valid class IDs:', validClassIds);
        
        // Create the query with valid class IDs
        const classesQuery = query(
            collection(db, 'classes'),
            where(documentId(), 'in', validClassIds)
        );
        
        // Fetch classes directly without listeners
        const snapshot = await getDocs(classesQuery);
        
        console.log('Classes fetched:', snapshot.size);
        
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
        
        // If there was a selected class that's been updated, update it
        if (classState.selectedClass) {
            const updatedClass = classState.classes.find(
                c => c.id === classState.selectedClass?.id
            );
            if (updatedClass) {
                classState.selectedClass = updatedClass;
            }
        }
    } catch (err) {
        console.error('Error loading classes from Firestore:', err);
        classState.error = 'Failed to load classes. Please try again.';
    } finally {
        classState.isLoading = false;
    }
}

/**
 * Load students for the selected class
 */
async function loadStudentsForClass() {
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
        
        // Fetch students directly without listeners
        const snapshot = await getDocs(studentsQuery);
        
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
        
        // Update document counts after loading students
        await updateDocumentCounts();
        
        // If there was a selected student that's been updated, update it
        if (classState.selectedStudent) {
            const updatedStudent = classState.students.find(
                s => s.id === classState.selectedStudent?.id
            );
            if (updatedStudent) {
                classState.selectedStudent = updatedStudent;
            }
        }
    } catch (err) {
        console.error('Error loading students from Firestore:', err);
        classState.error = 'Failed to load students. Please try again.';
    } finally {
        classState.isLoading = false;
    }
}

/**
 * Load documents for the selected student
 */
/**
 * Load documents for the selected student
 * Uses a more inclusive query that doesn't filter by status
 */
async function loadDocumentsForStudent() {
    // If no student is selected, clear documents and return
    if (!classState.selectedStudent) {
        classState.documents = [];
        return;
    }
    
    // Set loading state to true
    classState.isLoading = true;
    
    try {
        // Query documents for the selected student without status filter
        const documentsQuery = query(
            collection(db, 'documents'),
            where('studentId', '==', classState.selectedStudent.id)
        );
        
        // Fetch documents directly without listeners
        const snapshot = await getDocs(documentsQuery);
        
        // Map the documents and ensure proper date conversion
        const documents = snapshot.docs.map((docSnapshot) => {
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
        
        // Update the state with the fetched documents
        classState.documents = documents;
        
        // Also update document counts
        await updateDocumentCounts();
    } catch (err) {
        console.error('Error loading documents from Firestore:', err);
        classState.error = 'Failed to load documents. Please try again.';
        classState.documents = [];
    } finally {
        // Always set loading state back to false
        classState.isLoading = false;
    }
}

/**
 * Update document counts for all students in the selected class
 */
async function updateDocumentCounts() {
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
        
        // Fetch documents directly without listeners
        const snapshot = await getDocs(documentsQuery);
        
        const documents = snapshot.docs.map((doc) => doc.data() as Document);
        const studentIds = classState.students.map(student => student.id);
        const counts: Record<string, number> = {};
        
        for (const doc of documents) {
            if (studentIds.includes(doc.studentId)) {
                counts[doc.studentId] = (counts[doc.studentId] || 0) + 1;
            }
        }
        
        classState.documentCounts = counts;
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
    // Update the selected student
    classState.selectedStudent = student;
    classState.isEditingClass = false;
    classState.isAddingStudent = false;
    classState.isEditingStudent = false;
    
    if (student) {
        // Clear documents first to avoid showing stale data
        classState.documents = [];
        
        // Load documents for the selected student
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
 * Create or update a class with optimistic updates
 * @param classData - The class data to save
 */
async function saveClass(classData: Partial<Class>) {
    classState.isProcessing = true;
    
    // For new classes, generate a temporary ID that we'll use for both optimistic update and rollback
    const tempId = !classData.id ? `temp_${Date.now()}` : null;
    
    // Store original state for potential rollback
    const originalClasses = [...classState.classes];
    const originalSelectedClass = classState.selectedClass ? { ...classState.selectedClass } : null;
    const originalCurrentUser = classState.currentUser ? { ...classState.currentUser } : null;

    
    try {
        if (classData.id) {
            // Update existing class - optimistic update
            const existingClassIndex = classState.classes.findIndex(c => c.id === classData.id);
            
            if (existingClassIndex !== -1) {
                // Create updated class object
                const updatedClass = {
                    ...classState.classes[existingClassIndex],
                    ...classData,
                    metadata: {
                        ...classState.classes[existingClassIndex].metadata,
                        updatedAt: new Date()
                    }
                };
                
                // Update local state immediately
                const updatedClasses = [...classState.classes];
                updatedClasses[existingClassIndex] = updatedClass as Class;
                classState.classes = updatedClasses;
                
                // If this is the selected class, update it too
                if (classState.selectedClass?.id === classData.id) {
                    classState.selectedClass = updatedClass as Class;
                }
                
                // Create a clean update object without undefined values
                // Using Partial<Class> with a special metadata.updatedAt field
                const updateData: Partial<Omit<Class, 'metadata'>> & {
                    'metadata.updatedAt'?: FirebaseFirestore.FieldValue;
                } = {};
                
                // Only include defined fields
                if (classData.name !== undefined) updateData.name = classData.name;
                if (classData.description !== undefined) updateData.description = classData.description;
                if (classData.status !== undefined) updateData.status = classData.status;
                
                // Always update the updatedAt timestamp
                updateData['metadata.updatedAt'] = serverTimestamp();
                
                // Update in Firestore (background)
                await updateDoc(doc(db, 'classes', classData.id), updateData);
            }
        } else if (tempId) {
            // Create new class with temporary ID for immediate UI update
            const newClass = {
                ...classData,
                id: tempId,
                students: [],
                status: 'active',
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            } as Class;
            
            // Update local state immediately
            classState.classes = [...classState.classes, newClass];
            
            // Create in Firestore (background)
            const newClassRef = await addDoc(collection(db, 'classes'), {
                ...classData,
                id: '', // This will be updated with the document ID after creation
                students: [],
                status: 'active',
                metadata: {
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            });
            
            // Update the document with its own ID
            await updateDoc(doc(db, 'classes', newClassRef.id), {
                id: newClassRef.id
            });
            
            // Update user's classes array in Firestore
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
            }
            
            // Replace temporary class with real one
            classState.classes = classState.classes.map(c =>
                c.id === tempId ? {
                    ...c,
                    id: newClassRef.id
                } : c
            );
        }
        
        // Exit edit mode
        classState.isEditingClass = false;
        classState.error = null;
        
        // Refresh document store with the current user's UID
        documentStore.loadClassesForUser(classState.currentUid || '');
        
        return true;
    } catch (err) {
        console.error('Error saving class:', err);
        classState.error = 'Failed to save class. Please try again.';
        
        // Rollback to original state
        classState.classes = originalClasses;
        classState.selectedClass = originalSelectedClass;
        classState.currentUser = originalCurrentUser;
        
        return false;
    } finally {
        classState.isProcessing = false;
    }
}

/**
 * Create or update a student with optimistic updates
 * @param studentData - The student data to save
 */
async function saveStudent(studentData: Partial<Student>) {
    classState.isProcessing = true;
    
    // For new students, generate a temporary ID that we'll use for both optimistic update and rollback
    const tempId = !studentData.id ? `temp_${Date.now()}` : null;
    
    // Store original state for potential rollback
    const originalStudents = [...classState.students];
    const originalSelectedStudent = classState.selectedStudent ? { ...classState.selectedStudent } : null;
    const originalSelectedClass = classState.selectedClass ? { ...classState.selectedClass } : null;
    
    try {
        if (studentData.id) {
            // Update existing student - optimistic update
            const existingStudentIndex = classState.students.findIndex(s => s.id === studentData.id);
            
            if (existingStudentIndex !== -1) {
                // Create updated student object
                const updatedStudent = {
                    ...classState.students[existingStudentIndex],
                    ...studentData,
                    metadata: {
                        ...classState.students[existingStudentIndex].metadata,
                        updatedAt: new Date()
                    }
                };
                
                // Update local state immediately
                const updatedStudents = [...classState.students];
                updatedStudents[existingStudentIndex] = updatedStudent as Student;
                classState.students = updatedStudents;
                
                // If this is the selected student, update it too
                if (classState.selectedStudent?.id === studentData.id) {
                    classState.selectedStudent = updatedStudent as Student;
                }
                
                // Create a clean update object without undefined values
                const updateData: Partial<Omit<Student, 'metadata'>> & {
                    'metadata.updatedAt'?: FirebaseFirestore.FieldValue;
                } = {};
                
                // Only include defined fields
                if (studentData.name !== undefined) updateData.name = studentData.name;
                if (studentData.description !== undefined) updateData.description = studentData.description;
                if (studentData.status !== undefined) updateData.status = studentData.status;
                if (studentData.notes !== undefined) updateData.notes = studentData.notes;
                
                // Always update the updatedAt timestamp
                updateData['metadata.updatedAt'] = serverTimestamp();
                
                // Update in Firestore (background)
                await updateDoc(doc(db, 'students', studentData.id), updateData);
            }
        } else if (tempId) {
            // Create new student with temporary ID for immediate UI update
            const newStudent = {
                ...studentData,
                id: tempId,
                description: studentData.description || '', // Explicitly include description field
                notes: [],
                status: 'active',
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            } as Student;
            
            // Update local state immediately
            classState.students = [...classState.students, newStudent];
            
            // Create in Firestore (background)
            const newStudentRef = await addDoc(collection(db, 'students'), {
                ...studentData,
                id: '', // This will be updated with the document ID after creation
                description: studentData.description || '', // Explicitly include description field
                notes: [],
                status: 'active',
                metadata: {
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            });
            
            // Update the document with its own ID
            await updateDoc(doc(db, 'students', newStudentRef.id), {
                id: newStudentRef.id
            });
            
            // Update class's students array in Firestore
            if (classState.selectedClass) {
                const classRef = doc(db, 'classes', classState.selectedClass.id);
                
                // Update the class document in Firestore
                const updatedStudents = [...(classState.selectedClass.students || []), newStudentRef.id];
                await updateDoc(classRef, {
                    students: updatedStudents
                });
                
                // Update the local class object to ensure reactivity
                classState.selectedClass = {
                    ...classState.selectedClass,
                    students: updatedStudents
                };
            }
            
            // Replace temporary student with real one
            classState.students = classState.students.map(s =>
                s.id === tempId ? {
                    ...s,
                    id: newStudentRef.id
                } : s
            );
        }
        
        // Exit edit mode
        classState.isAddingStudent = false;
        classState.isEditingStudent = false;
        classState.error = null;
        
        return true;
    } catch (err) {
        console.error('Error saving student:', err);
        classState.error = 'Failed to save student. Please try again.';
        
        // Rollback to original state
        classState.students = originalStudents;
        classState.selectedStudent = originalSelectedStudent;
        classState.selectedClass = originalSelectedClass;
        
        return false;
    } finally {
        classState.isProcessing = false;
    }
}

/**
 * Delete the selected class with optimistic updates
 * Also deletes all associated students
 */
async function deleteClass() {
    if (!classState.selectedClass) return false;
    
    classState.isProcessing = true;
    
    // Store original state for potential rollback
    const originalClasses = [...classState.classes];
    const originalSelectedClass = classState.selectedClass ? { ...classState.selectedClass } : null;
    const originalSelectedStudent = classState.selectedStudent ? { ...classState.selectedStudent } : null;
    const originalStudents = [...classState.students];
    const originalDocuments = [...classState.documents];
    const originalCurrentUser = classState.currentUser ? { ...classState.currentUser } : null;
    const originalShowDeleteClassConfirm = classState.showDeleteClassConfirm;
    
    try {
        const classId = classState.selectedClass.id;
        
        // Update local state immediately
        classState.classes = classState.classes.filter(c => c.id !== classId);
        
        // Update local user object
        if (classState.currentUser && classState.currentUid) {
            classState.currentUser = {
                ...classState.currentUser,
                classes: classState.currentUser.classes?.filter(
                    (id: string) => id !== classId
                ) || []
            };
        }
        
        // Reset state
        classState.selectedClass = null;
        classState.selectedStudent = null;
        classState.students = [];
        classState.documents = [];
        classState.showDeleteClassConfirm = false;
        
        // Delete from Firestore (background)
        const batch = writeBatch(db);
        
        // First, get all students belonging to this class
        const studentsQuery = query(
            collection(db, 'students'),
            where('classId', '==', classId)
        );
        
        const studentsSnapshot = await getDocs(studentsQuery);
        
        // Delete all students associated with this class
        studentsSnapshot.forEach((studentDoc) => {
            batch.delete(doc(db, 'students', studentDoc.id));
        });
        
        // Delete the class document
        batch.delete(doc(db, 'classes', classId));
        
        // Remove from user's classes array
        if (classState.currentUid) {
            const userRef = doc(db, 'users', classState.currentUid);
            const updatedClasses = classState.currentUser?.classes?.filter(
                (id: string) => id !== classId
            ) || [];
            
            batch.update(userRef, {
                classes: updatedClasses
            });
        }
        
        await batch.commit();
        
        classState.error = null;
        return true;
    } catch (err) {
        console.error('Error deleting class:', err);
        classState.error = 'Failed to delete class. Please try again.';
        
        // Rollback to original state
        classState.classes = originalClasses;
        classState.selectedClass = originalSelectedClass;
        classState.selectedStudent = originalSelectedStudent;
        classState.students = originalStudents;
        classState.documents = originalDocuments;
        classState.currentUser = originalCurrentUser;
        classState.showDeleteClassConfirm = originalShowDeleteClassConfirm;
        
        return false;
    } finally {
        classState.isProcessing = false;
    }
}

/**
 * Delete the selected student with optimistic updates
 */
async function deleteStudent() {
    if (!classState.selectedStudent) return false;
    
    classState.isProcessing = true;
    
    // Store original state for potential rollback
    const originalStudents = [...classState.students];
    const originalSelectedStudent = classState.selectedStudent ? { ...classState.selectedStudent } : null;
    const originalSelectedClass = classState.selectedClass ? { ...classState.selectedClass } : null;
    const originalDocuments = [...classState.documents];
    const originalShowDeleteStudentConfirm = classState.showDeleteStudentConfirm;
    
    try {
        const studentId = classState.selectedStudent.id;
        
        // Update local state immediately
        classState.students = classState.students.filter(s => s.id !== studentId);
        
        // Update local class object
        if (classState.selectedClass) {
            classState.selectedClass = {
                ...classState.selectedClass,
                students: classState.selectedClass.students?.filter(
                    id => id !== studentId
                ) || []
            };
        }
        
        // Reset state
        classState.selectedStudent = null;
        classState.documents = [];
        classState.showDeleteStudentConfirm = false;
        
        // Delete from Firestore (background)
        const batch = writeBatch(db);
        
        // Delete the student document
        batch.delete(doc(db, 'students', studentId));
        
        // Remove from class's students array
        if (classState.selectedClass) {
            const classRef = doc(db, 'classes', classState.selectedClass.id);
            const updatedStudents = classState.selectedClass.students?.filter(
                id => id !== studentId
            ) || [];
            
            batch.update(classRef, {
                students: updatedStudents
            });
        }
        
        await batch.commit();
        
        classState.error = null;
        return true;
    } catch (err) {
        console.error('Error deleting student:', err);
        classState.error = 'Failed to delete student. Please try again.';
        
        // Rollback to original state
        classState.students = originalStudents;
        classState.selectedStudent = originalSelectedStudent;
        classState.selectedClass = originalSelectedClass;
        classState.documents = originalDocuments;
        classState.showDeleteStudentConfirm = originalShowDeleteStudentConfirm;
        
        return false;
    } finally {
        classState.isProcessing = false;
    }
}

/**
 * Refresh classes data
 */
async function refreshClasses() {
    if (!classState.currentUid) return;
    
    classState.isRefreshing = true;
    try {
        await loadClassesForUser(classState.currentUid);
    } finally {
        classState.isRefreshing = false;
    }
}

/**
 * Refresh students data
 */
async function refreshStudents() {
    if (!classState.selectedClass) return;
    
    classState.isRefreshing = true;
    try {
        await loadStudentsForClass();
    } finally {
        classState.isRefreshing = false;
    }
}

/**
 * Refresh documents data
 */
async function refreshDocuments() {
    if (!classState.selectedStudent) return;
    
    classState.isRefreshing = true;
    try {
        await loadDocumentsForStudent();
    } finally {
        classState.isRefreshing = false;
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
    get isRefreshing() {
        return classState.isRefreshing;
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
    cancelDelete,
    
    // Refresh operations
    refreshClasses,
    refreshStudents,
    refreshDocuments
};