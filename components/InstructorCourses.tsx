'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
	fetchCategories,
	mapCourseRowToAppCourse,
	type AppCourse,
	type CategoryOption,
} from '@/lib/appData';
import { deleteCourseWithRelations } from '@/lib/courseDeletion';
import styles from './DashboardPanels.module.css';

const STORAGE_BUCKET = 'course-materials';
const COURSE_ICON_BUCKET = 'course-icons';
const COURSE_ICON_CANDIDATE_COLUMNS = ['thumbnail_url', 'image_url', 'icon_url', 'cover_url'] as const;
const MIN_LESSON_ID = 31;
const MIN_SECTION_ID = 61;
const SUPPORTED_FILE_TYPES = new Set([
	'application/pdf',
	'text/plain',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const SUPPORTED_FILE_EXTENSIONS = new Set(['pdf', 'txt', 'doc', 'docx', 'mp4', 'mov', 'avi', 'mkv', 'webm']);

interface InstructorCoursesProps {
	initialCourses: AppCourse[];
	onCoursesUpdate?: (courses: AppCourse[]) => void;
}

interface CourseLesson {
	id: number;
	lesson_number: number;
	title: string;
}

interface LessonSection {
	id: number;
	course_lessons_id: number;
	title: string;
	text: string;
	kind?: string | null;
	file_url?: string | null;
	file_name?: string | null;
	mime_type?: string | null;
}

interface CourseSignup {
	id: number;
	created_at: string;
	user_uid: string;
}

export const InstructorCourses = ({ initialCourses, onCoursesUpdate }: InstructorCoursesProps) => {
	const [courses, setCourses] = useState<AppCourse[]>(initialCourses);
	const coursesRef = useRef<AppCourse[]>(initialCourses);
	const [categories, setCategories] = useState<CategoryOption[]>([]);
	const [loading, setLoading] = useState(false);
	const [mutatingLesson, setMutatingLesson] = useState(false);
	const [mutatingSection, setMutatingSection] = useState(false);
	const [savingCourseId, setSavingCourseId] = useState<number | null>(null);
	const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
	const [lessons, setLessons] = useState<CourseLesson[]>([]);
	const [sections, setSections] = useState<LessonSection[]>([]);
	const [signups, setSignups] = useState<CourseSignup[]>([]);
	const [signupProgressByUser, setSignupProgressByUser] = useState<Record<string, { done: number; total: number; percent: number }>>({});
	const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
	const [courseDraft, setCourseDraft] = useState({
		title: 'Nowy kurs',
		description: '',
		level: 'Podstawowy',
		price: 0,
		categoryId: '',
	});
	const [courseIconFile, setCourseIconFile] = useState<File | null>(null);
	const [courseIconError, setCourseIconError] = useState<string | null>(null);
	const [newLessonTitle, setNewLessonTitle] = useState('');
	const [newSectionLessonId, setNewSectionLessonId] = useState<number | null>(null);
	const [newSectionTitle, setNewSectionTitle] = useState('');
	const [newSectionText, setNewSectionText] = useState('');
	const [newSectionType, setNewSectionType] = useState<'text' | 'file'>('text');
	const [newSectionFile, setNewSectionFile] = useState<File | null>(null);
	const [uploadingSection, setUploadingSection] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const notify = (type: 'success' | 'error' | 'info', text: string) => {
		setNotice({ type, text });
	};

	const getNextManualId = async (
		table: 'course_lessons' | 'lesson_sections',
		minimumValue: number
	): Promise<{ id: number; error: string | null }> => {
		const result = await supabase
			.from(table)
			.select('id')
			.order('id', { ascending: false })
			.limit(1);

		if (result.error) {
			return { id: minimumValue, error: result.error.message };
		}

		const highestId = Number(result.data?.[0]?.id ?? minimumValue - 1);
		return { id: Math.max(minimumValue, highestId + 1), error: null };
	};

	const insertLessonWithManualId = async (payload: {
		course_id: number;
		lesson_number: number;
		title: string;
	}) => {
		const nextIdResult = await getNextManualId('course_lessons', MIN_LESSON_ID);
		if (nextIdResult.error) {
			return { error: nextIdResult.error };
		}

		let candidateId = nextIdResult.id;
		for (let attempt = 0; attempt < 4; attempt += 1) {
			const insertResult = await supabase.from('course_lessons').insert({
				id: candidateId,
				...payload,
			});

			if (!insertResult.error) {
				return { error: null };
			}

			if (insertResult.error.code !== '23505') {
				return { error: insertResult.error.message };
			}

			candidateId += 1;
		}

		return { error: 'Nie udało się wygenerować unikalnego ID lekcji.' };
	};

	const insertSectionWithManualId = async (
		payload: Record<string, string | number | null>
	): Promise<{ error: string | null; code?: string }> => {
		const nextIdResult = await getNextManualId('lesson_sections', MIN_SECTION_ID);
		if (nextIdResult.error) {
			return { error: nextIdResult.error };
		}

		let candidateId = nextIdResult.id;
		for (let attempt = 0; attempt < 4; attempt += 1) {
			const insertResult = await supabase
				.from('lesson_sections')
				.insert({ id: candidateId, ...payload });

			if (!insertResult.error) {
				return { error: null };
			}

			if (insertResult.error.code !== '23505') {
				return { error: insertResult.error.message, code: insertResult.error.code };
			}

			candidateId += 1;
		}

		return { error: 'Nie udało się wygenerować unikalnego ID sekcji.' };
	};

	useEffect(() => {
		setCourses(initialCourses);
	}, [initialCourses]);

	useEffect(() => {
		coursesRef.current = courses;
	}, [courses]);

	useEffect(() => {
		const loadCategories = async () => {
			setCategories(await fetchCategories());
		};

		loadCategories();
	}, []);

	useEffect(() => {
		if (categories.length === 0) {
			return;
		}

		setCourseDraft((prev) => {
			if (prev.categoryId !== '') {
				return prev;
			}
			return { ...prev, categoryId: String(categories[0].id) };
		});
	}, [categories]);

	useEffect(() => {
		if (!notice) {
			return;
		}

		const timer = setTimeout(() => setNotice(null), 4500);
		return () => clearTimeout(timer);
	}, [notice]);

	const selectedCourse = useMemo(
		() => courses.find((course) => course.id === selectedCourseId) ?? null,
		[courses, selectedCourseId]
	);

	const refreshInstructorCourses = useCallback(async () => {
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session?.user) {
			return;
		}

		const { data, error } = await supabase
			.from('courses')
			.select('id, title, description, level, price, category_id, instructor_uid, isOpen, categories(id, title)')
			.eq('instructor_uid', session.user.id)
			.order('created_at', { ascending: false });

		if (error || !data) {
			return;
		}

		const mapped = data.map((row) => mapCourseRowToAppCourse(row));
		setCourses(mapped);
		onCoursesUpdate?.(mapped);
	}, [onCoursesUpdate]);

	useEffect(() => {
		let channel: ReturnType<typeof supabase.channel> | null = null;

		const subscribeToDbChanges = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session?.user) {
				return;
			}

			channel = supabase
				.channel(`instructor-live-${session.user.id}`)
				.on(
					'postgres_changes',
					{ event: '*', schema: 'public', table: 'courses', filter: `instructor_uid=eq.${session.user.id}` },
					() => {
						notify('info', 'Wykryto zmianę kursów w bazie. Lista została odświeżona.');
						void refreshInstructorCourses();
					}
				)
				.on(
					'postgres_changes',
					{ event: '*', schema: 'public', table: 'course_lessons' },
					() => {
						if (selectedCourseId) {
							notify('info', 'Wykryto aktualizację lekcji. Widok kursu został odświeżony.');
							void refreshCourseDetails(selectedCourseId);
						}
					}
				)
				.on(
					'postgres_changes',
					{ event: '*', schema: 'public', table: 'lesson_sections' },
					() => {
						if (selectedCourseId) {
							notify('info', 'Wykryto aktualizację sekcji. Widok kursu został odświeżony.');
							void refreshCourseDetails(selectedCourseId);
						}
					}
				)
				.subscribe();
		};

		void subscribeToDbChanges();

		return () => {
			if (channel) {
				void supabase.removeChannel(channel);
			}
		};
	}, [selectedCourseId, refreshInstructorCourses]);

	useEffect(() => {
		void refreshInstructorCourses();
	}, [refreshInstructorCourses]);

	const refreshCourseDetails = async (courseId: number) => {
		const [lessonResult, signupResult] = await Promise.all([
			supabase
				.from('course_lessons')
				.select('id, lesson_number, title')
				.eq('course_id', courseId)
				.order('lesson_number', { ascending: true }),
			supabase
				.from('course_signups')
				.select('id, created_at, user_uid')
				.eq('course_id', courseId)
				.order('created_at', { ascending: false }),
		]);

		const loadedLessons = lessonResult.data ?? [];
		setLessons(loadedLessons);
		const loadedSignups = signupResult.data ?? [];
		setSignups(loadedSignups);

		if (loadedLessons.length === 0) {
			setSections([]);
			setNewSectionLessonId(null);
			return;
		}

		const lessonIds = loadedLessons.map((lesson) => lesson.id);
		const sectionResult = await supabase
			.from('lesson_sections')
			.select('id, course_lessons_id, title, text, kind, file_url, file_name, mime_type')
			.in('course_lessons_id', lessonIds)
			.order('id', { ascending: true });

		if (sectionResult.error) {
			const legacySectionResult = await supabase
				.from('lesson_sections')
				.select('id, course_lessons_id, title, text')
				.in('course_lessons_id', lessonIds)
				.order('id', { ascending: true });

			setSections((legacySectionResult.data ?? []).map((section) => ({ ...section, kind: 'text' })));
		} else {
			setSections(sectionResult.data ?? []);
		}
		setNewSectionLessonId((current) => current ?? loadedLessons[0].id);

		if (loadedSignups.length === 0 || lessonIds.length === 0) {
			setSignupProgressByUser({});
			return;
		}

		const userIds = loadedSignups.map((signup) => signup.user_uid);
		const progressResult = await supabase
			.from('course_user_progress')
			.select('user_uid, course_lessons_id')
			.eq('isDone', true)
			.in('user_uid', userIds)
			.in('course_lessons_id', lessonIds);

		const doneByUser = new Map<string, number>();
		(progressResult.data ?? []).forEach((row) => {
			doneByUser.set(row.user_uid, (doneByUser.get(row.user_uid) ?? 0) + 1);
		});

		const total = lessonIds.length;
		const nextProgress: Record<string, { done: number; total: number; percent: number }> = {};
		userIds.forEach((userId) => {
			const done = doneByUser.get(userId) ?? 0;
			nextProgress[userId] = {
				done,
				total,
				percent: total === 0 ? 0 : Math.round((done / total) * 100),
			};
		});

		setSignupProgressByUser(nextProgress);
	};

	const handleCreateCourse = async () => {
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session?.user) {
			alert('Musisz być zalogowany jako instruktor.');
			return;
		}

		if (categories.length === 0) {
			notify('error', 'Brak kategorii w bazie. Dodaj kategorię przed utworzeniem kursu.');
			return;
		}

		const title = courseDraft.title.trim();
		if (!title) {
			notify('error', 'Podaj tytuł kursu.');
			return;
		}

		setLoading(true);
		try {
			const { data, error } = await supabase
				.from('courses')
				.insert({
					title,
					description: courseDraft.description.trim(),
					level: courseDraft.level,
					price: Number(courseDraft.price) || 0,
					category_id: Number(courseDraft.categoryId),
					instructor_uid: session.user.id,
					isOpen: false,
				})
				.select('id, title, description, level, price, category_id, instructor_uid, isOpen')
				.single();

			if (error || !data) {
				notify('error', `Błąd tworzenia kursu: ${error?.message ?? 'brak danych odpowiedzi'}`);
				return;
			}

			let creationNoticeType: 'success' | 'info' = 'success';
			let creationNotice = 'Kurs został utworzony i zapisany w bazie.';

			if (courseIconFile) {
				setCourseIconError(null);
				const iconPath = buildCourseIconPath(courseIconFile, data.id);
				const { error: uploadIconError } = await supabase.storage
					.from(COURSE_ICON_BUCKET)
					.upload(iconPath, courseIconFile, { cacheControl: '3600', upsert: false });

				if (uploadIconError) {
					creationNoticeType = 'info';
					creationNotice = `Kurs został utworzony, ale miniatura nie została wysłana: ${uploadIconError.message}`;
					setCourseIconError(uploadIconError.message);
				} else {
					const publicUrl = supabase.storage.from(COURSE_ICON_BUCKET).getPublicUrl(iconPath).data.publicUrl;
					const saveIconResult = await saveCourseIconPublicUrl(data.id, publicUrl);

					if (saveIconResult.error) {
						creationNoticeType = 'info';
						creationNotice = `Kurs został utworzony, ale URL miniatury nie został zapisany: ${saveIconResult.error}`;
						setCourseIconError(saveIconResult.error);
					} else {
						creationNotice = `Kurs został utworzony i miniatura zapisana w kolumnie ${saveIconResult.column}.`;
					}
				}
			}

			const categoryTitle =
				categories.find((category) => category.id === data.category_id)?.title ?? 'Bez kategorii';
			const nextCourse: AppCourse = {
				id: data.id,
				title: data.title,
				description: data.description ?? '',
				level: data.level ?? '',
				price: data.price ?? 0,
				categoryId: data.category_id,
				category: categoryTitle,
				instructorUid: data.instructor_uid,
				isOpen: data.isOpen ?? false,
			};

			const next = [nextCourse, ...coursesRef.current];
			setCourses(next);
			onCoursesUpdate?.(next);
			setCourseDraft({
				title: 'Nowy kurs',
				description: '',
				level: 'Podstawowy',
				price: 0,
				categoryId: String(categories[0]?.id ?? ''),
			});
			setCourseIconFile(null);
			setCourseIconError(null);
			notify(creationNoticeType, creationNotice);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Nieznany błąd podczas tworzenia kursu.';
			notify('error', `Błąd tworzenia kursu: ${message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateCourse = async (courseId: number) => {
		const course = coursesRef.current.find((item) => item.id === courseId);
		if (!course) {
			return;
		}

		setSavingCourseId(courseId);
		const { error } = await supabase
			.from('courses')
			.update({
				title: course.title,
				description: course.description,
				level: course.level,
				price: course.price,
				category_id: course.categoryId,
				isOpen: course.isOpen,
			})
			.eq('id', course.id);
		setSavingCourseId(null);

		if (error) {
			notify('error', `Błąd zapisu kursu: ${error.message}`);
			return;
		}

		await refreshInstructorCourses();
		notify('success', `Zaktualizowano kurs „${course.title}” i zapisano zmiany w bazie.`);
	};

	const handleDeleteCourse = async (courseId: number) => {
		if (!confirm('Usunąć kurs?')) {
			return;
		}

		setSavingCourseId(courseId);
		const { error } = await deleteCourseWithRelations(courseId);
		setSavingCourseId(null);

		if (error) {
			notify('error', `Błąd usuwania kursu: ${error}`);
			return;
		}

		const next = coursesRef.current.filter((course) => course.id !== courseId);
		setCourses(next);
		onCoursesUpdate?.(next);

		if (selectedCourseId === courseId) {
			setSelectedCourseId(null);
			setLessons([]);
			setSections([]);
			setSignups([]);
			setSignupProgressByUser({});
		}

		notify('success', 'Kurs został usunięty razem z danymi powiązanymi.');
	};

	const handleCourseFieldChange = (courseId: number, field: keyof AppCourse, value: string | number | boolean | null) => {
		setCourses((prev) =>
			prev.map((course) => {
				if (course.id !== courseId) {
					return course;
				}

				return {
					...course,
					[field]: value,
					category:
						field === 'categoryId'
							? categories.find((category) => category.id === Number(value))?.title ?? 'Bez kategorii'
							: course.category,
				};
			})
		);
	};

	const handleAddLesson = async () => {
		if (mutatingLesson) {
			return;
		}

		if (!selectedCourseId) {
			notify('error', 'Najpierw wybierz kurs w sekcji "Lekcje i zapisy".');
			return;
		}

		setMutatingLesson(true);
		try {
			const lessonNumberResult = await supabase
				.from('course_lessons')
				.select('lesson_number')
				.eq('course_id', selectedCourseId)
				.order('lesson_number', { ascending: false })
				.limit(1);

			if (lessonNumberResult.error) {
				notify('error', `Błąd pobierania numeru lekcji: ${lessonNumberResult.error.message}`);
				return;
			}

			const currentMaxNumber = Number(lessonNumberResult.data?.[0]?.lesson_number ?? 0);
			const nextLessonNumber = Number.isFinite(currentMaxNumber) ? currentMaxNumber + 1 : 1;
			const title = newLessonTitle.trim() || `Lekcja ${nextLessonNumber}`;

			const { error } = await insertLessonWithManualId({
				course_id: selectedCourseId,
				lesson_number: nextLessonNumber,
				title,
			});

			if (error) {
				notify('error', `Błąd dodawania lekcji: ${error}`);
				return;
			}

			await refreshCourseDetails(selectedCourseId);
			setNewLessonTitle('');
			notify('success', 'Lekcja została dodana i zapisana w bazie.');
		} finally {
			setMutatingLesson(false);
		}
	};

	const handleDeleteLesson = async (lessonId: number) => {
		if (!selectedCourseId) {
			return;
		}

		if (!confirm('Usunąć lekcję?')) {
			return;
		}

		const { error } = await supabase.from('course_lessons').delete().eq('id', lessonId);

		if (error) {
			notify('error', `Błąd usuwania lekcji: ${error.message}`);
			return;
		}

		await refreshCourseDetails(selectedCourseId);
		notify('success', 'Lekcja została usunięta.');
	};

	const handleLessonTitleUpdate = async (lessonId: number, title: string) => {
		const { error } = await supabase.from('course_lessons').update({ title }).eq('id', lessonId);

		if (error) {
			notify('error', `Błąd edycji lekcji: ${error.message}`);
			return;
		}

		notify('success', 'Zapisano nowy tytuł lekcji.');
	};

	const isSupportedUpload = (file: File) => {
		if (file.type.startsWith('video/')) {
			return true;
		}

		if (SUPPORTED_FILE_TYPES.has(file.type)) {
			return true;
		}

		const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
		return SUPPORTED_FILE_EXTENSIONS.has(extension);
	};

	const resolveSectionKind = (file: File) => {
		if (file.type.startsWith('video/')) {
			return 'video';
		}

		const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
		if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) {
			return 'video';
		}

		return 'file';
	};

	const buildStoragePath = (file: File, courseId: number, lessonId: number) => {
		const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
		const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		return `courses/${courseId}/lessons/${lessonId}/${uniqueId}-${safeName}`;
	};

	const buildCourseIconPath = (file: File, courseId: number) => {
		const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
		const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		return `courses/${courseId}/icons/${uniqueId}-${safeName}`;
	};

	const isMissingColumnError = (message: string) => {
		const lower = message.toLowerCase();
		return lower.includes('column') && (lower.includes('does not exist') || lower.includes('schema cache'));
	};

	const saveCourseIconPublicUrl = async (courseId: number, publicUrl: string) => {
		for (const column of COURSE_ICON_CANDIDATE_COLUMNS) {
			const { error } = await supabase
				.from('courses')
				.update({ [column]: publicUrl } as Record<string, string>)
				.eq('id', courseId);

			if (!error) {
				return { error: null as string | null, column };
			}

			if (!isMissingColumnError(error.message)) {
				return { error: error.message, column: null };
			}
		}

		return { error: 'Brak kolumny na URL miniatury (np. thumbnail_url lub image_url) w tabeli courses.', column: null };
	};

	const handleAddSection = async () => {
		if (mutatingSection) {
			return;
		}

		if (!selectedCourseId) {
			notify('error', 'Najpierw wybierz kurs.');
			return;
		}

		if (!newSectionLessonId) {
			notify('error', 'Wybierz lekcję, do której chcesz dodać sekcję.');
			return;
		}

		setMutatingSection(true);
		try {

			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session?.user) {
				notify('error', 'Sesja wygasła. Zaloguj się ponownie i spróbuj jeszcze raz.');
				return;
			}

			setUploadError(null);

			if (newSectionType === 'text') {
				const title = newSectionTitle.trim();
				const text = newSectionText.trim();

				if (!title || !text) {
					notify('error', 'Sekcja wymaga tytułu i treści.');
					return;
				}

				const sectionInsert = await insertSectionWithManualId({
					course_lessons_id: newSectionLessonId,
					title,
					text,
					kind: 'text',
				});

				if (sectionInsert.error) {
					const shouldTryLegacySchema =
						sectionInsert.code === '42703' ||
						sectionInsert.error.toLowerCase().includes('column') ||
						sectionInsert.error.toLowerCase().includes('kind');

					if (!shouldTryLegacySchema) {
						notify('error', `Błąd dodawania sekcji: ${sectionInsert.error}`);
						return;
					}

					const legacyInsert = await insertSectionWithManualId({
						course_lessons_id: newSectionLessonId,
						title,
						text,
					});

					if (legacyInsert.error) {
						notify('error', `Błąd dodawania sekcji: ${legacyInsert.error}`);
						return;
					}
				}

				await refreshCourseDetails(selectedCourseId);
				setNewSectionTitle('');
				setNewSectionText('');
				notify('success', 'Sekcja tekstowa została dodana i zapisana w bazie.');
				return;
			}

			if (!newSectionFile) {
				notify('error', 'Wybierz plik do dodania.');
				return;
			}

			if (!isSupportedUpload(newSectionFile)) {
				setUploadError('Dozwolone formaty: wideo, PDF, TXT, DOC, DOCX.');
				notify('error', 'Nieobsługiwany format pliku.');
				return;
			}

			setUploadingSection(true);

			try {
				const path = buildStoragePath(newSectionFile, selectedCourseId, newSectionLessonId);
				const { error: uploadError } = await supabase.storage
					.from(STORAGE_BUCKET)
					.upload(path, newSectionFile, { cacheControl: '3600', upsert: false });

				if (uploadError) {
					const isRlsError = uploadError.message.toLowerCase().includes('row-level security');
					if (isRlsError) {
						setUploadError('Upload nieudany: brak polityki RLS dla storage.objects (insert). Uruchom SQL z dokumentacji/storage_policies.sql.');
						notify('error', 'Brak polityki RLS Storage. Uruchom SQL z dokumentacji/storage_policies.sql i odśwież stronę.');
					} else {
						setUploadError(`Upload nieudany: ${uploadError.message}`);
						notify('error', `Upload nieudany: ${uploadError.message}`);
					}
					return;
				}

				const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
				const sectionKind = resolveSectionKind(newSectionFile);
				const title = newSectionTitle.trim() || newSectionFile.name;

				const sectionInsert = await insertSectionWithManualId({
					course_lessons_id: newSectionLessonId,
					title,
					text: '',
					kind: sectionKind,
					file_url: publicUrl,
					file_name: newSectionFile.name,
					mime_type: newSectionFile.type,
				});

				if (sectionInsert.error) {
					const shouldTryLegacySchema =
						sectionInsert.code === '42703' ||
						sectionInsert.error.toLowerCase().includes('column') ||
						sectionInsert.error.toLowerCase().includes('kind');

					if (!shouldTryLegacySchema) {
						notify('error', `Błąd dodawania sekcji: ${sectionInsert.error}`);
						return;
					}

					const legacyInsert = await insertSectionWithManualId({
						course_lessons_id: newSectionLessonId,
						title,
						text: `Materiał (${sectionKind}): ${publicUrl}`,
					});

					if (legacyInsert.error) {
						notify('error', `Błąd dodawania sekcji: ${legacyInsert.error}`);
						return;
					}
				}

				setNewSectionTitle('');
				setNewSectionText('');
				setNewSectionFile(null);
				await refreshCourseDetails(selectedCourseId);
				notify('success', 'Sekcja z plikiem została dodana i zapisana w bazie.');
			} finally {
				setUploadingSection(false);
			}
		} finally {
			setMutatingSection(false);
		}
	};

	const handleDeleteSection = async (sectionId: number) => {
		if (!selectedCourseId) {
			return;
		}

		if (!confirm('Usunąć sekcję?')) {
			return;
		}

		const { error } = await supabase.from('lesson_sections').delete().eq('id', sectionId);

		if (error) {
			notify('error', `Błąd usuwania sekcji: ${error.message}`);
			return;
		}

		await refreshCourseDetails(selectedCourseId);
		notify('success', 'Sekcja została usunięta.');
	};

	return (
		<div className={styles.panel}>
			{notice && (
				<div className={`${styles.notice} ${styles[`notice${notice.type[0].toUpperCase()}${notice.type.slice(1)}`]}`}>
					{notice.text}
				</div>
			)}

			<section className={styles.headerCard}>
				<h2 className={styles.title}>Panel instruktora</h2>
				<p className={styles.subtitle}>Twórz i edytuj kursy, dodawaj lekcje oraz zarządzaj zapisami użytkowników.</p>
				<div className={styles.createGrid}>
					<input
						className={styles.input}
						value={courseDraft.title}
						onChange={(event) => setCourseDraft((prev) => ({ ...prev, title: event.target.value }))}
						placeholder="Tytuł nowego kursu"
					/>
					<select
						className={styles.select}
						value={courseDraft.level}
						onChange={(event) => setCourseDraft((prev) => ({ ...prev, level: event.target.value }))}
					>
						<option value="Podstawowy">Podstawowy</option>
						<option value="Średnio Zaawansowany">Średnio Zaawansowany</option>
						<option value="Zaawansowany">Zaawansowany</option>
					</select>
					<input
						className={styles.input}
						type="number"
						min={0}
						value={courseDraft.price}
						onChange={(event) => setCourseDraft((prev) => ({ ...prev, price: Number(event.target.value) || 0 }))}
						placeholder="Cena"
					/>
					<select
						className={styles.select}
						value={courseDraft.categoryId}
						onChange={(event) => setCourseDraft((prev) => ({ ...prev, categoryId: event.target.value }))}
					>
						{categories.map((category) => (
							<option key={category.id} value={String(category.id)}>
								{category.title}
							</option>
						))}
					</select>
					<label className={styles.fieldLabel}>
						Miniatura kursu (opcjonalnie)
						<input
							className={styles.input}
							type="file"
							accept="image/*"
							onChange={(event) => {
								setCourseIconFile(event.target.files?.[0] ?? null);
								setCourseIconError(null);
							}}
						/>
						{courseIconFile && <span className={styles.metaText}>Wybrany plik: {courseIconFile.name}</span>}
						{courseIconError && <span className={styles.errorText}>{courseIconError}</span>}
					</label>
					<textarea
						className={`${styles.textarea} ${styles.createDescription}`}
						value={courseDraft.description}
						onChange={(event) => setCourseDraft((prev) => ({ ...prev, description: event.target.value }))}
						placeholder="Opis nowego kursu"
					/>
				</div>
				<div className={`${styles.controls} ${styles.createActions}`}>
					<button onClick={handleCreateCourse} disabled={loading || uploadingSection || savingCourseId !== null} className={styles.button}>
						Dodaj nowy kurs
					</button>
				</div>
			</section>

			{courses.length === 0 ? (
				<section className={styles.card}>
					<p>Nie masz jeszcze żadnych kursów.</p>
				</section>
			) : (
				<section className={styles.card}>
				<table className={styles.gridTable}>
					<thead>
						<tr>
							<th>Tytuł</th>
							<th>Opis</th>
							<th>Poziom</th>
							<th>Cena</th>
							<th>Kategoria</th>
							<th>Widoczność</th>
							<th>Akcje</th>
						</tr>
					</thead>
					<tbody>
						{courses.map((course) => (
							<tr key={course.id}>
								<td>
									<input
										className={styles.input}
										value={course.title}
										onChange={(event) => handleCourseFieldChange(course.id, 'title', event.target.value)}
									/>
								</td>
								<td>
									<textarea
										className={styles.textarea}
										value={course.description}
										onChange={(event) => handleCourseFieldChange(course.id, 'description', event.target.value)}
									/>
								</td>
								<td>
									<select
										className={styles.select}
										value={course.level}
										onChange={(event) => handleCourseFieldChange(course.id, 'level', event.target.value)}
									>
										<option value="Podstawowy">Podstawowy</option>
										<option value="Średnio Zaawansowany">Średnio Zaawansowany</option>
										<option value="Zaawansowany">Zaawansowany</option>
									</select>
								</td>
								<td>
									<input
										className={styles.input}
										type="number"
										min={0}
										value={course.price}
										onChange={(event) => handleCourseFieldChange(course.id, 'price', Number(event.target.value) || 0)}
									/>
								</td>
								<td>
									<select
										className={styles.select}
										value={course.categoryId ?? ''}
										onChange={(event) => {
											const value = event.target.value;
											handleCourseFieldChange(
												course.id,
												'categoryId',
												value === '' ? null : Number(value)
											);
										}}
									>
										<option value="">Bez kategorii</option>
										{categories.map((category) => (
											<option key={category.id} value={category.id}>
												{category.title}
											</option>
										))}
									</select>
								</td>
								<td>
									<select
										className={styles.select}
										value={course.isOpen ? 'open' : 'closed'}
										onChange={(event) =>
											handleCourseFieldChange(course.id, 'isOpen', event.target.value === 'open')
										}
									>
										<option value="open">Otwarte</option>
										<option value="closed">Zamknięte</option>
									</select>
								</td>
								<td>
									<div className={styles.controls}>
									<button onClick={() => handleUpdateCourse(course.id)} disabled={savingCourseId === course.id || loading} className={styles.button}>
										Zapisz kurs
									</button>
									<button onClick={() => handleDeleteCourse(course.id)} disabled={savingCourseId === course.id || loading} className={styles.dangerButton}>
										Usuń kurs
									</button>
									<button
										className={styles.secondaryButton}
										onClick={async () => {
											setSelectedCourseId(course.id);
											await refreshCourseDetails(course.id);
										}}
									>
										Lekcje i zapisy
									</button>
									<Link href={`/courses/${course.id}`}><button className={styles.secondaryButton}>Strona kursu</button></Link>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				</section>
			)}

			{selectedCourse && (
				<section className={styles.card}>
					<h3 className={styles.bold}>Zarządzanie treścią kursu: {selectedCourse.title}</h3>
					<p className={styles.metaText}>Lekcja to etap kursu, a sekcja to pojedynczy element treści w tej lekcji (tekst lub plik).</p>
					<div className={styles.builderGrid}>
						<div className={styles.builderCard}>
							<h4 className={styles.bold}>Dodaj lekcję</h4>
							<div className={styles.lessonForm}>
								<label className={styles.fieldLabel}>
									Tytuł lekcji:
									<input
										className={`${styles.input} ${styles.lessonTitleInput}`}
										value={newLessonTitle}
										onChange={(event) => setNewLessonTitle(event.target.value)}
										placeholder="Tytuł nowej lekcji (opcjonalnie)"
									/>
								</label>
								<div className={styles.lessonActionStack}>
									<button
										onClick={handleAddLesson}
										disabled={loading || uploadingSection || mutatingLesson || mutatingSection || savingCourseId !== null}
										className={`${styles.secondaryButton} ${styles.wideButton}`}
									>
										{mutatingLesson ? 'Dodawanie...' : 'Dodaj lekcję'}
									</button>
									<Link href={`/courses/${selectedCourse.id}`} className={`${styles.linkButton} ${styles.wideButton}`}>Zobacz stronę kursu</Link>
								</div>
							</div>
						</div>

						<div className={styles.builderCard}>
							<h4 className={styles.bold}>Dodaj sekcję</h4>
							<label className={styles.fieldLabel}>
								Lekcja:
								<select
									className={styles.select}
									value={newSectionLessonId ?? ''}
									onChange={(event) => setNewSectionLessonId(Number(event.target.value) || null)}
								>
									<option value="">Wybierz lekcję</option>
									{lessons.map((lesson) => (
										<option key={lesson.id} value={lesson.id}>
											{lesson.lesson_number}. {lesson.title}
										</option>
									))}
								</select>
							</label>
							<label className={styles.fieldLabel}>
								Typ sekcji:
								<select
									className={styles.select}
									value={newSectionType}
									onChange={(event) => setNewSectionType(event.target.value as 'text' | 'file')}
								>
									<option value="text">Tekst</option>
									<option value="file">Plik (wideo / PDF / TXT / DOCX)</option>
								</select>
							</label>
							<input
								className={styles.input}
								type="text"
								placeholder="Tytuł sekcji"
								value={newSectionTitle}
								onChange={(event) => setNewSectionTitle(event.target.value)}
							/>
							{newSectionType === 'text' ? (
								<textarea
									className={styles.textarea}
									placeholder="Treść sekcji"
									value={newSectionText}
									onChange={(event) => setNewSectionText(event.target.value)}
								/>
							) : (
								<div>
									<input
										className={styles.input}
										type="file"
										accept="video/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
										onChange={(event) => setNewSectionFile(event.target.files?.[0] ?? null)}
									/>
									{uploadError && <p className={styles.errorText}>{uploadError}</p>}
								</div>
							)}
							<button onClick={handleAddSection} disabled={uploadingSection || loading || mutatingLesson || mutatingSection || savingCourseId !== null} className={styles.secondaryButton}>
								{uploadingSection ? 'Wysyłanie...' : mutatingSection ? 'Dodawanie...' : 'Dodaj sekcję'}
							</button>
						</div>
					</div>

					<h4>Lekcje</h4>
					{lessons.length === 0 ? (
						<p>Brak lekcji.</p>
					) : (
						<ul className={styles.list}>
							{lessons.map((lesson) => (
								<li key={lesson.id} className={styles.item}>
									<input
										className={styles.input}
										value={lesson.title}
										onChange={(event) => {
											const title = event.target.value;
											setLessons((prev) =>
												prev.map((item) => (item.id === lesson.id ? { ...item, title } : item))
											);
										}}
									/>
									<div className={styles.controls}>
										<button onClick={() => handleLessonTitleUpdate(lesson.id, lesson.title)} disabled={loading || uploadingSection || savingCourseId !== null} className={styles.secondaryButton}>Zapisz tytuł</button>
										<button onClick={() => handleDeleteLesson(lesson.id)} disabled={loading || uploadingSection || savingCourseId !== null} className={styles.dangerButton}>Usuń lekcję</button>
										<Link href={`/courses/${selectedCourse.id}/lesson/${lesson.id}`} className={styles.linkButton}>Podgląd lekcji</Link>
									</div>

									<ul className={styles.list}>
										{sections
											.filter((section) => section.course_lessons_id === lesson.id)
											.map((section) => (
												<li key={section.id} className={styles.item}>
													<strong>{section.title}</strong>
													{section.kind === 'text' || !section.kind ? (
														<p>{section.text}</p>
													) : section.kind === 'video' ? (
														<div>
															<p>Wideo: {section.file_name ?? 'plik wideo'}</p>
															{section.file_url && (
																<a href={section.file_url} target="_blank" rel="noreferrer">Otwórz wideo</a>
															)}
														</div>
													) : (
														<div>
															<p>Plik: {section.file_name ?? 'material'}</p>
															{section.file_url && (
																<a href={section.file_url} target="_blank" rel="noreferrer">Pobierz</a>
															)}
														</div>
													)}
													<button onClick={() => handleDeleteSection(section.id)} disabled={loading || uploadingSection || savingCourseId !== null} className={styles.dangerButton}>Usuń sekcję</button>
												</li>
											))}
									</ul>
								</li>
							))}
						</ul>
					)}

					<h4 className={styles.bold}>Zapisani użytkownicy</h4>
					{signups.length === 0 ? (
						<p>Brak zapisów na ten kurs.</p>
					) : (
						<table className={styles.gridTable}>
							<thead>
								<tr>
									<th>UID użytkownika</th>
									<th>Postęp</th>
									<th>Data zapisu</th>
								</tr>
							</thead>
							<tbody>
								{signups.map((signup) => (
									<tr key={signup.id}>
										<td>{signup.user_uid}</td>
										<td>
											<div className={styles.progressWrap}>
												<div
													className={styles.progressBar}
													style={{ width: `${signupProgressByUser[signup.user_uid]?.percent ?? 0}%` }}
												/>
											</div>
											<div className={styles.progressLabel}>
												{signupProgressByUser[signup.user_uid]?.done ?? 0}/
												{signupProgressByUser[signup.user_uid]?.total ?? 0} lekcji
											</div>
										</td>
										<td>{new Date(signup.created_at).toLocaleString('pl-PL')}</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</section>
			)}
		</div>
	);
};
