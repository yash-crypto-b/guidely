'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, isAuthenticated } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import toast from 'react-hot-toast';
import {
  MapPin, Star, Clock, Briefcase, ExternalLink, Bookmark, Share2,
  Calendar, Video, FileText, MessageCircle, ChevronRight, X, Check
} from 'lucide-react';
import type { Metadata } from 'next';

interface MentorProfile {
  id: string;
  name: string;
  displayName: string;
  photoUrl: string | null;
  headline: string;
  bio: string;
  company: string | null;
  industry: string | null;
  location: string | null;
  yearsExperience: number | null;
  languages: string[];
  linkedInUrl: string | null;
  portfolioUrl: string | null;
  creatorTags: { tag: { name: string } }[];
  socialLinks: { platform: string; url: string }[];
  sessionTypes: {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    price: number | null;
    isFree: boolean;
    deliveryType: string;
    maxBookingsPerDay: number | null;
    availableDays: number[];
  }[];
  reviewsReceived: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { id: string; name: string; photoUrl: string | null };
  }[];
  rating: number | null;
  reviewCount: number;
  completedSessions: number;
}

interface TimeSlot {
  start: string;
  end: string;
}

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  VIDEO_CALL: '1:1 Video Call',
  RESUME_REVIEW: 'Resume Review',
  MOCK_INTERVIEW: 'Mock Interview',
  CAREER_GUIDANCE: 'Career Guidance',
  ASYNC_MESSAGE: 'Async Message',
  PORTFOLIO_REVIEW: 'Portfolio Review',
};

const DELIVERY_TYPE_ICONS: Record<string, React.ReactNode> = {
  VIDEO_CALL: <Video className="w-4 h-4" />,
  RESUME_REVIEW: <FileText className="w-4 h-4" />,
  MOCK_INTERVIEW: <MessageCircle className="w-4 h-4" />,
  CAREER_GUIDANCE: <Briefcase className="w-4 h-4" />,
  ASYNC_MESSAGE: <MessageCircle className="w-4 h-4" />,
  PORTFOLIO_REVIEW: <FileText className="w-4 h-4" />,
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatPrice(price: number | null) {
  if (price === null || price === undefined || price === 0) return 'Free';
  return `₹${price}`;
}

export default function MentorProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingMetadata, setBookingMetadata] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Determine if this is a direct referral
  const isDirectReferral = searchParams.get('ref') === 'direct' || searchParams.get('source') === 'direct';

  // Fetch mentor profile
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: MentorProfile }>(`/connections/mentor/${handle}`);
        setProfile(res.data);
        // Set today's date as default
        setSelectedDate(new Date().toISOString().split('T')[0]);
      } catch {
        toast.error('Mentor not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [handle]);

  // Fetch available slots when service or date changes
  useEffect(() => {
    if (!selectedService || !selectedDate || !profile) return;
    setSelectedSlot(null);
    setSlotsLoading(true);

    api.get<{ data: TimeSlot[] }>(`/connections/mentor/${handle}/slots/${selectedService}?date=${selectedDate}`)
      .then((res) => setSlots(res.data))
      .catch(() => toast.error('Failed to load available slots'))
      .finally(() => setSlotsLoading(false));
  }, [selectedService, selectedDate, handle, profile]);

  // Handle booking
  const handleBook = useCallback(async () => {
    if (!selectedService || !selectedSlot || !profile) return;
    if (!isAuthenticated()) {
      // Store the referral source before redirecting to login
      if (isDirectReferral) {
        sessionStorage.setItem('referralSource', 'direct');
        sessionStorage.setItem('referralMentor', handle);
      }
      router.push('/login');
      return;
    }

    setBookingLoading(true);
    try {
      await api.post(`/connections/book?mentor=${handle}`, {
        serviceId: selectedService,
        startTime: selectedSlot,
        bookingMetadata: bookingMetadata || undefined,
        referralSource: isDirectReferral ? 'direct' : 'marketplace',
      });
      toast.success('Booking created successfully!');
      setShowBookingModal(false);
      setSelectedService(null);
      setSelectedSlot(null);
      setBookingMetadata('');
      router.push('/connections/my');
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  }, [selectedService, selectedSlot, profile, handle, isDirectReferral, bookingMetadata, router]);

  // Handle save/unsave mentor
  async function toggleSave() {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    try {
      const res = await api.post<{ data: { saved: boolean } }>('/connections/saved', { mentorId: profile!.id });
      setIsSaved(res.data.saved);
      toast.success(res.data.saved ? 'Mentor saved' : 'Mentor removed from saved');
    } catch {
      toast.error('Failed to save mentor');
    }
  }

  // Handle share
  function handleShare() {
    const url = `${window.location.origin}/connections/${handle}?ref=direct`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    toast.success('Profile link copied!');
    setTimeout(() => setShareCopied(false), 2000);
  }

  // SEO metadata
  const seoTitle = profile ? `${profile.name} - ${profile.headline || 'Mentor'} | Guidely` : 'Mentor Profile | Guidely';
  const seoDescription = profile ? `${profile.name} offers ${profile.creatorTags.map(t => t.tag.name).join(', ')} mentorship. ${profile.bio || ''}`.slice(0, 160) : 'View mentor profile on Guidely';
  const seoImage = profile?.photoUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/og-mentor.png`;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl border p-8 mb-8">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-64 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mentor not found</h2>
          <p className="text-gray-500 mb-6">This mentor profile doesn&apos;t exist or has been removed.</p>
          <Link href="/connections" className="text-primary-600 hover:text-primary-800 font-medium">
            Browse mentors →
          </Link>
        </div>
      </>
    );
  }

  const selectedServiceData = profile.sessionTypes.find(s => s.id === selectedService);

  return (
    <>
      <Navbar />
      {/* SEO Meta Tags */}
      <head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={seoImage} />
      </head>
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.name} className="w-24 h-24 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl flex-shrink-0">
                {profile.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  {profile.headline && (
                    <p className="text-gray-600 mt-1">{profile.headline}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                    {profile.company && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {profile.company}
                      </span>
                    )}
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </span>
                    )}
                    {profile.yearsExperience && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {profile.yearsExperience} years
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleSave}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      isSaved ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-primary-500' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
                  >
                    {shareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {shareCopied ? 'Copied' : 'Share'}
                  </button>
                </div>
              </div>

              {/* Rating & Stats */}
              <div className="flex items-center gap-4 mt-4">
                {profile.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{profile.rating}</span>
                    <span className="text-sm text-gray-500">({profile.reviewCount} reviews)</span>
                  </div>
                )}
                {profile.completedSessions > 0 && (
                  <span className="text-sm text-gray-500">
                    {profile.completedSessions} session{profile.completedSessions !== 1 ? 's' : ''} completed
                  </span>
                )}
              </div>

              {/* Tags */}
              {profile.creatorTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.creatorTags.map((t) => (
                    <span key={t.tag.name} className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full font-medium">
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div className="flex gap-3 mt-4">
                {profile.linkedInUrl && (
                  <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800">
                    LinkedIn <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800">
                    Portfolio <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile.socialLinks.map((link) => (
                  <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800">
                    {link.platform} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Expertise */}
            {profile.creatorTags.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-3">Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.creatorTags.map((t) => (
                    <span key={t.tag.name} className="px-4 py-2 bg-gray-50 text-gray-700 text-sm rounded-lg font-medium">
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">
                Reviews {profile.reviewCount > 0 && <span className="text-gray-400 font-normal">({profile.reviewCount})</span>}
              </h2>
              {profile.reviewsReceived.length === 0 ? (
                <p className="text-gray-500 text-sm">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {profile.reviewsReceived.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        {review.reviewer.photoUrl ? (
                          <img src={review.reviewer.photoUrl} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium">
                            {review.reviewer.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-sm">{review.reviewer.name}</span>
                        <div className="flex items-center ml-auto">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Services */}
          <div className="space-y-4 order-first lg:order-last">
            <div className="bg-white rounded-xl border p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold mb-4">Services</h2>
              <div className="space-y-3">
                {profile.sessionTypes.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => { setSelectedService(service.id); setShowBookingModal(true); }}
                    className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedService === service.id ? 'border-primary-500 ring-2 ring-primary-100' : 'hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {DELIVERY_TYPE_ICONS[service.deliveryType]}
                          <h3 className="font-semibold text-sm">{service.title}</h3>
                        </div>
                        {service.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration} min
                          </span>
                          <span>{DELIVERY_TYPE_LABELS[service.deliveryType]}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-bold text-primary-600">
                          {service.isFree ? 'Free' : formatPrice(service.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && selectedServiceData && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowBookingModal(false)} />
              <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{selectedServiceData.title}</h3>
                    <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Attribution indicator */}
                  {isDirectReferral && (
                    <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Booked through mentor&apos;s direct link
                    </div>
                  )}

                  {/* Date Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  {/* Time Slots */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
                    {slotsLoading ? (
                      <div className="text-sm text-gray-500 py-4 text-center">Loading available slots...</div>
                    ) : slots.length === 0 ? (
                      <div className="text-sm text-gray-500 py-4 text-center">
                        No available slots for this date. Try a different day.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {slots.map((slot) => (
                          <button
                            key={slot.start}
                            onClick={() => setSelectedSlot(slot.start)}
                            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                              selectedSlot === slot.start
                                ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                                : 'hover:border-gray-300'
                            }`}
                          >
                            {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Booking Metadata */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What would you like help with?
                    </label>
                    <textarea
                      value={bookingMetadata}
                      onChange={(e) => setBookingMetadata(e.target.value)}
                      placeholder="Describe what you'd like to discuss or get help with..."
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">This will be visible to the mentor before your session.</p>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{selectedServiceData.title}</span>
                      <span className="font-medium">{selectedServiceData.isFree ? 'Free' : formatPrice(selectedServiceData.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{selectedServiceData.duration} min</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBook}
                    disabled={!selectedSlot || bookingLoading}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    {bookingLoading ? 'Booking...' : selectedSlot ? 'Confirm Booking' : 'Select a time slot'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
