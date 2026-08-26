'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';

interface Creator {
  id: string;
  name: string;
  displayName: string;
  photoUrl: string | null;
  headline: string | null;
  bio: string | null;
  expertiseTags: string[];
  rating: number | null;
  reviewCount: number;
  sessionTypes: { id: string; title: string; duration: number; price: number; isFree: boolean }[];
}

export default function ExplorePage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: { creators: Creator[] } }>('/creators/search');
        setCreators(res.data.creators);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Find a Mentor</h1>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by name, skill, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : creators.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No mentors found</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators
              .filter((c) =>
                !search ||
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.headline?.toLowerCase().includes(search.toLowerCase()) ||
                c.expertiseTags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
              )
              .map((creator) => (
                <Link
                  key={creator.id}
                  href={`/creators/${creator.displayName || creator.id}`}
                  className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                      {creator.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold">{creator.name}</h3>
                      {creator.headline && (
                        <p className="text-sm text-gray-500 truncate">{creator.headline}</p>
                      )}
                    </div>
                  </div>
                  {creator.expertiseTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {creator.expertiseTags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {creator.rating ? `★ ${creator.rating}` : 'No ratings'} · {creator.reviewCount} reviews
                    </span>
                    {creator.sessionTypes[0] && (
                      <span className="font-medium text-primary-600">
                        From ${(creator.sessionTypes[0].price || 0) / 100}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
