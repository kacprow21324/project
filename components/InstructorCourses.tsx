'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
	fetchCategories,
	mapCourseRowToAppCourse,
	type AppCourse,
	type CategoryOption,
} from '@/lib/appData';
import styles from './DashboardPanels.module.css';

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
}

interface CourseSignup {
	id: number;
	created_at: string;
	user_uid: string;
}

export const InstructorCourses = ({ initialCourses, onCoursesUpdate }: InstructorCoursesProps) => {
	const [courses, setCourses] = useState<AppCourse[]>(initialCourses);
	const [categories, setCategories] = useState<CategoryOption[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
	const [lessons, setLessons] = useState<CourseLesson[]>([]);
	const [sections, setSections] = useState<LessonSection[]>([]);
	const [signups, setSignups] = useState<CourseSignup[]>([]);
	const [signupProgressByUser, setSignupProgressByUser] = useState<Record<string, { done: number; total: number; percent: number }>>({});
	const [newSectionLessonId, setNewSectionLessonId] = useState<number | null>(null);
	const [newSectionTitle, setNewSectionTitle] = useState('');
	const [newSectionText, setNewSectionText] = useState('');

	useEffect(() => {
		setCourses(initialCourses);
	}, [initialCourses]);

	useEffect(() => {
		const loadCategories = async () => {
			setCategories(await fetchCategories());
		};

		loadCategories();
	}, []);

	const selectedCourse = useMemo(
		() => courses.find((course) => course.id === selectedCourseId) ?? null,
		[courses, selectedCourseId]
	);

	const refreshInstructorCourses = async () => {
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
	};

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
			.select('id, course_lessons_id, title, text')
			.in('course_lessons_id', lessonIds)
			.order('id', { ascending: true });

		setSections(sectionResult.data ?? []);
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

		setLoading(true);
		const { error } = await supabase.from('courses').insert({
			title: 'Nowy kurs',
			description: '',
			level: 'Podstawowy',
			price: 0,
			category_id: categories[0]?.id ?? null,
			instructor_uid: session.user.id,
			isOpen: true,
		});

		setLoading(false);

		if (error) {
			alert(`Błąd tworzenia kursu: ${error.message}`);
			return;
		}

		await refreshInstructorCourses();
	};

	const handleUpdateCourse = async (course: AppCourse) => {
		setLoading(true);
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
		setLoading(false);

		if (error) {
			alert(`Błąd zapisu kursu: ${error.message}`);
			return;
		}

		await refreshInstructorCourses();
	};

	const handleDeleteCourse = async (courseId: number) => {
		if (!confirm('Usunąć kurs?')) {
			return;
		}

		setLoading(true);
		const { error } = await supabase.from('courses').delete().eq('id', courseId);
		setLoading(false);

		if (error) {
			alert(`Błąd usuwania kursu: ${error.message}`);
			return;
		}

		if (selectedCourseId === courseId) {
			setSelectedCourseId(null);
			setLessons([]);
			setSections([]);
			setSignups([]);
			setSignupProgressByUser({});
		}

		await refreshInstructorCourses();
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
		if (!selectedCourseId) {
			return;
		}

		const nextLessonNumber =
			lessons.length === 0 ? 1 : Math.max(...lessons.map((lesson) => lesson.lesson_number)) + 1;

		const { error } = await supabase.from('course_lessons').insert({
			course_id: selectedCourseId,
			lesson_number: nextLessonNumber,
			title: `Lekcja ${nextLessonNumber}`,
		});

		if (error) {
			alert(`Błąd dodawania lekcji: ${error.message}`);
			return;
		}

		await refreshCourseDetails(selectedCourseId);
	};

	const handleDeleteLesson = async (lessonId: number) => {
		if (!selectedCourseId) {
			return;
		}

		const { error } = await supabase.from('course_lessons').delete().eq('id', lessonId);

		if (error) {
			alert(`Błąd usuwania lekcji: ${error.message}`);
			return;
		}

		await refreshCourseDetails(selectedCourseId);
	};

	const handleLessonTitleUpdate = async (lessonId: number, title: string) => {
		const { error } = await supabase.from('course_lessons').update({ title }).eq('id', lessonId);

		if (error) {
			alert(`Błąd edycji lekcji: ${error.message}`);
			return;
		}
	};

	const handleAddSection = async () => {
		if (!selectedCourseId || !newSectionLessonId) {
			return;
		}

		const title = newSectionTitle.trim();
		const text = newSectionText.trim();

		if (!title || !text) {
			alert('Sekcja wymaga tytułu i treści.');
			return;
		}

		const { error } = await supabase.from('lesson_sections').insert({
			course_lessons_id: newSectionLessonId,
			title,
			text,
		});

		if (error) {
			alert(`Błąd dodawania sekcji: ${error.message}`);
			return;
		}

		setNewSectionTitle('');
		setNewSectionText('');
		await refreshCourseDetails(selectedCourseId);
	};

	const handleDeleteSection = async (sectionId: number) => {
		if (!selectedCourseId) {
			return;
		}

		const { error } = await supabase.from('lesson_sections').delete().eq('id', sectionId);

		if (error) {
			alert(`Błąd usuwania sekcji: ${error.message}`);
			return;
		}

		await refreshCourseDetails(selectedCourseId);
	};

	return (
		<div className={styles.panel}>
			<section className={styles.headerCard}>
				<h2 className={styles.title}>Panel instruktora</h2>
				<p className={styles.subtitle}>Twórz i edytuj kursy, dodawaj lekcje oraz zarządzaj zapisami użytkowników.</p>
				<div className={styles.controls}>
					<button onClick={handleCreateCourse} disabled={loading} className={styles.button}>
				Dodaj nowy kurs
					</button>
					<Link href="/courses" className={styles.linkButton}>Podgląd katalogu kursów</Link>
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
									<button onClick={() => handleUpdateCourse(course)} disabled={loading} className={styles.button}>
										Zapisz kurs
									</button>
									<button onClick={() => handleDeleteCourse(course.id)} disabled={loading} className={styles.dangerButton}>
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
					<h3>Zarządzanie treścią kursu: {selectedCourse.title}</h3>
					<div className={styles.controls}>
						<button onClick={handleAddLesson} className={styles.secondaryButton}>Dodaj lekcję</button>
						<Link href={`/courses/${selectedCourse.id}`} className={styles.linkButton}>Zobacz stronę kursu</Link>
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
										<button onClick={() => handleLessonTitleUpdate(lesson.id, lesson.title)} className={styles.secondaryButton}>Zapisz tytuł</button>
										<button onClick={() => handleDeleteLesson(lesson.id)} className={styles.dangerButton}>Usuń lekcję</button>
										<Link href={`/courses/${selectedCourse.id}/lesson/${lesson.id}`} className={styles.linkButton}>Podgląd lekcji</Link>
									</div>

									<ul className={styles.list}>
										{sections
											.filter((section) => section.course_lessons_id === lesson.id)
											.map((section) => (
												<li key={section.id} className={styles.item}>
													<strong>{section.title}</strong>
													<p>{section.text}</p>
													<button onClick={() => handleDeleteSection(section.id)} className={styles.dangerButton}>Usuń sekcję</button>
												</li>
											))}
									</ul>
								</li>
							))}
						</ul>
					)}

					<h4>Dodaj sekcję</h4>
					<label>
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
					<div>
						<input
							className={styles.input}
							type="text"
							placeholder="Tytuł sekcji"
							value={newSectionTitle}
							onChange={(event) => setNewSectionTitle(event.target.value)}
						/>
					</div>
					<div>
						<textarea
							className={styles.textarea}
							placeholder="Treść sekcji"
							value={newSectionText}
							onChange={(event) => setNewSectionText(event.target.value)}
						/>
					</div>
					<button onClick={handleAddSection} className={styles.secondaryButton}>Dodaj sekcję</button>

					<h4>Zapisani użytkownicy</h4>
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
