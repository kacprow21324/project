'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { mapCourseRowToAppCourse, roleIdToName, type AppCourse, type UserRole } from '@/lib/appData';
import styles from './CourseDetails.module.css';

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

interface CourseReview {
    id: string;
    author: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export default function CourseDetails() {
    const params = useParams<{ slug: string }>();
    const courseId = useMemo(() => Number(params?.slug), [params]);

    const [course, setCourse] = useState<AppCourse | null>(null);
    const [lessons, setLessons] = useState<CourseLesson[]>([]);
    const [sections, setSections] = useState<LessonSection[]>([]);
    const [userRole, setUserRole] = useState<UserRole>('User');
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [viewerLabel, setViewerLabel] = useState('Użytkownik');
    const [viewerId, setViewerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviews, setReviews] = useState<CourseReview[]>([]);
    const [reviewsSource, setReviewsSource] = useState<'database' | 'local'>('database');
    const [reviewRating, setReviewRating] = useState<number>(5);
    const [reviewComment, setReviewComment] = useState<string>('');

    useEffect(() => {
        let isActive = true;

        const loadPageData = async () => {
            setLoading(true);
            setError(null);

            try {
                if (!Number.isFinite(courseId)) {
                    setError('Nieprawidłowy identyfikator kursu.');
                    setLoading(false);
                    return;
                }

                const [courseResult, lessonsResult, sessionResult] = await Promise.all([
                    supabase
                        .from('courses')
                        .select('id, title, description, level, price, category_id, instructor_uid, isOpen, categories(id, title)')
                        .eq('id', courseId)
                        .single(),
                    supabase
                        .from('course_lessons')
                        .select('id, lesson_number, title')
                        .eq('course_id', courseId)
                        .order('lesson_number', { ascending: true }),
                    supabase.auth.getSession(),
                ]);

                if (!isActive) return;

                if (courseResult.error || !courseResult.data) {
                    setError('Nie znaleziono kursu.');
                    return;
                }

                if (!courseResult.data.isOpen) {
                    setError('Ten kurs jest obecnie zamknięty przez moderatora.');
                    return;
                }

                setCourse(mapCourseRowToAppCourse(courseResult.data));
                setLessons(lessonsResult.data ?? []);

                const lessonIds = (lessonsResult.data ?? []).map((lesson) => lesson.id);
                if (lessonIds.length > 0) {
                    const { data: sectionData } = await supabase
                        .from('lesson_sections')
                        .select('id, course_lessons_id, title, text')
                        .in('course_lessons_id', lessonIds)
                        .order('id', { ascending: true });
                    if (isActive) {
                        setSections(sectionData ?? []);
                    }
                } else {
                    setSections([]);
                }

                const sessionUser = sessionResult.data.session?.user;
                if (sessionUser) {
                    const [roleResult, signupResult] = await Promise.all([
                        supabase
                            .from('users')
                            .select('role_id')
                            .eq('UID', sessionUser.id)
                            .single(),
                        supabase
                            .from('course_signups')
                            .select('id')
                            .eq('course_id', courseId)
                            .eq('user_uid', sessionUser.id)
                            .maybeSingle(),
                    ]);

                    if (!isActive) return;

                    setUserRole(roleResult.data ? roleIdToName(roleResult.data.role_id) : 'User');
                    setIsEnrolled(Boolean(signupResult.data));
                    setViewerId(sessionUser.id);
                    setViewerLabel(
                        sessionUser.user_metadata?.username ||
                        sessionUser.email?.split('@')[0] ||
                        'Użytkownik'
                    );
                } else {
                    setUserRole('User');
                    setIsEnrolled(false);
                    setViewerId(null);
                }
            } catch (e) {
                console.error('Error while loading course page:', e);
                if (isActive) {
                    setError('Wystąpił błąd podczas ładowania kursu. Odśwież stronę.');
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        loadPageData();

        return () => {
            isActive = false;
        };
    }, [courseId]);

    useEffect(() => {
        let isActive = true;

        if (!Number.isFinite(courseId)) {
            setReviews([]);
            return;
        }

        const loadReviews = async () => {
            const dbResult = await supabase
                .from('course_reviews')
                .select('id, rating, comment, created_at, user_uid')
                .eq('course_id', courseId)
                .order('created_at', { ascending: false });

            if (!isActive) {
                return;
            }

            if (!dbResult.error && dbResult.data) {
                setReviews(
                    dbResult.data.map((row) => ({
                        id: String(row.id),
                        author: row.user_uid ? `${String(row.user_uid).slice(0, 8)}...` : 'Użytkownik',
                        rating: Number(row.rating ?? 0),
                        comment: row.comment ?? '',
                        createdAt: row.created_at ?? new Date().toISOString(),
                    }))
                );
                setReviewsSource('database');
                return;
            }

            try {
                const raw = localStorage.getItem(`course_reviews_${courseId}`);
                if (!raw) {
                    setReviews([]);
                    setReviewsSource('local');
                    return;
                }

                const parsed = JSON.parse(raw) as CourseReview[];
                setReviews(Array.isArray(parsed) ? parsed : []);
                setReviewsSource('local');
            } catch {
                setReviews([]);
                setReviewsSource('local');
            }
        };

        loadReviews();

        return () => {
            isActive = false;
        };
    }, [courseId]);

    const persistReviews = (nextReviews: CourseReview[]) => {
        setReviews(nextReviews);
        localStorage.setItem(`course_reviews_${courseId}`, JSON.stringify(nextReviews));
    };

    const handleAddReview = () => {
        if (!course) {
            return;
        }

        if (userRole === 'User' && !isEnrolled) {
            alert('Aby dodać recenzję, musisz być zapisany na kurs.');
            return;
        }

        const comment = reviewComment.trim();
        if (!comment) {
            alert('Dodaj treść recenzji.');
            return;
        }

        const review: CourseReview = {
            id: `${Date.now()}-${Math.random()}`,
            author: viewerLabel,
            rating: reviewRating,
            comment,
            createdAt: new Date().toISOString(),
        };

        const saveReview = async () => {
            if (!viewerId) {
                persistReviews([review, ...reviews]);
                setReviewComment('');
                setReviewRating(5);
                setReviewsSource('local');
                return;
            }

            const dbInsert = await supabase
                .from('course_reviews')
                .insert({
                    course_id: course.id,
                    user_uid: viewerId,
                    rating: review.rating,
                    comment: review.comment,
                })
                .select('id, rating, comment, created_at, user_uid')
                .single();

            if (!dbInsert.error && dbInsert.data) {
                const savedReview: CourseReview = {
                    id: String(dbInsert.data.id),
                    author: viewerLabel,
                    rating: Number(dbInsert.data.rating ?? 0),
                    comment: dbInsert.data.comment ?? '',
                    createdAt: dbInsert.data.created_at ?? new Date().toISOString(),
                };

                setReviews((prev) => [savedReview, ...prev]);
                setReviewComment('');
                setReviewRating(5);
                setReviewsSource('database');
                return;
            }

            persistReviews([review, ...reviews]);
            setReviewComment('');
            setReviewRating(5);
            setReviewsSource('local');
        };

        saveReview();
    };

    const handleEnroll = async () => {
        if (!course) {
            return;
        }

        const { data: authData } = await supabase.auth.getSession();
        const authedUser = authData.session?.user;

        if (!authedUser) {
            alert('Musisz być zalogowany, aby się zapisać.');
            return;
        }

        if (userRole !== 'User') {
            alert('Na kurs może zapisać się wyłącznie użytkownik z rolą User.');
            return;
        }

        const { data: existingSignup } = await supabase
            .from('course_signups')
            .select('id')
            .eq('course_id', course.id)
            .eq('user_uid', authedUser.id)
            .maybeSingle();

        if (existingSignup) {
            alert('Jesteś już zapisany na ten kurs.');
            return;
        }

        const { error: signupError } = await supabase
            .from('course_signups')
            .insert({ course_id: course.id, user_uid: authedUser.id });

        if (signupError) {
            alert(`Błąd zapisu: ${signupError.message}`);
            return;
        }

        setIsEnrolled(true);
        alert('Zapisano na kurs!');
    };

    const averageRating =
        reviews.length === 0
            ? 0
            : Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10;

    if (loading) {
        return <div>Ładowanie szczegółów kursu...</div>;
    }

    if (error || !course) {
        return (
            <div className={styles.page}>
                <Link href="/courses" className={styles.backLink}>Wróć do katalogu</Link>
                <div>{error ?? 'Nie udało się załadować kursu.'}</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <Link href="/courses" className={styles.backLink}>Wróć do katalogu</Link>

            <section className={styles.hero}>
                <h1 className={styles.title}>{course.title}</h1>
                <div className={styles.meta}>
                    <span className={styles.badge}>{course.level || 'Poziom nieokreślony'}</span>
                    <span className={styles.badge}>{course.category}</span>
                    <span className={styles.badge}>{course.price} PLN</span>
                </div>
                <p className={styles.description}>{course.description || 'Brak opisu kursu.'}</p>

                {isEnrolled ? (
                    <p className={styles.enrolledInfo}>Jesteś już zapisany na ten kurs.</p>
                ) : (
                    <button onClick={handleEnroll} className={styles.primaryBtn}>Zapisz się na kurs</button>
                )}
            </section>

            <section className={styles.lessonList}>
                <h2>Lekcje kursu</h2>
                {lessons.length === 0 ? (
                    <p>Ten kurs nie ma jeszcze lekcji.</p>
                ) : (
                    <ol>
                    {lessons.map((lesson) => {
                        const lessonSections = sections.filter((section) => section.course_lessons_id === lesson.id);

                        return (
                            <li key={lesson.id} className={styles.lessonItem}>
                                <h3 className={styles.lessonTitle}>
                                    Lekcja {lesson.lesson_number}: {lesson.title}
                                </h3>
                                <Link
                                    href={`/courses/${course.id}/lesson/${lesson.id}`}
                                    className={styles.lessonLink}
                                >
                                    Otwórz lekcję
                                </Link>

                                {lessonSections.length === 0 ? (
                                    <p>Brak sekcji w tej lekcji.</p>
                                ) : (
                                    <ul className={styles.sectionList}>
                                        {lessonSections.map((section) => (
                                            <li key={section.id} className={styles.sectionItem}>
                                                <strong>{section.title}</strong>
                                                <p>{section.text}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                    </ol>
                )}
            </section>

            <section className={styles.reviewSection}>
                <h2>Recenzje kursu</h2>
                <p className={styles.reviewMeta}>
                    Średnia ocen: {averageRating} / 5 ({reviews.length} opinii)
                </p>
                <p className={styles.reviewMeta}>
                    Źródło opinii: {reviewsSource === 'database' ? 'Baza danych' : 'Tryb lokalny przeglądarki'}
                </p>

                <div className={styles.reviewForm}>
                    <label>
                        Ocena
                        <select
                            value={reviewRating}
                            onChange={(event) => setReviewRating(Number(event.target.value))}
                            className={styles.reviewInput}
                        >
                            <option value={5}>5</option>
                            <option value={4}>4</option>
                            <option value={3}>3</option>
                            <option value={2}>2</option>
                            <option value={1}>1</option>
                        </select>
                    </label>
                    <label>
                        Twoja opinia
                        <textarea
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                            className={styles.reviewTextarea}
                            placeholder="Napisz co podobało Ci się w kursie i co warto poprawić"
                        />
                    </label>
                    <button onClick={handleAddReview} className={styles.primaryBtn}>Dodaj recenzję</button>
                </div>

                {reviews.length === 0 ? (
                    <p>Brak recenzji. Bądź pierwszą osobą, która oceni kurs.</p>
                ) : (
                    <ul className={styles.reviewList}>
                        {reviews.map((review) => (
                            <li key={review.id} className={styles.reviewItem}>
                                <strong>{review.author}</strong>
                                <p className={styles.reviewMeta}>
                                    Ocena: {review.rating}/5 • {new Date(review.createdAt).toLocaleDateString('pl-PL')}
                                </p>
                                <p>{review.comment}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}