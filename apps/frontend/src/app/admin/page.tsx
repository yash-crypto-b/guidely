'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';

interface DashboardStats {
  totalUsers: number;
  totalCreators: number;
  totalStudents: number;
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  gmw: number;
  activeCreators: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      router.push('/');
      return;
    }
    async function load() {
      try {
        const res = await api.get<{ data: DashboardStats }>('/admin/dashboard');
        setStats(res.data);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [user, router]);

  if (loading) return <><Navbar /><div className="text-center py-20">Loading...</div></>;

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white border rounded-xl p-6">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-3xl font-bold mt-1">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-6">
            <p className="text-sm text-gray-500">Creators</p>
            <p className="text-3xl font-bold mt-1">{stats?.totalCreators || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-6">
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-3xl font-bold mt-1">{stats?.totalBookings || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-6">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-3xl font-bold mt-1">{stats?.completionRate || 0}%</p>
          </div>
          <div className="bg-white border rounded-xl p-6">
            <p className="text-sm text-gray-500">Active Creators</p>
            <p className="text-3xl font-bold mt-1">{stats?.activeCreators || 0}</p>
          </div>
          <div className="bg-white border rounded-xl p-6">
            <p className="text-sm text-gray-500">GMV</p>
            <p className="text-3xl font-bold mt-1">${((stats?.gmw || 0) / 100).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </>
  );
}
