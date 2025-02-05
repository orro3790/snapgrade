import type { User } from '$lib/schemas/user';
import type { Document } from '$lib/schemas/document';
import type { Class } from '$lib/schemas/class';
import type { Student } from '$lib/schemas/student';
import { faker } from '@faker-js/faker';

const generateRandomEmail = () => {
    const name = faker.person.firstName().toLowerCase();
    const domain = faker.internet.domainName();
    return `${name}@${domain}`;
};

const generateRandomString = (length: number = 10) => {
    return faker.string.alphanumeric(length);
};

const generateRandomDocumentBody = () => {
    // Generate 3 random paragraphs with student-like content
    const paragraphs = Array.from({ length: 3 }, () => 
        faker.lorem.paragraph({ min: 3, max: 5 })
    );
    return paragraphs.join('\n\n');
};


export const generateRandomUser = (partialData: Partial<User> = {}): User => {
    const defaultData: User = {
        name: generateRandomEmail(),
        id: generateRandomString(),
        metadata: {
            accountStatus: ['ACTIVE', 'INACTIVE', 'SUSPENDED'][Math.floor(Math.random() * 3)] as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
            telegramId: Math.random() > 0.5 ? generateRandomString() : undefined,
            telegramLinkCode: Math.random() > 0.5 ? generateRandomString(6) : undefined,
            telegramLinkExpiry: Math.random() > 0.5 ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
        },
        photoUrl: Math.random() > 0.5 ? `https://example.com/photos/${generateRandomString()}.jpg` : undefined
    };

    return {
        ...defaultData,
        ...partialData,
        metadata: {
            ...defaultData.metadata,
            ...partialData.metadata
        }
    };
};

export const generateRandomDocument = (partialData: Partial<Document> = {}): Document => {
    const defaultData: Document = {
        studentName: generateRandomEmail(),
        className: `Class ${Math.floor(Math.random() * 100)}`,
        documentName: `Assignment ${Math.floor(Math.random() * 1000)}`,
        documentBody: generateRandomDocumentBody(),
        userId: generateRandomString(),
        status: ['staged', 'editing', 'completed'][Math.floor(Math.random() * 3)] as 'staged' | 'editing' | 'completed',
        sourceType: ['telegram', 'manual'][Math.floor(Math.random() * 2)] as 'telegram' | 'manual',

        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        sourceMetadata: Math.random() > 0.5 ? {
            telegramMessageId: generateRandomString(),
            telegramChatId: generateRandomString(),
            telegramFileId: generateRandomString()
        } : undefined
    };

    return {
        ...defaultData,
        ...partialData,
        sourceMetadata: partialData.sourceMetadata === undefined ? defaultData.sourceMetadata : {
            ...defaultData.sourceMetadata,
            ...partialData.sourceMetadata
        }
    };
};

/**
 * Generates random class data merged with any provided override data
 */
export const generateRandomClass = (overrides: Partial<Class> = {}): Class => {
    const defaultClass: Class = {
        name: faker.helpers.arrayElement([
         '1S-I',
         '1S-M',
         '1S-P',
         '1S-O',
         '1S-R',
         '1S-A',
         '1S-V',
         '2S-I',
         '2S-M',
         '2S-P',
         '2S-O',
         '2S-R',
         '2S-A',
         '2S-V',
         '3S-I',
         '3S-M',
         '3S-P',
         '3S-O',
         '3S-R',
         '3S-A',
         '3S-V',
         '4S-I',
         '4S-M',
         '4S-P',
         '4S-O',
         '4S-R',
         '4S-A',
         '4S-V',
         '5S-I',
         '5S-M',
         '5S-P',
         '5S-O',
         '5S-R',
         '5S-A',
         '5S-V',
        ]),
        description: faker.lorem.paragraph(),
        students: Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, 
            () => faker.string.uuid()),
        status: faker.helpers.arrayElement(['active', 'archived']),
        metadata: {
            id: faker.string.uuid(),
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
        },
        photoUrl: faker.image.url()
    };

    // Deep merge the default data with any overrides
    return {
        ...defaultClass,
        ...overrides,
        metadata: {
            ...defaultClass.metadata,
            ...overrides.metadata
        }
    };
};

/**
 * Generates random student data merged with any provided override data
 */
export const generateRandomStudent = (overrides: Partial<Student> = {}): Student => {
    const defaultStudent: Student = {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        description: faker.lorem.sentence(),
        classId: faker.string.uuid(),
        notes: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, 
            () => faker.string.uuid()),
        status: faker.helpers.arrayElement(['active', 'archived']),
        metadata: {
            id: faker.string.uuid(),
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
        },
        photoUrl: faker.image.avatar()
    };

    // Deep merge the default data with any overrides
    return {
        ...defaultStudent,
        ...overrides,
        metadata: {
            ...defaultStudent.metadata,
            ...overrides.metadata
        }
    };
};

/**
 * Generates a class with its associated students, ensuring proper relationships
 * @returns Object containing both the class and its students
 */
export const generateRelatedClassAndStudents = (
    classOverrides: Partial<Class> = {},
    studentCount: number = faker.number.int({ min: 5, max: 10 })
): { class: Class; students: Student[] } => {
    // First generate students without classId
    const students: Student[] = Array.from({ length: studentCount }, () =>
        generateRandomStudent({ 
            status: 'active', // Default to active for new students
            classId: undefined // We'll set this after class generation
        })
    );

    // Generate class with student IDs
    const classData = generateRandomClass({
        ...classOverrides,
        students: students.map(student => student.metadata.id),
        status: 'active' // Default to active for new classes
    });

    // Update students with the correct classId
    const studentsWithClass = students.map(student => ({
        ...student,
        classId: classData.metadata.id
    }));

    return {
        class: classData,
        students: studentsWithClass
    };
};

/**
 * Generates multiple classes with their associated students
 * @returns Array of class and student pairs
 */
export const generateMultipleClassesWithStudents = (
    count: number = 5
): Array<{ class: Class; students: Student[] }> => {
    return Array.from({ length: count }, () => 
        generateRelatedClassAndStudents()
    );
};
