/**
 * @module documentStore
 * @description State management for documents in the application.
 * Handles document loading, updating, and selection.
 * Uses Svelte 5 runes ($state, $derived) for reactive state management.
 */

import type { Document } from '$lib/schemas/document';
import type { Class } from '$lib/schemas/class';
import type { Student } from '$lib/schemas/student';
import { db } from '$lib/firebase/client';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { z } from 'zod';

/**
 * Document filters schema based on existing patterns in the application
 */
export const documentFiltersSchema = z.object({
    classId: z.string().optional(),
    studentId: z.string().optional(),
    status: z.string().optional(),
    dateRange: z.object({
        start: z.date().nullable().optional(),
        end: z.date().nullable().optional()
    }).optional()
});

// Type inferred from schema
export type DocumentFilters = z.infer<typeof documentFiltersSchema>;

// Internal filter type with stricter null handling for dates
export type InternalDocumentFilters = {
    classId: string;
    studentId: string;
    status: string;
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
};

/**
 * Convert internal filters to API format
 * @param internalFilters - Internal filter state
 * @returns Properly typed filters for API
 */
function convertFiltersToApiFormat(internalFilters: InternalDocumentFilters): DocumentFilters {
    return {
        classId: internalFilters.classId || undefined,
        studentId: internalFilters.studentId || undefined,
        status: internalFilters.status || undefined,
        dateRange: internalFilters.dateRange.start || internalFilters.dateRange.end ? {
            start: internalFilters.dateRange.start || undefined,
            end: internalFilters.dateRange.end || undefined
        } : undefined
    };
}

/**
 * Core document state containing all document-related data.
 * Uses Svelte 5's $state rune for reactivity.
 */
const documentState = $state({
    // Document data
    documents: [] as Document[],
    selectedDocument: null as Document | null,
    
    // UI state
    isLoading: false,
    isProcessing: false,
    error: null as string | null,
    
    // Filter state - internal representation
    filters: {
        classId: '',
        studentId: '',
        status: '',
        dateRange: {
            start: null as Date | null,
            end: null as Date | null
        }
    },
    
    // Related data
    classes: [] as Class[],
    students: [] as Student[],
    
    // User context
    currentUser: null as App.Locals['user'] | null,
    currentUid: null as string | null
});

// Track active listeners for proper cleanup
const activeListeners = {
    classes: null as (() => void) | null,
    students: null as (() => void) | null
};

/**
 * Clean up all active listeners
 */
function cleanupListeners() {
    if (activeListeners.classes) {
        activeListeners.classes();
        activeListeners.classes = null;
    }
    
    if (activeListeners.students) {
        activeListeners.students();
        activeListeners.students = null;
    }
}

/**
 * Initialize the store with user data and setup reactive effects
 * @param user - The current user
 * @param uid - The current user's UID
 * @returns A cleanup function to unsubscribe all listeners
 */
function initializeWithUser(user: App.Locals['user'], uid: string) {
    // Clean up any existing listeners first
    cleanupListeners();
    
    // Store user data
    documentState.currentUser = user;
    documentState.currentUid = uid;
    
    // Setup reactive effect to handle user changes
    $effect(() => {
        const currentUid = documentState.currentUid;
        
        if (currentUid) {
            // Load classes for the user
            loadClassesForUser(currentUid);
            
            // Load documents with default filters
            loadDocuments(convertFiltersToApiFormat(documentState.filters));
        }
    });
    
    // Return cleanup function
    return cleanupListeners;
}

/**
 * Load classes for the current user
 * @param uid - The user ID to load classes for
 */
function loadClassesForUser(uid: string) {
    // Clean up any existing listener first
    if (activeListeners.classes) {
        activeListeners.classes();
        activeListeners.classes = null;
    }
    
    if (!uid || !documentState.currentUser || !documentState.currentUser.classes || documentState.currentUser.classes.length === 0) {
        console.log('No classes found for user');
        documentState.classes = [];
        return;
    }
    
    try {
        console.log('Loading classes from Firestore for user:', uid);
        // Avoid logging state objects directly
        console.log('User classes count:', documentState.currentUser.classes.length);
        
        const classesQuery = query(
            collection(db, 'classes'),
            where('id', 'in', documentState.currentUser.classes || [])
        );
        
        // Store the listener for later cleanup
        activeListeners.classes = onSnapshot(
            classesQuery,
            (snapshot) => {
                documentState.classes = snapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                    metadata: {
                        createdAt: doc.data().metadata?.createdAt,
                        updatedAt: doc.data().metadata?.updatedAt
                    }
                })) as Class[];
                // Classes loaded from Firestore
            },
            (err) => {
                console.error('Firestore error:', err);
                documentState.classes = [];
                documentState.error = 'Failed to load classes. Please try again.';
            }
        );
    } catch (err) {
        console.error('Error loading classes from Firestore:', err);
        documentState.classes = [];
        documentState.error = 'Failed to load classes. Please try again.';
    }
}

/**
 * Load students for a specific class
 * @param classId - The class ID to load students for
 */
function loadStudentsForClass(classId: string) {
    // Clean up any existing listener first
    if (activeListeners.students) {
        activeListeners.students();
        activeListeners.students = null;
    }
    
    if (!classId) {
        documentState.students = [];
        return;
    }
    
    try {
        // Loading students for class
        
        const studentsQuery = query(
            collection(db, 'students'),
            where('classId', '==', classId),
            where('status', '==', 'active')
        );
        
        // Store the listener for later cleanup
        activeListeners.students = onSnapshot(
            studentsQuery,
            (snapshot) => {
                documentState.students = snapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                    metadata: {
                        createdAt: doc.data().metadata?.createdAt,
                        updatedAt: doc.data().metadata?.updatedAt
                    }
                })) as Student[];
                // Students loaded from Firestore
            },
            (err) => {
                console.error('Firestore error loading students:', err);
                documentState.students = [];
                documentState.error = 'Failed to load students. Please try again.';
            }
        );
    } catch (err) {
        console.error('Error loading students from Firestore:', err);
        documentState.students = [];
        documentState.error = 'Failed to load students. Please try again.';
    }
}

/**
 * Set a single filter value
 * @param field - The filter field to set (can be 'classId', 'studentId', 'status', 'dateRange.start', or 'dateRange.end')
 * @param value - The value to set for the field
 */
function setFilter(field: string, value: unknown) {
    // Create a new filters object
    const newFilters = { ...documentState.filters };
    
    // Handle both top-level and nested fields in a more generic way
    if (field === 'classId' || field === 'studentId' || field === 'status') {
        // Handle top-level string fields
        newFilters[field] = value as string;
    } else if (field === 'dateRange.start' || field === 'dateRange.end') {
        // Handle dateRange fields directly
        const dateField = field.split('.')[1] as 'start' | 'end';
        newFilters.dateRange = {
            ...newFilters.dateRange,
            [dateField]: value as Date | null
        };
    }
    
    // Update the filters state
    documentState.filters = newFilters;
    
    // Reload documents with updated filters
    loadDocuments(convertFiltersToApiFormat(newFilters));
}

/**
 * Set multiple filter values at once
 * @param newFilters - Object containing the new filter values
 */
function setFilters(newFilters: Partial<InternalDocumentFilters>) {
    // Create a properly typed merged filter object
    const mergedFilters = {
        classId: newFilters.classId ?? documentState.filters.classId,
        studentId: newFilters.studentId ?? documentState.filters.studentId,
        status: newFilters.status ?? documentState.filters.status,
        dateRange: {
            start: newFilters.dateRange?.start ?? documentState.filters.dateRange.start,
            end: newFilters.dateRange?.end ?? documentState.filters.dateRange.end
        }
    };
    
    // Update the filters state
    documentState.filters = mergedFilters;
    
    // Reload documents with updated filters
    loadDocuments(convertFiltersToApiFormat(mergedFilters));
}

/**
 * Clear all filters
 */
function clearFilters() {
    // Define empty filters
    const emptyFilters: InternalDocumentFilters = {
        classId: '',
        studentId: '',
        status: '',
        dateRange: {
            start: null,
            end: null
        }
    };
    
    // Update the filters state with empty values
    documentState.filters = emptyFilters;
    
    // Reload documents with cleared filters
    loadDocuments(convertFiltersToApiFormat(emptyFilters));
}

/**
 * Loads documents based on filter criteria
 * @param filters - Filter criteria for documents in API format
 */
async function loadDocuments(filters: DocumentFilters) {
    documentState.isLoading = true;
    documentState.error = null;
    
    try {
        const response = await fetch('/api/documents/list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filters })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        interface DocumentResponse {
            documents: Array<{
                id: string;
                createdAt: string;
                updatedAt: string;
                [key: string]: unknown;
            }>;
        }
        
        const data = await response.json() as DocumentResponse;
        
        // Convert ISO date strings back to Date objects
        documentState.documents = data.documents.map((doc) => ({
            ...doc,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date()
        })) as Document[];
        
    } catch (err) {
        console.error('Error loading documents:', err);
        documentState.error = 'Failed to load documents. Please try again.';
    } finally {
        documentState.isLoading = false;
    }
}

/**
 * Updates a document with new data using optimistic updates
 * @param documentId - ID of the document to update
 * @param updates - Object containing the fields to update
 * @param setProcessingFlag - Whether to set the global processing flag (defaults to false for UI updates)
 */
async function updateDocument(documentId: string, updates: Partial<Document>, setProcessingFlag = false) {
	// Only set the processing flag for operations that should block the UI
	if (setProcessingFlag) {
		documentState.isProcessing = true;
	}
	
	try {
		// Apply optimistic update immediately for responsive UI
		if (documentState.selectedDocument && documentState.selectedDocument.id === documentId) {
			// Create a new object with current and updated properties
			// This approach doesn't create a new reference to the main object
			// which helps prevent unnecessary re-renders
			Object.keys(updates).forEach(key => {
				const docKey = key as keyof Document;
				const updateKey = docKey as keyof typeof updates;
				
				// Only update if the value has actually changed
				if (documentState.selectedDocument![docKey] !== updates[updateKey]) {
					// @ts-expect-error: Index signature is needed here
					documentState.selectedDocument[docKey] = updates[updateKey];
				}
			});
		}
		
		// Update the documents list with the new values
		documentState.documents = documentState.documents.map(doc =>
			doc.id === documentId ? { ...doc, ...updates } : doc
		);
		
		// Send update to server
		
		// Send the update to the server
		const response = await fetch('/api/documents/update', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				documentId,
				...updates
			})
		});
		
		if (!response.ok) {
			// Get more detailed error information
			let errorDetails = 'Failed to update document';
			try {
				const errorResponse = await response.text();
				console.error('Server error response:', errorResponse);
				errorDetails = `Failed to update document: ${errorResponse}`;
			} catch (e) {
				console.error('Could not parse error response:', e);
			}
			throw new Error(errorDetails);
		}
		
		return true;
	} catch (err) {
		console.error('Error updating document:', err);
		documentState.error = 'Failed to update document. Please try again.';
		
		// In a production app, we would revert optimistic updates on error
		// This would require keeping track of previous state
		
		return false;
	} finally {
		if (setProcessingFlag) {
			documentState.isProcessing = false;
		}
	}
}

/**
 * Selects a document to view/edit
 * @param document - The document to select
 */
function selectDocument(document: Document | null) {
    documentState.selectedDocument = document;
    
    // If document has a classId, load students for that class
    if (document?.classId) {
        loadStudentsForClass(document.classId);
    }
}

/**
 * Selects a document by ID
 * @param documentId - The ID of the document to select
 */
function selectDocumentById(documentId: string) {
    const document = documentState.documents.find(doc => doc.id === documentId) || null;
    selectDocument(document);
}

/**
 * Performs batch operations on multiple documents
 * @param action - The action to perform ('delete', etc.)
 * @param documentIds - Array of document IDs to operate on
 */
async function batchDocumentAction(action: string, documentIds: string[]) {
    documentState.isProcessing = true;
    
    try {
        const response = await fetch('/api/documents/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action,
                documentIds
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        // If action is delete, remove the documents from local state
        if (action === 'delete') {
            documentState.documents = documentState.documents.filter(
                doc => !documentIds.includes(doc.id)
            );
            
            // If selected document was deleted, clear selection
            if (documentState.selectedDocument && 
                documentIds.includes(documentState.selectedDocument.id)) {
                documentState.selectedDocument = null;
            }
        }
        
        return true;
    } catch (err) {
        console.error(`Error performing ${action}:`, err);
        documentState.error = `Failed to ${action} documents. Please try again.`;
        return false;
    } finally {
        documentState.isProcessing = false;
    }
}

/**
 * The document store object, containing functions and state for managing documents.
 */
export const documentStore = {
    /**
     * Get the current documents array
     */
    get documents() {
        return documentState.documents;
    },
    
    /**
     * Get/set the selected document
     */
    get selectedDocument() {
        return documentState.selectedDocument;
    },
    set selectedDocument(document: Document | null) {
        selectDocument(document);
    },
    
    /**
     * Get the classes array
     */
    get classes() {
        return documentState.classes;
    },
    
    /**
     * Get the students array
     */
    get students() {
        return documentState.students;
    },
    
    /**
     * Get/set the filters
     */
    get filters() {
        return documentState.filters;
    },
    
    /**
     * Get loading state
     */
    get isLoading() {
        return documentState.isLoading;
    },
    
    /**
     * Get processing state
     */
    get isProcessing() {
        return documentState.isProcessing;
    },
    
    /**
     * Get error state
     */
    get error() {
        return documentState.error;
    },
    
    // User initialization
    initializeWithUser,
    
    // Document operations
    loadDocuments,
    updateDocument,
    selectDocument,
    selectDocumentById,
    batchDocumentAction,
    
    // Filter operations
    setFilter,
    setFilters,
    clearFilters,
    
    // Related data operations
    loadClassesForUser,
    loadStudentsForClass
};