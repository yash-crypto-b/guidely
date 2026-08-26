'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, isAuthenticated } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  name: string;
  displayName: string;
  photoUrl: string | null;
  headline: string;
  bio: string;
  expertiseTags: { tag: { name: string } }[];
  socialLinks: { platform: string; url: string }[];
  sessionTypes: { id: string; title: string; description: string; duration: number; price: number; isFree: boolean; type: string }[];
  reviewsReceived: { id: string; rating: number; comment: string; reviewer: { name: string; photoUrl: string } }[];
}

export default function CreatorProfilePage() {
  const { handle } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: Profile }>(`/profile/${handle}`);
        setProfile(res.data);
      } catch {
        toast.error('Creator not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [handle]);

  useEffect(() => {
    if (!selectedSession || !profile) return;
    setSelectedSlot(null);
    setSlotsLoading(true);
    const date = new Date().toISOString().split('T')[0];
    api.get<{ data: { start: string; end: string }[] }>(`/bookings/slots/${profile.id}/${selectedSession}?date=${date}`)
      .then((res) => setSlots(res.data))
      .catch(() => toast.error('Failed to load slots'))
      .finally(() => setSlotsLoading(false));
  }, [selectedSession, profile]);

  async function handleBook() {
    if (!selectedSession || !selectedSlot) return;
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setBookingLoading(true);
    try {
      await api.post('/bookings', {
        creatorId: profile!.id,
        sessionTypeId: selectedSession,
        startTime: selectedSlot,
      });
      toast.success('Booking created!');
      router.push('/bookings');
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) return <><Navbar /><div className="text-center py-20">Loading...</div></>;
  if (!profile) return <><Navbar /><div className="text-center py-20">Creator not found</div></>;

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              {profile.headline && <p className="text-gray-600 mt-1">{profile.headline}</p>}
              {profile.bio && <p className="text-gray-600 mt-3">{profile.bio}</p>}
              {profile.expertiseTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.expertiseTags.map((t) => (
                    <span key={t.tag.name} className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">{t.tag.name}</span>
                  ))}
                </div>
              )}
              {profile.socialLinks.length > 0 && (
                <div className="flex gap-4 mt-4">
                  {profile.socialLinks.map((link) => (
                    <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">{link.platform}</a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-4">Available Sessions</h2>
            <div className="space-y-4">
              {profile.sessionTypes.map((session) => (
                <div
                  key={session.id}
                  className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${selectedSession === session.id ? 'border-primary-500 ring-2 ring-primary-100' : 'hover:border-gray-300'}`}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{session.title}</h3>
                      <p className="text-sm text-gray-500">{session.description}</p>
                      <p className="text-sm text-gray-400 mt-1">{session.duration} min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">
                        {session.isFree ? 'Free' : `$${((session.price || 0) / 100).toFixed(0)}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {profile.reviewsReceived.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Reviews</h2>
                <div className="space-y-4">
                  {profile.reviewsReceived.map((review) => (
                    <div key={review.id} className="bg-white border rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <span className="font-medium">{review.reviewer.name}</span>
                        <span className="ml-2 text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      </div>
                      {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            {selectedSession && (
              <div className="bg-white border rounded-xl p-6 sticky top-24">
                <h3 className="font-semibold mb-4">Select a Time Slot</h3>
                {slotsLoading ? (
                  <p className="text-sm text-gray-500">Loading available slots...</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-500">No available slots for today. Try a different day.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {slots.map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot.start)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${selectedSlot === slot.start ? 'border-primary-500 bg-primary-50 text-primary-700' : 'hover:border-gray-300'}`}
                      >
                        {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                )}

                {selectedSlot && (
                  <button
                    onClick={handleBook}
                    disabled={bookingLoading}
                    className="w-full mt-4 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {bookingLoading ? 'Booking...' : user ? 'Confirm Booking' : 'Login to Book'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
