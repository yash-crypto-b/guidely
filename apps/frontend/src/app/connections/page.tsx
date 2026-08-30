'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Search, MapPin, Star, Clock, Briefcase, ChevronDown, X, Users, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

interface Mentor {
  id: string;
  name: string;
  displayName: string;
  photoUrl: string | null;
  headline: string | null;
  bio: string | null;
  company: string | null;
  industry: string | null;
  location: string | null;
  yearsExperience: number | null;
  languages: string[];
  expertiseTags: string[];
  services: { id: string; title: string; price: number | null; isFree: boolean; duration: number; deliveryType: string }[];
  rating: number | null;
  reviewCount: number;
  completedSessions: number;
  startingPrice: number | null;
}

interface SearchFilters {
  search: string;
  industry: string;
  experienceLevel: string;
  minPrice: string;
  maxPrice: string;
  deliveryType: string;
  skills: string[];
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
  'Design', 'Product', 'Data Science', 'AI/ML', 'Consulting',
];

const EXPERIENCE_LEVELS = [
  { label: 'Junior (0-3 years)', value: 'junior' },
  { label: 'Mid (3-7 years)', value: 'mid' },
  { label: 'Senior (7-15 years)', value: 'senior' },
  { label: 'Lead (15+ years)', value: 'lead' },
];

const DELIVERY_TYPES = [
  { label: '1:1 Video Call', value: 'VIDEO_CALL' },
  { label: 'Resume Review', value: 'RESUME_REVIEW' },
  { label: 'Mock Interview', value: 'MOCK_INTERVIEW' },
  { label: 'Career Guidance', value: 'CAREER_GUIDANCE' },
  { label: 'Async Message', value: 'ASYNC_MESSAGE' },
  { label: 'Portfolio Review', value: 'PORTFOLIO_REVIEW' },
];

const EXAMPLE_SEARCHES = ['AI Engineer', 'Software Engineer', 'Resume Review', 'Career Switch', 'Product Manager'];

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return 'Free';
  if (price === 0) return 'Free';
  return `₹${price}`;
}

export default function ConnectionsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    industry: '',
    experienceLevel: '',
    minPrice: '',
    maxPrice: '',
    deliveryType: '',
    skills: [],
  });
  const [skillInput, setSkillInput] = useState('');

  const fetchMentors = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.industry) params.set('industry', filters.industry);
      if (filters.experienceLevel) params.set('experienceLevel', filters.experienceLevel);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.deliveryType) params.set('deliveryType', filters.deliveryType);
      if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));
      params.set('page', String(pageNum));
      params.set('limit', '20');

      const res = await api.get<{ data: { mentors: Mentor[]; total: number; page: number; totalPages: number } }>(
        `/connections/search?${params.toString()}`
      );
      setMentors(res.data.mentors);
      setTotal(res.data.total);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchMentors(1); }, [fetchMentors]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchMentors(1);
  }

  function addSkill() {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      setFilters({ ...filters, skills: [...filters.skills, skillInput.trim()] });
      setSkillInput('');
    }
  }

  function removeSkill(skill: string) {
    setFilters({ ...filters, skills: filters.skills.filter(s => s !== skill) });
  }

  function clearFilters() {
    setFilters({ search: '', industry: '', experienceLevel: '', minPrice: '', maxPrice: '', deliveryType: '', skills: [] });
  }

  function applyExampleSearch(term: string) {
    setFilters({ ...filters, search: term });
  }

  const hasActiveFilters = filters.industry || filters.experienceLevel || filters.minPrice || filters.maxPrice || filters.deliveryType || filters.skills.length > 0;

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50 border-b">
          <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
                Find the right person to{' '}
                <span className="text-primary-600">guide your next move</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600">
                Connect with experienced professionals for career guidance, resume reviews,
                mock interviews, technical mentorship, career transitions, and more.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search mentors, skills, roles, or companies"
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white shadow-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 transition-colors font-medium"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Example Searches */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-sm text-gray-500">Popular:</span>
                {EXAMPLE_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => { applyExampleSearch(term); }}
                    className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Filters & Results */}
        <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {[filters.industry, filters.experienceLevel, filters.minPrice, filters.maxPrice, filters.deliveryType, ...filters.skills].filter(Boolean).length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}

            <div className="ml-auto text-sm text-gray-500">
              {total} mentor{total !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={filters.industry}
                    onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">All Industries</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <select
                    value={filters.experienceLevel}
                    onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Any Level</option>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (₹)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="w-1/2 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="w-1/2 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                  <select
                    value={filters.deliveryType}
                    onChange={(e) => setFilters({ ...filters, deliveryType: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">All Types</option>
                    {DELIVERY_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skills */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    placeholder="Add a skill and press Enter"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <button onClick={addSkill} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Add</button>
                </div>
                {filters.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-primary-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mentor Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border rounded-xl p-6 animate-pulse">
                  <div className="flex items-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200" />
                    <div className="ml-3 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-48" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-6 bg-gray-200 rounded-full w-16" />
                    ))}
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : mentors.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="text-primary-600 hover:text-primary-800 font-medium">
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentors.map((mentor) => (
                  <Link
                    key={mentor.id}
                    href={`/connections/${mentor.displayName || mentor.id}`}
                    className="bg-white rounded-xl border p-6 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex items-start mb-4">
                      {mentor.photoUrl ? (
                        <img
                          src={mentor.photoUrl}
                          alt={mentor.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0">
                          {mentor.name.charAt(0)}
                        </div>
                      )}
                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                          {mentor.name}
                        </h3>
                        {mentor.headline && (
                          <p className="text-sm text-gray-500 truncate">{mentor.headline}</p>
                        )}
                        {mentor.company && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3 h-3" />
                            {mentor.company}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {mentor.expertiseTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {mentor.expertiseTags.slice(0, 4).map((tag) => (
                          <span key={tag} className="px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full font-medium">
                            {tag}
                          </span>
                        ))}
                        {mentor.expertiseTags.length > 4 && (
                          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{mentor.expertiseTags.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      {mentor.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium text-gray-900">{mentor.rating}</span>
                          <span>({mentor.reviewCount})</span>
                        </span>
                      )}
                      {mentor.yearsExperience && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {mentor.yearsExperience}yr
                        </span>
                      )}
                      {mentor.completedSessions > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {mentor.completedSessions}
                        </span>
                      )}
                    </div>

                    {/* Bio preview */}
                    {mentor.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{mentor.bio}</p>
                    )}

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        {mentor.startingPrice !== null && mentor.startingPrice > 0 ? (
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(mentor.startingPrice)}
                            <span className="text-sm font-normal text-gray-500"> / session</span>
                          </span>
                        ) : (
                          <span className="text-lg font-bold text-green-600">Free</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700">
                        View Profile →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => fetchMentors(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchMentors(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
