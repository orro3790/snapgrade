// import type { User } from '$lib/schemas/user';
// import type { Document } from '$lib/schemas/document';
// import type { Class } from '$lib/schemas/class';
// import type { Student } from '$lib/schemas/student';
// import { faker } from '@faker-js/faker';

// const generateRandomEmail = () => {
//     const name = faker.person.firstName().toLowerCase();
//     const domain = faker.internet.domainName();
//     return `${name}@${domain}`;
// };

// const generateRandomString = (length: number = 10) => {
//     return faker.string.alphanumeric(length);
// };

// const generateRandomDocumentBody = () => {
//     // Generate 3 random paragraphs with student-like content
//     const paragraphs = Array.from({ length: 3 }, () => 
//         faker.lorem.paragraph({ min: 3, max: 5 })
//     );
//     return paragraphs.join('\n\n');
// };


// export const generateRandomUser = (partialData: Partial<User> = {}): User => {
//     // Build metadata with required accountStatus
//     const metadata = {
//         accountStatus: ['ACTIVE', 'INACTIVE', 'SUSPENDED'][Math.floor(Math.random() * 3)] as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
//     };

//     // Add optional metadata fields only if they should exist
//     if (Math.random() > 0.5) {
//         Object.assign(metadata, { telegramId: generateRandomString() });
//     }
//     if (Math.random() > 0.5) {
//         Object.assign(metadata, { telegramLinkCode: generateRandomString(6) });
//     }
//     if (Math.random() > 0.5) {
//         Object.assign(metadata, { 
//             telegramLinkExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
//         });
//     }

//     const defaultData: User = {
//         name: generateRandomEmail(),
//         id: generateRandomString(),
//         classes: [],
//         metadata,
//         ...(Math.random() > 0.5 && { photoUrl: `https://example.com/photos/${generateRandomString()}.jpg` })
//     };

//     // Merge with partial data
//     const merged = {
//         ...defaultData,
//         ...partialData,
//         metadata: {
//             ...defaultData.metadata,
//             ...(partialData.metadata || {})
//         }
//     };

//     // Filter out undefined values
//     const filtered = Object.entries(merged).reduce((acc, [key, value]) => {
//         if (value !== undefined) {
//             acc[key] = value;
//         }
//         return acc;
//     }, {} as Record<string, unknown>);

//     return filtered as User;
// };

// export const generateRandomDocument = (partialData: Partial<Document> = {}): Document => {
//     const defaultData: Document = {
//         studentId: generateRandomString(),
//         studentName: 'Colby Franey',
//         className: `Class ${Math.floor(Math.random() * 100)}`,
//         documentName: `Assignment ${Math.floor(Math.random() * 1000)}`,
//         documentBody: generateRandomDocumentBody(),
//         id: generateRandomString(),
//         status: ['staged', 'editing', 'completed'][Math.floor(Math.random() * 3)] as 'staged' | 'editing' | 'completed',
//         sourceType: ['discord', 'manual'][Math.floor(Math.random() * 2)] as 'discord' | 'manual',
//         userId: generateRandomString(),
//         createdAt: faker.date.past(),
//         updatedAt: faker.date.recent(),
//         ...(Math.random() > 0.5 && {
//             sourceMetadata: {
//             }
//         })
//     };

//     // Start with default data
//     const merged = {
//         ...defaultData,
//         ...partialData
//     };

//     // Handle sourceMetadata separately to avoid undefined
//     if (partialData.sourceMetadata || defaultData.sourceMetadata) {
//         merged.sourceMetadata = {
//             ...(defaultData.sourceMetadata || {}),
//             ...(partialData.sourceMetadata || {})
//         };
//     }

//     return merged;
// };

// /**
//  * Generates random class data merged with any provided override data
//  */
// export const generateRandomClass = (overrides: Partial<Class> = {}): Class => {
//     const defaultClass: Class = {
//         name: faker.helpers.arrayElement([
//          '1S-I',
//          '1S-M',
//          '1S-P',
//          '1S-O',
//          '1S-R',
//          '1S-A',
//          '1S-V',
//          '2S-I',
//          '2S-M',
//          '2S-P',
//          '2S-O',
//          '2S-R',
//          '2S-A',
//          '2S-V',
//          '3S-I',
//          '3S-M',
//          '3S-P',
//          '3S-O',
//          '3S-R',
//          '3S-A',
//          '3S-V',
//          '4S-I',
//          '4S-M',
//          '4S-P',
//          '4S-O',
//          '4S-R',
//          '4S-A',
//          '4S-V',
//          '5S-I',
//          '5S-M',
//          '5S-P',
//          '5S-O',
//          '5S-R',
//          '5S-A',
//          '5S-V',
//         ]),
//         description: faker.lorem.paragraph(),
//         students: Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, 
//             () => faker.string.uuid()),
//         status: faker.helpers.arrayElement(['active', 'archived']),
//         id: faker.string.uuid(),
//         metadata: {
//             createdAt: faker.date.past(),
//             updatedAt: faker.date.recent()
//         },
//         ...(Math.random() > 0.5 && { photoUrl: faker.image.url() })
//     };

//     // Deep merge the default data with any overrides
//     const merged = {
//         ...defaultClass,
//         ...overrides,
//         metadata: {
//             ...defaultClass.metadata,
//             ...overrides.metadata
//         }
//     };

//     // Filter out undefined values
//     const filtered = Object.entries(merged).reduce((acc, [key, value]) => {
//         if (value !== undefined) {
//             acc[key] = value;
//         }
//         return acc;
//     }, {} as Record<string, unknown>);

//     return filtered as Class;
// };

// /**
//  * Generates random student data merged with any provided override data
//  */
// export const generateRandomStudent = (overrides: Partial<Student> = {}): Student => {
//     const defaultStudent: Student = {
//         name: `${faker.person.firstName()} ${faker.person.lastName()}`,
//         description: faker.lorem.sentence(),
//         classId: faker.string.uuid(),
//         notes: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, 
//             () => faker.string.uuid()),
//         status: faker.helpers.arrayElement(['active', 'archived']),
//         id: faker.string.uuid(),
//         metadata: {
//             createdAt: faker.date.past(),
//             updatedAt: faker.date.recent(),
//         },
//         ...(Math.random() > 0.5 && { photoUrl: faker.image.avatar() })

//     };

//     // Deep merge the default data with any overrides
//     const merged = {
//         ...defaultStudent,
//         ...overrides,
//         metadata: {
//             ...defaultStudent.metadata,
//             ...overrides.metadata
//         }
//     };

//     // Filter out undefined values
//     const filtered = Object.entries(merged).reduce((acc, [key, value]) => {
//         if (value !== undefined) {
//             acc[key] = value;
//         }
//         return acc;
//     }, {} as Record<string, unknown>);

//     return filtered as Student;
// };

// /**
//  * Generates a class with its associated teacher and students, ensuring proper relationships
//  * @param classOverrides - Optional overrides for class data
//  * @param studentCount - Number of students to generate (default: random between 5-10)
//  * @returns Object containing the class, teacher, and students with established relationships
//  */
// export const generateRelatedClassAndStudents = (
//     classOverrides: Partial<Class> = {},
//     studentCount: number = faker.number.int({ min: 5, max: 10 }),
//     userId?: string
// ): { class: Class; students: Student[]; teacher?: User } => {
//     // First generate students without classId
//     const students: Student[] = Array.from({ length: studentCount }, () =>
//         generateRandomStudent({ 
//             status: 'active', // Default to active for new students
//             classId: undefined // We'll set this after class generation
//         })
//     );

//     // Generate class with student IDs
//     const classData = generateRandomClass({
//         ...classOverrides,
//         students: students.map(student => student.id),
//         status: 'active' // Default to active for new classes
//     });

//     // Generate teacher only if userId is not provided
//     const teacher = userId ? undefined : generateRandomUser({
//         id: userId,
//         classes: [classData.id],
//         metadata: {
//             accountStatus: 'ACTIVE' // Teachers should be active by default
//         }
//     });

//     // Update students with the correct classId
//     const studentsWithClass = students.map(student => ({
//         ...student,
//         classId: classData.id
//     }));

//     return {
//         class: classData,
//         students: studentsWithClass,
//         teacher
//     };
// };

// /**
//  * Generates multiple classes with their associated teachers and students
//  * @param count - Number of class sets to generate (default: 5)
//  * @returns Array of class, teacher, and student sets
//  */
// export const generateMultipleClassesWithStudents = (
//     count: number = 5,
//     userId?: string
// ): Array<{ class: Class; students: Student[]; teacher?: User }> => {
//     return Array.from({ length: count }, () => 
//         generateRelatedClassAndStudents({}, undefined, userId)
//     );
// };
