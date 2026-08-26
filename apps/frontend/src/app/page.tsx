import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50">
          <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
                Find Your Perfect{' '}
                <span className="text-primary-600">Mentor</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Connect with industry experts for 1:1 guidance. Book sessions, get advice, and grow your career.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Link
                  href="/creators"
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700"
                >
                  Find a Mentor
                </Link>
                <Link
                  href="/register"
                  className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-50"
                >
                  Become a Mentor
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Discover', desc: 'Browse expert mentors by topic, price, and rating' },
                { title: 'Book', desc: 'Pick a time slot and book a session instantly' },
                { title: 'Learn', desc: 'Meet 1:1 via video call and get personalized guidance' },
              ].map((step, i) => (
                <div key={i} className="text-center p-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary-700 font-bold text-lg">{i + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">For Creators</h2>
            <p className="text-lg text-gray-600 mb-8">
              Set your own rates, keep 100% of your earnings, and build your mentoring brand.
            </p>
            <Link
              href="/register"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
            >
              Start Mentoring
            </Link>
          </div>
        </section>

        <footer className="bg-white border-t py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>Guidely — Open-source mentorship platform. MIT License.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
