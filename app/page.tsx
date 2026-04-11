'use client';

import styled from '@emotion/styled';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchCategories, type CategoryOption } from '@/lib/appData';
import { supabase } from '@/lib/supabaseClient';

const fallbackCategories = [
  { id: 1, title: 'Programowanie' },
  { id: 2, title: 'Data Science i AI' },
  { id: 3, title: 'UX/UI i Product' },
  { id: 4, title: 'Marketing Cyfrowy' },
  { id: 5, title: 'Biznes i Zarządzanie' },
  { id: 6, title: 'Języki Obce' },
];

const defaultCourseImage = '/assets/ogolne.jpg';

type SupabaseCourseRow = Record<string, unknown>;
type SupabaseReviewRow = Record<string, unknown>;

interface CarouselCourse {
  id: number;
  title: string;
  level: string;
  priceLabel: string;
  imageUrl: string;
  averageRating: number | null;
  reviewsCount: number;
  commentsCount: number;
}

const Page = styled.div`
  display: grid;
  gap: 1.6rem;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  overflow-x: hidden;
  padding: 0 clamp(14px, 3vw, 28px) 2rem;
`;

const Section = styled.section`
  background: linear-gradient(160deg, #ffffff, #fbfdff);
  border: 1px solid rgba(148, 163, 184, 0.23);
  border-radius: 18px;
  padding: clamp(1rem, 2vw, 1.4rem);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.07);
`;

const Hero = styled(Section)`
  min-height: clamp(280px, 32vw, 390px);
  padding: clamp(1.2rem, 2.4vw, 2.1rem);
  background:
    radial-gradient(circle at 14% 18%, rgba(242, 100, 25, 0.15), transparent 44%),
    radial-gradient(circle at 84% 16%, rgba(20, 184, 166, 0.14), transparent 48%),
    linear-gradient(145deg, #ffffff, #f3f8ff);
  display: grid;
  align-content: start;
  gap: 1.05rem;
  overflow: visible;
`;

const HeroContent = styled.div`
  width: min(100%, 840px);
  min-width: 0;
  display: grid;
  gap: 1rem;
`;

const HeroTitle = styled.h1`
  margin: 0;
  color: #18212f;
  font-size: clamp(1.95rem, 4.2vw, 3.2rem);
  line-height: 1.12;
  display: block;
  width: 100%;
  max-width: 100%;
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: normal;
  hyphens: auto;
  text-wrap: balance;
`;

const HeroText = styled.p`
  margin: 0;
  color: #334155;
  max-width: 62ch;
  font-size: 1.05rem;
  line-height: 1.7;
`;

const HeroActions = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const ButtonPrimary = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  text-decoration: none;
  border: 1px solid #e85d27;
  background: linear-gradient(120deg, #ff6b35, #f26419);
  color: #ffffff;
  font-weight: 700;
  padding: 0.68rem 1rem;
  box-shadow: 0 10px 20px rgba(242, 100, 25, 0.25);
`;

const ButtonGhost = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  text-decoration: none;
  border: 1px solid #cbd5e1;
  color: #1e293b;
  background: rgba(255, 255, 255, 0.82);
  font-weight: 600;
  padding: 0.68rem 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  color: #172033;
  font-size: clamp(1.18rem, 2.4vw, 1.5rem);
`;

const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.75rem;
`;

const CategoryCard = styled.article`
  border-radius: 12px;
  border: 1px solid #d4e3f7;
  background: #f8fbff;
  padding: 0.85rem;
  display: grid;
  gap: 0.3rem;

  h3 {
    margin: 0;
    color: #1e293b;
    font-size: 0.97rem;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 0.84rem;
  }
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
`;

const CourseCard = styled.article`
  width: 100%;
  border-radius: 12px;
  border: 1px solid #d8e6fa;
  background: #ffffff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  display: grid;
`;

const CourseMedia = styled.img`
  height: 132px;
  width: 100%;
  object-fit: cover;
  border-bottom: 1px solid #d8e6fa;
`;

const CourseBody = styled.div`
  padding: 0.8rem;
  display: grid;
  gap: 0.35rem;

  h3 {
    margin: 0;
    color: #172033;
    font-size: 0.95rem;
    line-height: 1.35;
  }

  p {
    margin: 0;
    color: #556274;
    font-size: 0.84rem;
  }
`;

const CourseMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;

  span {
    color: #f26419;
    font-size: 0.8rem;
    font-weight: 600;
  }

  a {
    color: #1d4ed8;
    font-size: 0.84rem;
    font-weight: 600;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

const CourseStats = styled.div`
  display: grid;
  gap: 0.22rem;
  margin-top: 0.12rem;

  small {
    color: #64748b;
    font-size: 0.8rem;
  }
`;

const RatingPill = styled.span`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 0.14rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 700;
`;

const WhySectionTitle = styled.h2`
  margin: 0 0 1rem;
  color: #212529;
  text-align: center;
  font-size: clamp(1.3rem, 2.8vw, 1.9rem);
`;

const WhyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;

  @media (max-width: 1050px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const WhyCard = styled.article`
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 1.15rem;
  display: grid;
  gap: 0.5rem;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);

  h3 {
    margin: 0;
    color: #212529;
    font-size: 1.05rem;
  }

  p {
    margin: 0;
    color: #495057;
    opacity: 0.94;
    font-size: 0.96rem;
    line-height: 1.55;
  }
`;

const WhyCtaWrap = styled.div`
  margin-top: 1.5rem;
  display: grid;
  justify-items: center;
  gap: 0.65rem;
`;

const WhyCtaButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.35rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(120deg, #ff6b35, #f26419);
  box-shadow: 0 12px 22px rgba(242, 100, 25, 0.34);
`;

const WhyCtaSubtext = styled.p`
  margin: 0;
  color: #475569;
  text-align: center;
  font-size: 0.95rem;
`;

const StorySection = styled(Section)`
  display: grid;
  gap: 1rem;
`;

const StoryTitle = styled.h2`
  margin: 0;
  color: #1f2937;
  text-align: center;
  font-size: clamp(1.2rem, 2.4vw, 1.7rem);
`;

const StoryLead = styled.p`
  margin: 0;
  color: #546173;
  text-align: center;
  font-size: 0.98rem;
  line-height: 1.65;
  max-width: 80ch;
  justify-self: center;
`;

const StoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
`;

const StoryCard = styled.article`
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.07);
  display: grid;
  gap: 0.5rem;

  h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: #475569;
    font-size: 0.95rem;
    line-height: 1.55;
  }
`;

const StoryText = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.98rem;
  line-height: 1.7;
`;

export default function Home() {
  const [dbCategories, setDbCategories] = useState<CategoryOption[]>([]);
  const [carouselCourses, setCarouselCourses] = useState<CarouselCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadCategories = async () => {
      const data = await fetchCategories();
      if (!isActive) {
        return;
      }

      setDbCategories(data);
    };

    void loadCategories();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadCourses = async () => {
      setCoursesLoading(true);

      const [coursesResult, reviewsResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, level, price')
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('course_reviews')
          .select('course_id, rating, comment'),
      ]);

      if (!isActive) {
        return;
      }

      if (coursesResult.error || !coursesResult.data) {
        console.error('Error fetching homepage courses:', coursesResult.error);
        setCarouselCourses([]);
        setCoursesLoading(false);
        return;
      }

      const rows = coursesResult.data as SupabaseCourseRow[];
      const reviewRows = reviewsResult.error || !reviewsResult.data
        ? []
        : (reviewsResult.data as SupabaseReviewRow[]);

      const reviewStatsByCourse = new Map<number, { totalRating: number; reviews: number; comments: number }>();
      reviewRows.forEach((row) => {
        const courseId = Number(row.course_id);
        if (!Number.isFinite(courseId)) {
          return;
        }

        const rating = Number(row.rating ?? 0);
        const comment = typeof row.comment === 'string' ? row.comment.trim() : '';
        const current = reviewStatsByCourse.get(courseId) ?? { totalRating: 0, reviews: 0, comments: 0 };
        current.totalRating += Number.isFinite(rating) ? rating : 0;
        current.reviews += 1;
        current.comments += comment.length > 0 ? 1 : 0;
        reviewStatsByCourse.set(courseId, current);
      });

      const mappedCourses = rows
        .map((row, index) => {
          const rawId = Number(row.id ?? index + 1);
          const courseId = Number.isFinite(rawId) ? rawId : index + 1;
          const title = typeof row.title === 'string' && row.title.trim() !== ''
            ? row.title
            : 'Kurs bez tytułu';
          const level = typeof row.level === 'string' && row.level.trim() !== ''
            ? row.level
            : 'Poziom nieokreślony';

          const numericPrice = typeof row.price === 'number' ? row.price : Number(row.price);
          const priceLabel = Number.isFinite(numericPrice)
            ? `${numericPrice} PLN`
            : 'Cena wkrótce';

          const stats = reviewStatsByCourse.get(courseId);
          const averageRating = stats && stats.reviews > 0
            ? Math.round((stats.totalRating / stats.reviews) * 10) / 10
            : null;

          return {
            id: courseId,
            title,
            level,
            priceLabel,
            imageUrl: defaultCourseImage,
            averageRating,
            reviewsCount: stats?.reviews ?? 0,
            commentsCount: stats?.comments ?? 0,
          };
        })
        .slice(0, 12);

      setCarouselCourses(mappedCourses);
      setCoursesLoading(false);
    };

    void loadCourses();

    return () => {
      isActive = false;
    };
  }, []);

  const renderedCategories = useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories;
    }

    return fallbackCategories;
  }, [dbCategories]);

  return (
    <Page>
      <Hero>
        <HeroContent>
          <HeroTitle>Ucz się praktycznie i buduj kompetencje, które realnie zwiększają Twoją wartość na rynku.</HeroTitle>
          <HeroText>
            Marketplace Kursów Online łączy wysokiej jakości kursy, jasne ścieżki rozwoju i przejrzyste narzędzia
            nauki. Bez chaosu, bez rozpraszaczy, z naciskiem na rezultat.
          </HeroText>
          <HeroActions>
            <ButtonPrimary href="/courses">Przeglądaj kursy</ButtonPrimary>
            <ButtonGhost href="/player">Odtwarzacz kursu</ButtonGhost>
          </HeroActions>
        </HeroContent>
      </Hero>

      <Section>
        <SectionHeader>
          <Title>Kategorie</Title>
        </SectionHeader>
        <CategoriesGrid>
          {renderedCategories.map((category) => (
            <CategoryCard key={category.id}>
              <h3>{category.title}</h3>
            </CategoryCard>
          ))}
        </CategoriesGrid>
      </Section>

      <Section>
        <SectionHeader>
          <Title>Wybrane kursy</Title>
        </SectionHeader>
        {coursesLoading ? (
          <p>Ładowanie kursów...</p>
        ) : carouselCourses.length === 0 ? (
          <p>Brak kursów do wyświetlenia.</p>
        ) : (
          <CoursesGrid>
            {carouselCourses.map((course) => (
              <CourseCard key={course.id}>
                <CourseMedia src={course.imageUrl} alt={`Miniatura kursu ${course.title}`} />
                <CourseBody>
                  <h3>{course.title}</h3>
                  <p>Poziom: {course.level}</p>
                  <CourseStats>
                    <RatingPill>
                      {course.averageRating === null ? 'Brak ocen' : `Ocena: ${course.averageRating}/5`}
                    </RatingPill>
                    <small>{course.reviewsCount} opinii • {course.commentsCount} komentarzy</small>
                  </CourseStats>
                  <CourseMeta>
                    <span>{course.priceLabel}</span>
                    <Link href={`/courses/${course.id}`}>Szczegóły</Link>
                  </CourseMeta>
                </CourseBody>
              </CourseCard>
            ))}
          </CoursesGrid>
        )}
      </Section>

      <StorySection>
        <StoryTitle>Dlaczego warto uczyć się właśnie z nami?</StoryTitle>
        <StoryLead>
          Tworzymy platformę, która łączy merytoryczne kursy z wygodnym doświadczeniem nauki. Zamiast przypadkowych
          lekcji i chaotycznych materiałów dostajesz spójny proces: od podstaw, przez praktyczne ćwiczenia, aż po
          efekty, które możesz pokazać w CV i portfolio.
        </StoryLead>
        <StoryGrid>
          <StoryCard>
            <h3>Nauka z myślą o praktyce</h3>
            <p>
              Nie uczysz się dla samej teorii. Każdy moduł prowadzi do konkretnego efektu, który możesz wykorzystać
              zawodowo.
            </p>
          </StoryCard>
          <StoryCard>
            <h3>Jasna struktura i mniej chaosu</h3>
            <p>
              Materiały są uporządkowane krok po kroku, dzięki czemu łatwiej utrzymać tempo i regularność nauki.
            </p>
          </StoryCard>
          <StoryCard>
            <h3>Postęp widoczny na każdym etapie</h3>
            <p>
              Widzisz, ile już osiągnąłeś i co jest kolejnym krokiem. To pomaga utrzymać motywację do końca kursu.
            </p>
          </StoryCard>
        </StoryGrid>
        <StoryText>
          W praktyce oznacza to szybsze wejście na wyższy poziom kompetencji i większą pewność podczas rekrutacji,
          rozmów technicznych oraz codziennej pracy projektowej.
        </StoryText>
      </StorySection>

      <Section>
        <WhySectionTitle>Dlaczego platforma działa?</WhySectionTitle>
        <WhyGrid>
          <WhyCard>
            <h3>Przejrzyste ścieżki kariery</h3>
            <p>Każdy kurs jest osadzony w konkretnym celu zawodowym i poziomie zaawansowania. Od zera do specjalisty.</p>
          </WhyCard>
          <WhyCard>
            <h3>Wysoka jakość materiałów</h3>
            <p>Spójna struktura lekcji ułatwia naukę i pozwala szybciej osiągnąć efekty bez chaosu informacyjnego.</p>
          </WhyCard>
          <WhyCard>
            <h3>Skupienie na praktyce</h3>
            <p>Każdy moduł prowadzi do mierzalnego rezultatu zawodowego - budujesz portfolio już podczas nauki.</p>
          </WhyCard>
        </WhyGrid>
        <WhyCtaWrap>
          <WhyCtaButton href="/courses">Wejdź do katalogu kursów online</WhyCtaButton>
          <WhyCtaSubtext>Rozpocznij naukę od kursu, który pasuje do Twojej ścieżki zawodowej.</WhyCtaSubtext>
        </WhyCtaWrap>
      </Section>
    </Page>
  );
}
