'use client';

import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'User' | 'Instructor' | 'Admin';

export interface CategoryOption {
  id: number;
  title: string;
}

export interface CourseRow {
  id: number;
  title: string;
  description: string | null;
  level: string | null;
  price: number | null;
  category_id: number | null;
  instructor_uid: string | null;
  isOpen: boolean | null;
  categories?: { id: number; title: string } | Array<{ id: number; title: string }> | null;
}

export interface AppCourse {
  id: number;
  title: string;
  description: string;
  level: string;
  price: number;
  categoryId: number | null;
  category: string;
  instructorUid: string | null;
  isOpen: boolean;
}

export const roleNameToId = (role: UserRole): number => {
  if (role === 'Instructor') return 2;
  if (role === 'Admin') return 3;
  return 1;
};

export const roleIdToName = (roleId: number | null | undefined): UserRole => {
  if (roleId === 2) return 'Instructor';
  if (roleId === 3) return 'Admin';
  return 'User';
};

export const mapCourseRowToAppCourse = (row: CourseRow): AppCourse => {
  const categoryRelation = Array.isArray(row.categories)
    ? row.categories[0]
    : row.categories;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    level: row.level ?? '',
    price: row.price ?? 0,
    categoryId: row.category_id,
    category: categoryRelation?.title ?? 'Bez kategorii',
    instructorUid: row.instructor_uid,
    isOpen: row.isOpen ?? true,
  };
};

export const fetchCurrentUserRole = async (): Promise<UserRole> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return 'User';
  }

  const { data, error } = await supabase
    .from('users')
    .select('role_id')
    .eq('UID', session.user.id)
    .single();

  if (error || !data) {
    return 'User';
  }

  return roleIdToName(data.role_id as number | null | undefined);
};

export const fetchCategories = async (): Promise<CategoryOption[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, title')
    .order('title', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as CategoryOption[];
};