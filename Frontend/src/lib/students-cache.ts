/**
 * Students Local Cache Manager
 * Handles caching all students locally for offline access
 */

import type { Student } from '@/features/students';

const STORAGE_KEY = 'students_cache';
const CACHE_TIMESTAMP_KEY = 'students_cache_timestamp';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save all students to localStorage
 * Merges with existing cache to preserve temporary students created offline
 * Optimized to reduce localStorage writes by checking if data actually changed
 */
export function saveStudentsToCache(students: Student[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing cache to preserve temporary students
    const existingStudents = getStudentsFromCache();
    
    // Separate temporary students (created offline) from real students
    const tempStudents = existingStudents.filter(s => {
      const id = (s.id || s._id || '').toString();
      return id.startsWith('temp_');
    });
    
    // Create a map of real students by ID for quick lookup
    const realStudentsMap = new Map<string, Student>();
    students.forEach(s => {
      const id = (s.id || s._id || '').toString();
      if (id) {
        realStudentsMap.set(id, s);
      }
    });
    
    // Merge: real students from server + temporary students that haven't been synced yet
    const mergedStudents: Student[] = [
      ...students, // Real students from server
      ...tempStudents.filter(temp => {
        // Keep temp students that don't have a real version yet
        // Check by nationalId/studentCode to see if they were synced
        const tempId = (temp.id || temp._id || '').toString();
        const tempNationalId = temp.nationalId || temp.studentCode;
        
        // If temp student has a nationalId, check if it exists in real students
        if (tempNationalId) {
          const existsInReal = Array.from(realStudentsMap.values()).some(real => 
            (real.nationalId === tempNationalId) || (real.studentCode === tempNationalId)
          );
          // Keep temp student only if it doesn't exist in real students yet
          return !existsInReal;
        }
        
        // Keep temp student if it doesn't have nationalId (not synced yet)
        return true;
      })
    ];
    
    // Only write to localStorage if data actually changed (optimization)
    const currentCache = localStorage.getItem(STORAGE_KEY);
    const newCacheData = JSON.stringify(mergedStudents);
    
    if (currentCache !== newCacheData) {
      localStorage.setItem(STORAGE_KEY, newCacheData);
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log(`💾 Cached ${mergedStudents.length} students locally (${students.length} real + ${mergedStudents.length - students.length} temp)`);
    }
  } catch (error) {
    console.error('Error saving students to cache:', error);
  }
}

/**
 * Get all students from cache
 */
export function getStudentsFromCache(): Student[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error reading students from cache:', error);
  }
  
  return [];
}

/**
 * Check if cache is valid (not expired)
 */
export function isCacheValid(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    return cacheAge < CACHE_EXPIRY_MS;
  } catch (error) {
    return false;
  }
}

/**
 * Search students in cache
 */
export function searchStudentsInCache(search: string): Student[] {
  const students = getStudentsFromCache();
  
  if (!search.trim()) {
    return students;
  }
  
  const searchLower = search.toLowerCase().trim();
  
  return students.filter(student => {
    const fullName = (student.fullName || '').toLowerCase();
    const nationalId = (student.nationalId || '').toLowerCase();
    const studentCode = (student.studentCode || '').toLowerCase();
    
    return fullName.includes(searchLower) || 
           nationalId.includes(searchLower) || 
           studentCode.includes(searchLower);
  });
}

/**
 * Get student by ID from cache
 */
export function getStudentByIdFromCache(id: string): Student | null {
  const students = getStudentsFromCache();
  return students.find(s => s.id === id || s._id === id) || null;
}

/**
 * Update student in cache
 */
export function updateStudentInCache(updatedStudent: Student): void {
  const students = getStudentsFromCache();
  const index = students.findIndex(s => 
    s.id === updatedStudent.id || 
    s._id === updatedStudent.id ||
    s.id === updatedStudent._id ||
    s._id === updatedStudent._id
  );
  
  if (index !== -1) {
    students[index] = updatedStudent;
    saveStudentsToCache(students);
  }
}

/**
 * Add student to cache
 */
export function addStudentToCache(newStudent: Student): void {
  const students = getStudentsFromCache();
  // Check if student already exists
  const exists = students.some(s => 
    s.id === newStudent.id || 
    s._id === newStudent.id ||
    (s.nationalId && s.nationalId === newStudent.nationalId)
  );
  
  if (!exists) {
    students.unshift(newStudent); // Add to beginning
    saveStudentsToCache(students);
  }
}

/**
 * Remove student from cache
 */
export function removeStudentFromCache(studentId: string): void {
  const students = getStudentsFromCache();
  const filtered = students.filter(s => 
    s.id !== studentId && s._id !== studentId
  );
  saveStudentsToCache(filtered);
}

/**
 * Clear students cache
 */
export function clearStudentsCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  console.log('🗑️ Cleared students cache');
}

