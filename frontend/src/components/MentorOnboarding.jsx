import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
  'Design', 'Product', 'Data Science', 'AI/ML', 'Consulting',
  'Engineering', 'Sales', 'Operations', 'Legal', 'Media',
];

const SERVICE_TYPES = [
  { value: 'VIDEO_CALL', label: '1:1 Video Call', icon: '📹' },
  { value: 'RESUME_REVIEW', label: 'Resume Review', icon: '📄' },
  { value: 'MOCK_INTERVIEW', label: 'Mock Interview', icon: '🎯' },
  { value: 'CAREER_GUIDANCE', label: 'Career Guidance', icon: '🧭' },
  { value: 'ASYNC_MESSAGE', label: 'Async Message', icon: '💬' },
  { value: 'PORTFOLIO_REVIEW', label: 'Portfolio Review', icon: '💼' },
];

const POPULAR_SKILLS = [
  'React', 'Python', 'JavaScript', 'TypeScript', 'Node.js', 'AWS',
  'Machine Learning', 'System Design', 'Product Management', 'UI/UX Design',
  'Data Analysis', 'SQL', 'Docker', 'Kubernetes', 'Go', 'Java',
  'Career Coaching', 'Interview Prep', 'Leadership', 'Communication',
];

const STEPS = [
  { id: 'profile', title: 'Your Profile', subtitle: 'Tell us about yourself' },
  { id: 'skills', title: 'Skills & Expertise', subtitle: 'What are you great at?' },
  { id: 'services', title: 'Guidance Services', subtitle: 'What will you help with?' },
  { id: 'resume', title: 'Resume & Links', subtitle: 'Show your experience' },
  { id: 'review', title: 'Review & Launch', subtitle: 'Almost there!' },
];

export function MentorOnboarding({ user, onComplete, onClose }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    headline: '',
    company: '',
    industry: '',
    location: '',
    yearsExperience: '',
    bio: '',
    skills: [],
    customSkill: '',
    services: [],
    servicePrice: '',
    linkedInUrl: '',
    portfolioUrl: '',
    languages: ['English'],
    customLanguage: '',
  });

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addSkill(skill) {
    if (skill && !form.skills.includes(skill)) {
      updateForm('skills', [...form.skills, skill]);
    }
  }

  function removeSkill(skill) {
    updateForm('skills', form.skills.filter(s => s !== skill));
  }

  function toggleService(value) {
    const services = form.services.includes(value)
      ? form.services.filter(s => s !== value)
      : [...form.services, value];
    updateForm('services', services);
  }

  function addLanguage(lang) {
    if (lang && !form.languages.includes(lang)) {
      updateForm('languages', [...form.languages, lang]);
    }
  }

  function removeLanguage(lang) {
    updateForm('languages', form.languages.filter(l => l !== lang));
  }

  function handleResume(e) {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
    }
  }

  function canProceed() {
    switch (step) {
      case 0: return form.headline.trim().length > 0;
      case 1: return form.skills.length > 0;
      case 2: return form.services.length > 0;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      // Upload resume if present
      let resumeUrl = null;
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${user.id}/resume.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('resumes')
            .getPublicUrl(fileName);
          resumeUrl = urlData.publicUrl;
        }
      }

      // Create mentor profile via API
      const profilePayload = {
        headline: form.headline,
        company: form.company || null,
        industry: form.industry || null,
        location: form.location || null,
        yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
        bio: form.bio || null,
        expertiseTags: form.skills,
        languages: form.languages,
        linkedInUrl: form.linkedInUrl || null,
        portfolioUrl: form.portfolioUrl || null,
        resumeUrl,
      };

      const res = await fetch(`${API_BASE}/api/v1/connections/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Failed to save profile');
      }

      // Create services separately
      for (const serviceType of form.services) {
        const serviceTypeInfo = SERVICE_TYPES.find(st => st.value === serviceType);
        const servicePayload = {
          title: serviceTypeInfo?.label || serviceType,
          deliveryType: serviceType,
          description: getServiceDescription(serviceType),
          duration: 30,
          price: form.servicePrice ? parseInt(form.servicePrice) * 100 : 0,
          isFree: !form.servicePrice || parseInt(form.servicePrice) === 0,
        };
        const svcRes = await fetch(`${API_BASE}/api/v1/connections/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(servicePayload),
        });
        if (!svcRes.ok) {
          console.error('Failed to create service:', serviceType, await svcRes.json());
        }
      }

      onComplete?.();
    } catch (err) {
      console.error('Mentor onboarding failed:', err);
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function getServiceDescription(type) {
    const descriptions = {
      VIDEO_CALL: 'Live 1:1 video session for personalized guidance and mentorship.',
      RESUME_REVIEW: 'Detailed feedback on your resume with actionable improvement tips.',
      MOCK_INTERVIEW: 'Practice interview session with real-time feedback and coaching.',
      CAREER_GUIDANCE: 'Strategic career advice for transitions, growth, and goal-setting.',
      ASYNC_MESSAGE: 'Async text-based Q&A for quick questions and advice.',
      PORTFOLIO_REVIEW: 'Review of your portfolio, projects, or GitHub with feedback.',
    };
    return descriptions[type] || '';
  }

  const currentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[rgba(18,20,28,0.98)] shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/[0.06] px-8 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[1.4px] text-[#f27db8]">
                Become a Mentor
              </p>
              <h2 className="text-xl font-bold text-[#f7f2ed]">{currentStep.title}</h2>
              <p className="text-[13px] text-[#6b6e78] mt-1">{currentStep.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[#6b6e78] hover:text-[#f7f2ed] hover:bg-white/[0.06] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step ? 'bg-[#f575ad]' : i === step ? 'bg-[#f575ad]/60' : 'bg-white/[0.08]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-8 py-6">
          {/* Step 0: Profile */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                  Professional Headline *
                </label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => updateForm('headline', e.target.value)}
                  placeholder="e.g., Senior AI Engineer & Career Coach"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => updateForm('company', e.target.value)}
                    placeholder="e.g., Google"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                    Industry
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) => updateForm('industry', e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all appearance-none"
                  >
                    <option value="" className="bg-[#12141c]">Select industry</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind} className="bg-[#12141c]">{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => updateForm('location', e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={form.yearsExperience}
                    onChange={(e) => updateForm('yearsExperience', e.target.value)}
                    placeholder="e.g., 8"
                    min="0"
                    max="60"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                  About You
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => updateForm('bio', e.target.value)}
                  placeholder="Tell mentees about your background, what you're passionate about, and how you can help them..."
                  rows={4}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 1: Skills */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-3">
                  Your Skills & Expertise *
                </label>
                <p className="text-[13px] text-[#6b6e78] mb-4">
                  Select your key skills or type custom ones. These help mentees find you.
                </p>

                {/* Selected skills */}
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {form.skills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#f575ad]/15 text-[#f575ad] border border-[#f575ad]/20"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="hover:text-white transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom skill input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={form.customSkill}
                    onChange={(e) => updateForm('customSkill', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(form.customSkill.trim());
                        updateForm('customSkill', '');
                      }
                    }}
                    placeholder="Type a skill and press Enter"
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all"
                  />
                  <button
                    onClick={() => { addSkill(form.customSkill.trim()); updateForm('customSkill', ''); }}
                    className="px-4 py-3 rounded-xl bg-white/[0.06] text-[#b8b5bd] text-sm font-medium hover:bg-white/[0.1] transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Popular skills */}
                <div>
                  <p className="text-[12px] text-[#6b6e78] mb-2">Popular skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SKILLS.filter(s => !form.skills.includes(s)).slice(0, 16).map(skill => (
                      <button
                        key={skill}
                        onClick={() => addSkill(skill)}
                        className="px-3 py-1.5 rounded-full text-[12px] font-medium border border-white/[0.08] bg-white/[0.03] text-[#b8b5bd] hover:bg-[#f575ad]/10 hover:text-[#f575ad] hover:border-[#f575ad]/20 transition-all"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                  Languages
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.languages.map(lang => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-white/[0.06] text-[#b8b5bd] border border-white/[0.08]"
                    >
                      {lang}
                      <button
                        onClick={() => removeLanguage(lang)}
                        className="hover:text-[#f575ad] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.customLanguage}
                    onChange={(e) => updateForm('customLanguage', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLanguage(form.customLanguage.trim());
                        updateForm('customLanguage', '');
                      }
                    }}
                    placeholder="Add a language"
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Services */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-3">
                  What Guidance Will You Provide? *
                </label>
                <p className="text-[13px] text-[#6b6e78] mb-4">
                  Select the types of sessions you want to offer. You can add more later.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_TYPES.map(service => {
                    const isSelected = form.services.includes(service.value);
                    return (
                      <button
                        key={service.value}
                        onClick={() => toggleService(service.value)}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#f575ad]/40 bg-[#f575ad]/10'
                            : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="text-xl mt-0.5">{service.icon}</span>
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? 'text-[#f575ad]' : 'text-[#f7f2ed]'}`}>
                            {service.label}
                          </p>
                          <p className="text-[11px] text-[#6b6e78] mt-0.5">
                            {getServiceDescription(service.value).split('.')[0]}
                          </p>
                        </div>
                        {isSelected && (
                          <svg className="w-5 h-5 text-[#f575ad] ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                  Default Session Price (₹)
                </label>
                <p className="text-[13px] text-[#6b6e78] mb-3">
                  Set a default price for your sessions. Leave empty for free sessions.
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[#6b6e78] text-sm">₹</span>
                  <input
                    type="number"
                    value={form.servicePrice}
                    onChange={(e) => updateForm('servicePrice', e.target.value)}
                    placeholder="e.g., 999"
                    min="0"
                    className="w-40 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all"
                  />
                  <span className="text-[12px] text-[#6b6e78]">per session</span>
                </div>
                <p className="text-[11px] text-[#6b6e78] mt-2">
                  💡 Platform takes 5% for direct bookings (your link) and 20% for marketplace discovery.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Resume & Links */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Resume Upload */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                  Resume / CV
                </label>
                <p className="text-[13px] text-[#6b6e78] mb-3">
                  Upload your resume to build credibility with potential mentees.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResume}
                  className="hidden"
                />

                {resumeName ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-[#f575ad]/20 bg-[#f575ad]/5">
                    <div className="w-10 h-10 rounded-lg bg-[#f575ad]/15 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#f575ad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#f7f2ed] truncate">{resumeName}</p>
                      <p className="text-[11px] text-[#6b6e78]">PDF or Word document</p>
                    </div>
                    <button
                      onClick={() => { setResumeFile(null); setResumeName(''); }}
                      className="text-[#6b6e78] hover:text-[#f575ad] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#f575ad]/30 transition-all text-center"
                  >
                    <svg className="w-10 h-10 mx-auto mb-3 text-[#6b6e78]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-[#b8b5bd]">Click to upload resume</p>
                    <p className="text-[11px] text-[#6b6e78] mt-1">PDF, DOC, or DOCX (max 5MB)</p>
                  </button>
                )}
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#b8b5bd] mb-2">
                  Professional Links
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] text-[#6b6e78] mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={form.linkedInUrl}
                      onChange={(e) => updateForm('linkedInUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#6b6e78] mb-1">Portfolio / Website</label>
                    <input
                      type="url"
                      value={form.portfolioUrl}
                      onChange={(e) => updateForm('portfolioUrl', e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-[#f7f2ed] placeholder:text-[#4a4d57] focus:outline-none focus:ring-2 focus:ring-[#f575ad]/40 focus:border-[#f575ad]/40 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f575ad] to-[#7c3aed] flex items-center justify-center text-white text-2xl mx-auto mb-4">
                  🎉
                </div>
                <h3 className="text-lg font-bold text-[#f7f2ed] mb-2">Ready to Launch!</h3>
                <p className="text-[13px] text-[#6b6e78]">
                  Review your mentor profile below before going live.
                </p>
              </div>

              {/* Profile Summary */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-4">
                <div>
                  <p className="text-[11px] text-[#6b6e78] uppercase tracking-wider">Headline</p>
                  <p className="text-sm font-medium text-[#f7f2ed] mt-1">{form.headline || 'Not set'}</p>
                </div>
                {form.company && (
                  <div>
                    <p className="text-[11px] text-[#6b6e78] uppercase tracking-wider">Company</p>
                    <p className="text-sm font-medium text-[#f7f2ed] mt-1">{form.company}</p>
                  </div>
                )}
                {form.industry && (
                  <div>
                    <p className="text-[11px] text-[#6b6e78] uppercase tracking-wider">Industry</p>
                    <p className="text-sm font-medium text-[#f7f2ed] mt-1">{form.industry}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-[#6b6e78] uppercase tracking-wider">Skills</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.skills.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f575ad]/15 text-[#f575ad]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-[#6b6e78] uppercase tracking-wider">Services</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.services.map(s => {
                      const svc = SERVICE_TYPES.find(st => st.value === s);
                      return (
                        <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] text-[#b8b5bd]">
                          {svc?.icon} {svc?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {form.servicePrice && (
                  <div>
                    <p className="text-[11px] text-[#6b6e78] uppercase tracking-wider">Price</p>
                    <p className="text-sm font-medium text-[#f7f2ed] mt-1">₹{form.servicePrice} / session</p>
                  </div>
                )}
                {resumeName && (
                  <div>
                    <p className="text-[11px] text-[#6b6e78] uppercase tracking-wider">Resume</p>
                    <p className="text-sm font-medium text-[#f7f2ed] mt-1">📄 {resumeName}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-8 py-5 flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#b8b5bd] hover:text-[#f7f2ed] hover:bg-white/[0.06] transition-colors"
          >
            {step > 0 ? 'Back' : 'Cancel'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#f575ad] text-[#0f1217] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#f575ad] to-[#c084fc] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Launching...
                </span>
              ) : (
                '🚀 Launch Mentor Profile'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
