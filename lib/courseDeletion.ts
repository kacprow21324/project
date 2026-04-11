import { supabase } from '@/lib/supabaseClient';

const STORAGE_BUCKET = 'course-materials';

const isMissingRelationError = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;
  if (error.code === '42P01' || error.code === '42703') return true;
  return (error.message ?? '').includes('does not exist');
};

const listStorageFilesRecursive = async (prefix: string): Promise<string[]> => {
  const pending: string[] = [prefix];
  const files: string[] = [];

  while (pending.length > 0) {
    const currentPrefix = pending.pop() as string;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(currentPrefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (error || !data) {
      continue;
    }

    data.forEach((entry) => {
      const entryPath = `${currentPrefix}/${entry.name}`;
      if (entry.id) {
        files.push(entryPath);
      } else {
        pending.push(entryPath);
      }
    });
  }

  return files;
};

export const deleteCourseWithRelations = async (courseId: number): Promise<{ error: string | null }> => {
  const rpcDelete = await supabase.rpc('admin_delete_course', { target_course_id: courseId });
  if (!rpcDelete.error) {
    return { error: null };
  }

  const lessonResult = await supabase
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId);

  if (lessonResult.error) {
    return { error: lessonResult.error.message };
  }

  const lessonIds = (lessonResult.data ?? []).map((lesson) => lesson.id);

  if (lessonIds.length > 0) {
    const materialsDelete = await supabase
      .from('course_materials')
      .delete()
      .in('course_lessons_id', lessonIds);

    if (materialsDelete.error && !isMissingRelationError(materialsDelete.error)) {
      return { error: materialsDelete.error.message };
    }

    const progressDelete = await supabase
      .from('course_user_progress')
      .delete()
      .in('course_lessons_id', lessonIds);

    if (progressDelete.error && !isMissingRelationError(progressDelete.error)) {
      return { error: progressDelete.error.message };
    }

    const sectionsDelete = await supabase
      .from('lesson_sections')
      .delete()
      .in('course_lessons_id', lessonIds);

    if (sectionsDelete.error && !isMissingRelationError(sectionsDelete.error)) {
      return { error: sectionsDelete.error.message };
    }
  }

  const lessonsDelete = await supabase
    .from('course_lessons')
    .delete()
    .eq('course_id', courseId);

  if (lessonsDelete.error && !isMissingRelationError(lessonsDelete.error)) {
    return { error: lessonsDelete.error.message };
  }

  const signupsDelete = await supabase
    .from('course_signups')
    .delete()
    .eq('course_id', courseId);

  if (signupsDelete.error && !isMissingRelationError(signupsDelete.error)) {
    return { error: signupsDelete.error.message };
  }

  const reviewsDelete = await supabase
    .from('course_reviews')
    .delete()
    .eq('course_id', courseId);

  if (reviewsDelete.error && !isMissingRelationError(reviewsDelete.error)) {
    return { error: reviewsDelete.error.message };
  }

  // Storage cleanup is best-effort and should not block DB cleanup.
  try {
    const files = await listStorageFilesRecursive(`courses/${courseId}`);
    if (files.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(files);
    }
  } catch {
    // Ignore storage cleanup errors.
  }

  const courseDelete = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (courseDelete.error) {
    return { error: courseDelete.error.message };
  }

  return { error: null };
};
