'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import toast from 'react-hot-toast';

interface CreatorProfile {
  sessionTypes: { id: string; title: string; duration: number; price: number; isFree: boolean; isActive: boolean }[];
  availability: { id: string; dayOfWeek: number; startTime: string; endTime: string }[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreatorForm, setShowCreatorForm] = useState(false);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role === 'CREATOR') loadProfile();
    else setLoading(false);
  }, [user, router]);

  async function loadProfile() {
    try {
      const res = await api.get<{ data: CreatorProfile }>('/auth/me');
      setProfile(res.data);
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  }

  async function becomeCreator() {
    try {
      const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.post('/become-creator', { headline, bio, expertiseTags: tagArray });
      toast.success('You are now a creator!');
      await refreshUser();
      setShowCreatorForm(false);
      loadProfile();
    } catch (err: any) { toast.error(err.message); }
  }

  if (loading) return <><Navbar /><div className="text-center py-20">Loading...</div></>;

  if (user?.role !== 'CREATOR') {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          {!showCreatorForm ? (
            <div className="bg-white border rounded-xl p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Become a Creator</h2>
              <p className="text-gray-600 mb-6">Set up your creator profile to start offering mentorship sessions.</p>
              <button onClick={() => setShowCreatorForm(true)} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">Get Started</button>
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-8">
              <h2 className="text-xl font-semibold mb-6">Creator Profile Setup</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Headline</label>
                  <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g., Senior Software Engineer & Career Coach" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expertise Tags (comma-separated)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., React, System Design, Career Coaching" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <button onClick={becomeCreator} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700">Save & Become Creator</button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Creator Dashboard</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Session Types</h2>
            {profile?.sessionTypes.length === 0 ? (
              <p className="text-gray-500 text-sm">No session types yet</p>
            ) : (
              <div className="space-y-2">
                {profile?.sessionTypes.map((s) => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-sm text-gray-500">{s.duration}min</p>
                    </div>
                    <span className="font-semibold">{s.isFree ? 'Free' : `$${((s.price || 0) / 100).toFixed(0)}`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Availability</h2>
            {profile?.availability.length === 0 ? (
              <p className="text-gray-500 text-sm">No availability set</p>
            ) : (
              <div className="space-y-2">
                {profile?.availability.map((a) => (
                  <div key={a.id} className="flex justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{DAYS[a.dayOfWeek]}</span>
                    <span className="text-gray-600">{a.startTime} - {a.endTime}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
