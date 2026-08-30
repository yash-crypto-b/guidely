'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import toast from 'react-hot-toast';
import {
  Calendar, Bookmark, Star, Clock, Users, ExternalLink, ChevronRight,
  Video, FileText, MessageCircle, Briefcase, X
} from 'lucide-react';

interface MenteeBooking {
  id: string;
  creator: { id: string; name: string; photoUrl: string | null; displayName: string; headline: string | null };
  sessionType: { title: string; duration: number; deliveryType: string };
  startTime: string;
  endTime: string;
  status: string;
  meetingLink: string | null;
  review: any;
}

interface SavedMentor {
  id: string;
  name: string;
  displayName: string;
  photoUrl: string | null;
  headline: string | null;
  expertiseTags: string[];
  startingPrice: number | null;
  rating: number | null;
  reviewCount: number;
  savedAt: string;
}

interface RecommendedMentor {
  id: string;
  name: string;
  displayName: string;
  photoUrl: string | null;
  headline: string | null;
  company: string | null;
  expertiseTags: string[];
  startingPrice: number | null;
  rating: number | null;
  reviewCount: number;
  completedSessions: number;
}

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  VIDEO_CALL: '1:1 Video Call',
  RESUME_REVIEW: 'Resume Review',
  MOCK_INTERVIEW: 'Mock Interview',
  CAREER_GUIDANCE: 'Career Guidance',
  ASYNC_MESSAGE: 'Async Message',
  PORTFOLIO_REVIEW: 'Portfolio Review',
};

function formatPrice(price: number | null) {
  if (price === null || price === undefined || price === 0) return 'Free';
  return `₹${price}`;
}

export default function MenteeDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [upcomingBookings, setUpcomingBookings] = useState<MenteeBooking[]>([]);
  const [pastBookings, setPastBookings] = useState<MenteeBooking[]>([]);
  const [savedMentors, setSavedMentors] = useState<SavedMentor[]>([]);
  const [recommended, setRecommended] = useState<RecommendedMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'saved'>('upcoming');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadAll();
  }, [user, router]);

  async function loadAll() {
    try {
      const [bookingsRes, savedRes, recRes] = await Promise.all([
        api.get<{ data: { bookings: MenteeBooking[] } }>('/connections/my-bookings'),
        api.get<{ data: SavedMentor[] }>('/connections/saved'),
        api.get<{ data: RecommendedMentor[] }>('/connections/recommended'),
      ]);

      const allBookings = bookingsRes.data.bookings;
      setUpcomingBookings(allBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING'));
      setPastBookings(allBookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'NO_SHOW'));
      setSavedMentors(savedRes.data);
      setRecommended(recRes.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Connections</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your sessions and saved mentors</p>
          </div>
          <Link
            href="/connections"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 font-medium"
          >
            Find Mentors
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'upcoming' as const, label: 'Upcoming Sessions', count: upcomingBookings.length },
            { id: 'past' as const, label: 'Past Sessions', count: pastBookings.length },
            { id: 'saved' as const, label: 'Saved Mentors', count: savedMentors.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Upcoming Sessions */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">No upcoming sessions</h3>
                <p className="text-sm text-gray-500 mb-4">Book a session with a mentor to get started</p>
                <Link href="/connections" className="text-primary-600 hover:text-primary-800 font-medium text-sm">
                  Browse mentors →
                </Link>
              </div>
            ) : (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {booking.creator.photoUrl ? (
                        <img src={booking.creator.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                          {booking.creator.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{booking.sessionType.title}</h3>
                        <p className="text-sm text-gray-500">with {booking.creator.name}</p>
                        {booking.creator.headline && (
                          <p className="text-xs text-gray-400">{booking.creator.headline}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.startTime).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>{booking.sessionType.duration} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.meetingLink && booking.status === 'CONFIRMED' && (
                        <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                          <Video className="w-4 h-4" />
                          Join
                        </a>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Past Sessions */}
        {activeTab === 'past' && (
          <div className="space-y-4">
            {pastBookings.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">No past sessions</h3>
                <p className="text-sm text-gray-500">Your completed sessions will appear here</p>
              </div>
            ) : (
              pastBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {booking.creator.photoUrl ? (
                        <img src={booking.creator.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                          {booking.creator.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{booking.sessionType.title}</h3>
                        <p className="text-sm text-gray-500">with {booking.creator.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(booking.startTime).toLocaleDateString()} · {booking.sessionType.duration} min
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                      {booking.status === 'COMPLETED' && !booking.review && (
                        <Link href={`/bookings`} className="block text-xs text-primary-600 hover:text-primary-800 mt-2">
                          Leave a review
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Saved Mentors */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {savedMentors.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">No saved mentors</h3>
                <p className="text-sm text-gray-500 mb-4">Save mentors you&apos;re interested in to easily find them later</p>
                <Link href="/connections" className="text-primary-600 hover:text-primary-800 font-medium text-sm">
                  Browse mentors →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedMentors.map((mentor) => (
                  <Link
                    key={mentor.id}
                    href={`/connections/${mentor.displayName || mentor.id}`}
                    className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start gap-3">
                      {mentor.photoUrl ? (
                        <img src={mentor.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                          {mentor.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold group-hover:text-primary-600 transition-colors">{mentor.name}</h3>
                        {mentor.headline && <p className="text-sm text-gray-500 truncate">{mentor.headline}</p>}
                        {mentor.expertiseTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mentor.expertiseTags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          {mentor.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              {mentor.rating} ({mentor.reviewCount})
                            </span>
                          )}
                          <span className="text-gray-500">{formatPrice(mentor.startingPrice)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommended Mentors */}
        {recommended.length > 0 && activeTab !== 'saved' && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-4">Recommended for you</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.slice(0, 3).map((mentor) => (
                <Link
                  key={mentor.id}
                  href={`/connections/${mentor.displayName || mentor.id}`}
                  className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {mentor.photoUrl ? (
                      <img src={mentor.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                        {mentor.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm group-hover:text-primary-600 transition-colors truncate">{mentor.name}</h3>
                      {mentor.headline && <p className="text-xs text-gray-500 truncate">{mentor.headline}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {mentor.expertiseTags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      {mentor.rating && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                      <span className="text-gray-600">{mentor.rating || 'New'}</span>
                    </span>
                    <span className="text-primary-600 font-medium text-xs">{formatPrice(mentor.startingPrice)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
