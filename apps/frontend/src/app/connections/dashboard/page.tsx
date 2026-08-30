'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, User, Briefcase, Calendar, DollarSign, Star,
  Settings, Plus, Edit2, Trash2, ExternalLink, Copy, ChevronRight,
  TrendingUp, Users, Clock, ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';

type Tab = 'overview' | 'profile' | 'services' | 'bookings' | 'earnings' | 'settings';

interface MentorProfile {
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
  linkedInUrl: string | null;
  portfolioUrl: string | null;
  creatorTags: { tag: { name: string } }[];
  socialLinks: { platform: string; url: string }[];
  sessionTypes: any[];
  availability: any[];
}

interface Service {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  price: number | null;
  isFree: boolean;
  deliveryType: string;
  maxBookingsPerDay: number | null;
  availableDays: number[];
  isActive: boolean;
  createdAt: string;
}

interface Earnings {
  totalEarnings: number;
  totalPlatformFees: number;
  totalRevenue: number;
  totalBookings: number;
  direct: { bookings: number; earnings: number; fees: number; commissionRate: number };
  marketplace: { bookings: number; earnings: number; fees: number; commissionRate: number };
  recentBookings: any[];
}

interface Booking {
  id: string;
  mentee: string;
  menteePhoto: string | null;
  service: string;
  amount: number;
  earnings: number;
  platformFee: number;
  attributionSource: string;
  commissionRate: number;
  startTime: string;
  status: string;
}

const DELIVERY_TYPES = [
  { label: '1:1 Video Call', value: 'VIDEO_CALL' },
  { label: 'Resume Review', value: 'RESUME_REVIEW' },
  { label: 'Mock Interview', value: 'MOCK_INTERVIEW' },
  { label: 'Career Guidance', value: 'CAREER_GUIDANCE' },
  { label: 'Async Message', value: 'ASYNC_MESSAGE' },
  { label: 'Portfolio Review', value: 'PORTFOLIO_REVIEW' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatPrice(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${amount.toLocaleString()}`;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'services', label: 'Services', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4" /> },
  { id: 'earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export default function MentorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile editing state
  const [editProfile, setEditProfile] = useState({
    headline: '',
    bio: '',
    company: '',
    industry: '',
    location: '',
    yearsExperience: '',
    languages: [] as string[],
    linkedInUrl: '',
    portfolioUrl: '',
    expertiseTags: [] as string[],
  });
  const [langInput, setLangInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Service form state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    duration: 30,
    price: '',
    isFree: false,
    deliveryType: 'VIDEO_CALL',
    maxBookingsPerDay: '',
    availableDays: [1, 2, 3, 4, 5],
  });

  // Fetch data
  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadAll();
  }, [user, router]);

  async function loadAll() {
    try {
      const [profileRes, servicesRes, earningsRes] = await Promise.all([
        api.get<{ data: MentorProfile }>('/connections/profile'),
        api.get<{ data: Service[] }>('/connections/services'),
        api.get<{ data: Earnings }>('/connections/earnings'),
      ]);
      setProfile(profileRes.data);
      setServices(servicesRes.data);
      setEarnings(earningsRes.data);

      setEditProfile({
        headline: profileRes.data.headline || '',
        bio: profileRes.data.bio || '',
        company: profileRes.data.company || '',
        industry: profileRes.data.industry || '',
        location: profileRes.data.location || '',
        yearsExperience: profileRes.data.yearsExperience?.toString() || '',
        languages: profileRes.data.languages || [],
        linkedInUrl: profileRes.data.linkedInUrl || '',
        portfolioUrl: profileRes.data.portfolioUrl || '',
        expertiseTags: profileRes.data.creatorTags.map(t => t.tag.name) || [],
      });
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // Save profile
  async function saveProfile() {
    try {
      await api.put('/connections/profile', {
        ...editProfile,
        yearsExperience: editProfile.yearsExperience ? parseInt(editProfile.yearsExperience) : null,
      });
      toast.success('Profile updated');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    }
  }

  // Create service
  async function createService() {
    try {
      await api.post('/connections/services', {
        ...serviceForm,
        price: serviceForm.isFree ? 0 : parseInt(serviceForm.price) || 0,
        maxBookingsPerDay: serviceForm.maxBookingsPerDay ? parseInt(serviceForm.maxBookingsPerDay) : undefined,
      });
      toast.success('Service created');
      setShowServiceForm(false);
      setServiceForm({ title: '', description: '', duration: 30, price: '', isFree: false, deliveryType: 'VIDEO_CALL', maxBookingsPerDay: '', availableDays: [1, 2, 3, 4, 5] });
      const res = await api.get<{ data: Service[] }>('/connections/services');
      setServices(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create service');
    }
  }

  // Delete service
  async function deleteService(serviceId: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/connections/services/${serviceId}`);
      toast.success('Service deleted');
      setServices(services.filter(s => s.id !== serviceId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete service');
    }
  }

  // Copy profile link
  function copyProfileLink() {
    if (!profile?.displayName) return;
    const url = `${window.location.origin}/connections/${profile.displayName}?ref=direct`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-64" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your profile, services, and bookings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyProfileLink}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Profile Link
            </button>
            {profile?.displayName && (
              <Link
                href={`/connections/${profile.displayName}`}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Profile
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className="bg-white rounded-xl border p-2 space-y-1 lg:sticky lg:top-24">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Total Earnings</span>
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(earnings?.totalEarnings)}</p>
                    <p className="text-xs text-gray-500 mt-1">Net after commission</p>
                  </div>
                  <div className="bg-white rounded-xl border p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Total Bookings</span>
                      <Calendar className="w-5 h-5 text-primary-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{earnings?.totalBookings || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">All time</p>
                  </div>
                  <div className="bg-white rounded-xl border p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Direct (5% fee)</span>
                      <ArrowUpRight className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{earnings?.direct.bookings || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Earned {formatPrice(earnings?.direct.earnings)}</p>
                  </div>
                  <div className="bg-white rounded-xl border p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Marketplace (20% fee)</span>
                      <ArrowDownRight className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{earnings?.marketplace.bookings || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Earned {formatPrice(earnings?.marketplace.earnings)}</p>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold mb-4">Recent Bookings</h3>
                  {!earnings?.recentBookings.length ? (
                    <p className="text-gray-500 text-sm py-4 text-center">No bookings yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b">
                            <th className="pb-2 font-medium">Mentee</th>
                            <th className="pb-2 font-medium">Service</th>
                            <th className="pb-2 font-medium">Amount</th>
                            <th className="pb-2 font-medium">Fee</th>
                            <th className="pb-2 font-medium">Earnings</th>
                            <th className="pb-2 font-medium">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {earnings.recentBookings.map((b: Booking) => (
                            <tr key={b.id} className="border-b last:border-0">
                              <td className="py-3 font-medium">{b.mentee}</td>
                              <td className="py-3 text-gray-600">{b.service}</td>
                              <td className="py-3">{formatPrice(b.amount)}</td>
                              <td className="py-3 text-red-500">-{formatPrice(b.platformFee)}</td>
                              <td className="py-3 text-green-600 font-medium">{formatPrice(b.earnings)}</td>
                              <td className="py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  b.attributionSource === 'DIRECT'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {b.attributionSource === 'DIRECT' ? 'Direct' : 'Marketplace'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Edit Mentor Profile</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Headline</label>
                    <input type="text" value={editProfile.headline} onChange={(e) => setEditProfile({ ...editProfile, headline: e.target.value })}
                      placeholder="e.g., Senior AI Engineer" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input type="text" value={editProfile.company} onChange={(e) => setEditProfile({ ...editProfile, company: e.target.value })}
                      placeholder="e.g., Google" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input type="text" value={editProfile.industry} onChange={(e) => setEditProfile({ ...editProfile, industry: e.target.value })}
                      placeholder="e.g., Technology" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" value={editProfile.location} onChange={(e) => setEditProfile({ ...editProfile, location: e.target.value })}
                      placeholder="e.g., San Francisco, CA" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input type="number" value={editProfile.yearsExperience} onChange={(e) => setEditProfile({ ...editProfile, yearsExperience: e.target.value })}
                      placeholder="e.g., 8" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <input type="url" value={editProfile.linkedInUrl} onChange={(e) => setEditProfile({ ...editProfile, linkedInUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/..." className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
                    <input type="url" value={editProfile.portfolioUrl} onChange={(e) => setEditProfile({ ...editProfile, portfolioUrl: e.target.value })}
                      placeholder="https://..." className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea value={editProfile.bio} onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                    rows={4} placeholder="Tell mentees about yourself..."
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                  <div className="flex gap-2">
                    <input type="text" value={langInput} onChange={(e) => setLangInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (langInput.trim() && !editProfile.languages.includes(langInput.trim())) { setEditProfile({ ...editProfile, languages: [...editProfile.languages, langInput.trim()] }); setLangInput(''); } } }}
                      placeholder="Add language" className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editProfile.languages.map((lang) => (
                      <span key={lang} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
                        {lang}
                        <button onClick={() => setEditProfile({ ...editProfile, languages: editProfile.languages.filter(l => l !== lang) })} className="hover:text-primary-900">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expertise Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expertise Tags</label>
                  <div className="flex gap-2">
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (tagInput.trim() && !editProfile.expertiseTags.includes(tagInput.trim())) { setEditProfile({ ...editProfile, expertiseTags: [...editProfile.expertiseTags, tagInput.trim()] }); setTagInput(''); } } }}
                      placeholder="Add tag" className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editProfile.expertiseTags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
                        {tag}
                        <button onClick={() => setEditProfile({ ...editProfile, expertiseTags: editProfile.expertiseTags.filter(t => t !== tag) })} className="hover:text-primary-900">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <button onClick={saveProfile} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium">
                  Save Profile
                </button>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Your Services</h3>
                  <button onClick={() => setShowServiceForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
                    <Plus className="w-4 h-4" />
                    Add Service
                  </button>
                </div>

                {/* Service Form */}
                {showServiceForm && (
                  <div className="bg-white rounded-xl border p-6 space-y-4">
                    <h4 className="font-medium">Create New Service</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input type="text" value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                          placeholder="e.g., 30 Minute Career Guidance" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                          rows={2} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                        <input type="number" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 30 })}
                          min={15} max={480} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
                        <select value={serviceForm.deliveryType} onChange={(e) => setServiceForm({ ...serviceForm, deliveryType: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none">
                          {DELIVERY_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                          disabled={serviceForm.isFree} placeholder="e.g., 999"
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={serviceForm.isFree}
                          onChange={(e) => setServiceForm({ ...serviceForm, isFree: e.target.checked, price: e.target.checked ? '' : serviceForm.price })}
                          className="rounded border-gray-300" />
                        <label className="text-sm text-gray-700">Free service</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max bookings per day</label>
                        <input type="number" value={serviceForm.maxBookingsPerDay} onChange={(e) => setServiceForm({ ...serviceForm, maxBookingsPerDay: e.target.value })}
                          min={1} placeholder="Unlimited"
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                    </div>

                    {/* Available Days */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                      <div className="flex gap-2">
                        {DAYS.map((day, i) => (
                          <button key={i} onClick={() => {
                            const days = serviceForm.availableDays.includes(i)
                              ? serviceForm.availableDays.filter(d => d !== i)
                              : [...serviceForm.availableDays, i];
                            setServiceForm({ ...serviceForm, availableDays: days });
                          }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            serviceForm.availableDays.includes(i)
                              ? 'bg-primary-100 text-primary-700 border border-primary-300'
                              : 'bg-gray-100 text-gray-500 border border-transparent'
                          }`}>
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={createService} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 font-medium">
                        Create Service
                      </button>
                      <button onClick={() => setShowServiceForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Service List */}
                {services.length === 0 ? (
                  <div className="bg-white rounded-xl border p-12 text-center">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 mb-1">No services yet</h4>
                    <p className="text-sm text-gray-500 mb-4">Create your first service to start receiving bookings</p>
                    <button onClick={() => setShowServiceForm(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
                      Create Service
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div key={service.id} className="bg-white rounded-xl border p-5 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.title}</h4>
                          {service.description && <p className="text-sm text-gray-500 mt-1">{service.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                            <span>{service.duration} min</span>
                            <span>•</span>
                            <span>{DELIVERY_TYPES.find(dt => dt.value === service.deliveryType)?.label}</span>
                            <span>•</span>
                            <span>{service.availableDays.map(d => DAYS[d]).join(', ')}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-primary-600">
                            {service.isFree ? 'Free' : `₹${service.price}`}
                          </p>
                          <button onClick={() => deleteService(service.id)}
                            className="text-xs text-red-500 hover:text-red-700 mt-1">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Earnings Overview</h3>

                {/* Earnings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatPrice(earnings?.totalRevenue)}</p>
                  </div>
                  <div className="bg-white rounded-xl border p-6">
                    <p className="text-sm text-gray-500 mb-1">Platform Fees</p>
                    <p className="text-2xl font-bold text-red-500">-{formatPrice(earnings?.totalPlatformFees)}</p>
                  </div>
                  <div className="bg-white rounded-xl border p-6 bg-green-50 border-green-200">
                    <p className="text-sm text-green-600 mb-1">Net Earnings</p>
                    <p className="text-2xl font-bold text-green-700">{formatPrice(earnings?.totalEarnings)}</p>
                  </div>
                </div>

                {/* Attribution Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <h4 className="font-medium">Direct Bookings</h4>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">5% fee</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Bookings</span><span className="font-medium">{earnings?.direct.bookings || 0}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Revenue</span><span className="font-medium">{formatPrice((earnings?.direct.earnings || 0) + (earnings?.direct.fees || 0))}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span className="text-red-500">-{formatPrice(earnings?.direct.fees)}</span></div>
                      <div className="flex justify-between border-t pt-2"><span className="font-medium">You receive</span><span className="font-bold text-green-600">{formatPrice(earnings?.direct.earnings)}</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <h4 className="font-medium">Marketplace Bookings</h4>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">20% fee</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Bookings</span><span className="font-medium">{earnings?.marketplace.bookings || 0}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Revenue</span><span className="font-medium">{formatPrice((earnings?.marketplace.earnings || 0) + (earnings?.marketplace.fees || 0))}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span className="text-red-500">-{formatPrice(earnings?.marketplace.fees)}</span></div>
                      <div className="flex justify-between border-t pt-2"><span className="font-medium">You receive</span><span className="font-bold text-green-600">{formatPrice(earnings?.marketplace.earnings)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-lg mb-4">All Bookings</h3>
                {!earnings?.recentBookings.length ? (
                  <p className="text-gray-500 text-sm text-center py-8">No bookings yet</p>
                ) : (
                  <div className="space-y-3">
                    {earnings.recentBookings.map((b: Booking) => (
                      <div key={b.id} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{b.service}</p>
                            <p className="text-sm text-gray-500">with {b.mentee}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(b.startTime).toLocaleDateString()} at {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatPrice(b.amount)}</p>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              b.attributionSource === 'DIRECT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {b.attributionSource} ({b.commissionRate}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl border p-6 space-y-6">
                <h3 className="font-semibold text-lg">Settings</h3>
                <div>
                  <h4 className="font-medium mb-2">Commission Rates</h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Direct bookings (your profile link)</span>
                      <span className="font-medium">5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marketplace bookings (Guidely discovery)</span>
                      <span className="font-medium">20%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Your Profile Link</h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600 overflow-x-auto">
                      {typeof window !== 'undefined' && profile?.displayName
                        ? `${window.location.origin}/connections/${profile.displayName}?ref=direct`
                        : '/connections/[your-handle]?ref=direct'}
                    </code>
                    <button onClick={copyProfileLink} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 whitespace-nowrap">
                      Copy Link
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share this link with your network. Bookings through this link are charged at 5% instead of 20%.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
