import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getPublicDoctorsListing,
  type PublicDoctorCard,
  type PublicDoctorListingQuery
} from '../../services/publicContentService';
import { ROUTE_PATHS } from '../../routes/routePaths';

const DEFAULT_SPECIALIZATIONS = [
  'Cardiologist',
  'Neurologist',
  'Diabetologist',
  'Orthopedic',
  'Eye Specialist',
  'General Physician'
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type ListingState = {
  doctors: PublicDoctorCard[];
  total: number;
  totalPages: number;
  availableSpecializations: string[];
};

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, index) => {
    const isFilled = index < Math.round(rating);
    return (
      <svg key={`${rating}-${index}`} viewBox="0 0 24 24" className={`hm-star ${isFilled ? 'filled' : ''}`}>
        <path d="M12 2.4l2.95 5.98 6.6.96-4.77 4.65 1.13 6.56L12 17.45l-5.91 3.1 1.13-6.56-4.77-4.65 6.6-.96L12 2.4z" />
      </svg>
    );
  });
}

function buildPagination(currentPage: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }).map((_, i) => i + 1);
  }

  const pages: Array<number | '...'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('...');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('...');

  pages.push(totalPages);
  return pages;
}

export default function DoctorsPage() {
  const navigate = useNavigate();
  const [searchDraft, setSearchDraft] = useState('');
  const [selectedSpecializationsDraft, setSelectedSpecializationsDraft] = useState<string[]>([]);
  const [selectedDayDraft, setSelectedDayDraft] = useState<string>('');
  const [minRatingDraft, setMinRatingDraft] = useState<number>(0);
  const [maxFeeDraft, setMaxFeeDraft] = useState<number>(5000);
  const [sort, setSort] = useState<PublicDoctorListingQuery['sort']>('rating');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    selectedSpecializations: [] as string[],
    selectedDay: '',
    minRating: 0,
    maxFee: 5000
  });

  const [listing, setListing] = useState<ListingState>({
    doctors: [],
    total: 0,
    totalPages: 1,
    availableSpecializations: DEFAULT_SPECIALIZATIONS
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      setLoading(true);

      try {
        const response = await getPublicDoctorsListing({
          search: appliedFilters.search || undefined,
          specializations:
            appliedFilters.selectedSpecializations.length > 0
              ? appliedFilters.selectedSpecializations
              : undefined,
          minRating: appliedFilters.minRating > 0 ? appliedFilters.minRating : undefined,
          minFee: 500,
          maxFee: appliedFilters.maxFee,
          availabilityDay: appliedFilters.selectedDay || undefined,
          sort,
          page,
          limit: 8
        });

        if (!cancelled) {
          setListing({
            doctors: response.doctors,
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
            availableSpecializations:
              response.filters.specializations.length > 0
                ? response.filters.specializations
                : DEFAULT_SPECIALIZATIONS
          });
        }
      } catch {
        if (!cancelled) {
          setListing((previous) => ({ ...previous, doctors: [], total: 0, totalPages: 1 }));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDoctors();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters, sort, page]);

  const paginationItems = useMemo(() => buildPagination(page, listing.totalPages), [page, listing.totalPages]);

  const toggleSpecialization = (value: string) => {
    setSelectedSpecializationsDraft((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({
      search: searchDraft.trim(),
      selectedSpecializations: selectedSpecializationsDraft,
      selectedDay: selectedDayDraft,
      minRating: minRatingDraft,
      maxFee: maxFeeDraft
    });
  };

  const clearAllFilters = () => {
    setSearchDraft('');
    setSelectedSpecializationsDraft([]);
    setSelectedDayDraft('');
    setMinRatingDraft(0);
    setMaxFeeDraft(5000);
    setPage(1);
    setAppliedFilters({
      search: '',
      selectedSpecializations: [],
      selectedDay: '',
      minRating: 0,
      maxFee: 5000
    });
  };

  const doctorDetailPath = (id: string) => ROUTE_PATHS.public.doctorDetail.replace(':id', id);

  return (
    <main className="hm-page hm-doctors-page">
      <header className="hm-header hm-header-scrolled" role="banner">
        <div className="hm-header-inner">
          <Link to={ROUTE_PATHS.public.home} className="hm-brand" aria-label="HealthMonitor Pro home">
            <span className="hm-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 12h3.4l2-3.8 3.2 7.3 2.4-4.5H21" />
                <path d="M12 21a8.7 8.7 0 0 1-6.2-2.6A8.6 8.6 0 0 1 3.2 12 8.8 8.8 0 0 1 12 3.2 8.8 8.8 0 0 1 20.8 12" />
              </svg>
            </span>
            <span className="hm-brand-text">HealthMonitor Pro</span>
          </Link>

          <nav className="hm-nav" aria-label="Primary navigation">
            <Link to={ROUTE_PATHS.public.home}>Home</Link>
            <Link to={ROUTE_PATHS.public.doctors}>Doctors</Link>
            <Link to={ROUTE_PATHS.public.blogs}>Blogs</Link>
            <a href="#">About</a>
            <a href="#">Contact</a>
          </nav>

          <div className="hm-auth-actions">
            <Link to={ROUTE_PATHS.auth.login} className="hm-btn hm-btn-outline">
              Login
            </Link>
            <Link to={ROUTE_PATHS.auth.register} className="hm-btn hm-btn-solid">
              Register
            </Link>
          </div>
        </div>
      </header>

      <section className="section-shell hm-doctors-title-area">
        <p className="hm-breadcrumb">
          <Link to={ROUTE_PATHS.public.home}>Home</Link> <span>&gt;</span> <span>Doctors</span>
        </p>
        <h1>Find Your Doctor</h1>
        <p className="hm-subtext">Search from 500+ verified specialists across all fields</p>
        <div className="hm-doctors-searchbar">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm9.2 15.9-3.4-3.4" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or specialization..."
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyFilters();
              }
            }}
          />
        </div>
      </section>

      <section className="section-shell hm-doctors-layout">
        <aside className="hm-filter-sidebar" aria-label="Doctor filters">
          <div className="hm-filter-head">
            <h2>Filters</h2>
            <button type="button" onClick={clearAllFilters} className="hm-clear-link">
              Clear All
            </button>
          </div>

          <div className="hm-filter-group">
            <h3>Specialization</h3>
            <div className="hm-filter-list">
              {listing.availableSpecializations.map((specialization) => {
                const checked = selectedSpecializationsDraft.includes(specialization);
                return (
                  <label key={specialization} className="hm-checkbox-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSpecialization(specialization)}
                    />
                    <span>{specialization}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="hm-filter-group">
            <h3>Minimum Rating</h3>
            <div className="hm-rating-picker">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= minRatingDraft ? 'active' : ''}
                  onClick={() => setMinRatingDraft((current) => (current === value ? 0 : value))}
                >
                  {value}★
                </button>
              ))}
            </div>
          </div>

          <div className="hm-filter-group">
            <h3>Consultation Fee</h3>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={maxFeeDraft}
              onChange={(event) => setMaxFeeDraft(Number(event.target.value))}
            />
            <p className="hm-range-caption">PKR 500 - PKR {maxFeeDraft.toLocaleString()}</p>
          </div>

          <div className="hm-filter-group">
            <h3>Availability Day</h3>
            <div className="hm-day-pills">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={selectedDayDraft === day ? 'active' : ''}
                  onClick={() => setSelectedDayDraft((current) => (current === day ? '' : day))}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="hm-btn hm-btn-solid hm-apply-btn" onClick={applyFilters}>
            Apply Filters
          </button>
        </aside>

        <div className="hm-results-area">
          <div className="hm-results-topbar">
            <p>Showing {listing.total} doctors</p>
            <label htmlFor="hm-sort">
              Sort by
              <select
                id="hm-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as PublicDoctorListingQuery['sort']);
                  setPage(1);
                }}
              >
                <option value="rating">Rating</option>
                <option value="experience">Experience</option>
                <option value="fee_asc">Fee: Low to High</option>
                <option value="fee_desc">Fee: High to Low</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="hm-empty-state">
              <h3>Loading doctors...</h3>
              <p>Fetching live doctor data from backend.</p>
            </div>
          ) : listing.doctors.length === 0 ? (
            <div className="hm-empty-state">
              <div className="hm-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64">
                  <path d="M28 8h8v12h12v8H36v28h-8V28H16v-8h12z" />
                  <path d="M49 49 60 60" />
                  <circle cx="44" cy="44" r="10" />
                </svg>
              </div>
              <h3>No doctors found</h3>
              <p>Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="hm-doctor-results-grid">
                {listing.doctors.map((doctor) => (
                  <article key={doctor.id} className="hm-doctor-result-card">
                    <div className="hm-result-avatar-wrap">
                      <div className="hm-result-avatar" aria-hidden="true" />
                      <span className="hm-online-dot" />
                    </div>

                    <div className="hm-result-content">
                      <div className="hm-result-top">
                        <h3>{doctor.name}</h3>
                        <span className="hm-pill">{doctor.specialization}</span>
                      </div>

                      <p className="hm-result-hospital">{doctor.hospital}</p>
                      <p className="hm-result-exp">{doctor.experience}</p>

                      <div className="hm-result-rating">
                        <div className="hm-star-row" aria-label={`${doctor.rating} star rating`}>
                          {renderStars(doctor.rating)}
                        </div>
                        <span>({doctor.reviewsCount} reviews)</span>
                      </div>

                      <p className="hm-result-fee">{doctor.fee}</p>

                      <div className="hm-result-actions">
                        <Link to={doctorDetailPath(doctor.id)} className="hm-btn hm-btn-outline hm-card-btn">
                          View Profile
                        </Link>
                        <button
                          type="button"
                          className="hm-btn hm-btn-solid hm-card-btn"
                          onClick={() => navigate(ROUTE_PATHS.auth.login)}
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <nav className="hm-pagination" aria-label="Doctors pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>

                {paginationItems.map((item, index) =>
                  item === '...' ? (
                    <span key={`ellipsis-${index}`} className="ellipsis">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={item === page ? 'active' : ''}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={page >= listing.totalPages}
                  onClick={() => setPage((current) => Math.min(listing.totalPages, current + 1))}
                >
                  Next
                </button>
              </nav>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
