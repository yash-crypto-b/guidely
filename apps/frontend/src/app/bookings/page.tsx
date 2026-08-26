'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  creator: { id: string; name: string; photoUrl: string; displayName: string };
  student: { id: string; name: string; photoUrl: string };
  sessionType: { title: string; duration: number; price: number };
  startTime: string;
  endTime: string;
  status: string;
  meetingLink: string | null;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    async function load() {
      try {
        const res = await api.get<{ data: { bookings: Booking[] } }>(`/bookings?role=${user.role === 'CREATOR' ? 'creator' : 'student'}`);
        setBookings(res.data.bookings);
      } catch { toast.error('Failed to load bookings'); }
      finally { setLoading(false); }
    }
    load();
  }, [user, router]);

  async function cancelBooking(id: string) {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'CANCELLED' });
      toast.success('Booking cancelled');
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    } catch (err: any) { toast.error(err.message); }
  }

  const upcoming = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');
  const past = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'NO_SHOW');

  if (loading) return <><Navbar /><div className="text-center py-20">Loading...</div></>;

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab('upcoming')} className={`px-4 py-2 rounded-lg ${tab === 'upcoming' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>Upcoming ({upcoming.length})</button>
          <button onClick={() => setTab('past')} className={`px-4 py-2 rounded-lg ${tab === 'past' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>Past ({past.length})</button>
        </div>

        <div className="space-y-4">
          {(tab === 'upcoming' ? upcoming : past).map((booking) => (
            <div key={booking.id} className="bg-white border rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{booking.sessionType.title}</h3>
                  <p className="text-sm text-gray-600">
                    with {user?.role === 'CREATOR' ? booking.student.name : booking.creator.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(booking.startTime).toLocaleDateString()} at{' '}
                    {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {booking.sessionType.duration}min
                  </p>
                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{booking.status}</span>
                </div>
                <div className="text-right">
                  {booking.meetingLink && booking.status === 'CONFIRMED' && (
                    <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">Join Meeting</a>
                  )}
                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <button onClick={() => cancelBooking(booking.id)} className="block mt-2 text-sm text-red-600 hover:underline">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
