import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const connectionsRouter = Router();

// ─── Mentor Profile Management ────────────────────────────────────────

// Get own mentor profile
connectionsRouter.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get expertise tags
    const { data: tags } = await supabaseAdmin
      .from('creator_tags')
      .select('tag:tags(name)')
      .eq('creator_id', userId);

    // Get social links
    const { data: socialLinks } = await supabaseAdmin
      .from('social_links')
      .select('*')
      .eq('user_id', userId);

    // Get session types (services)
    const { data: sessionTypes } = await supabaseAdmin
      .from('session_type_definitions')
      .select('*')
      .eq('creator_id', userId)
      .eq('is_active', true);

    // Get availability
    const { data: availability } = await supabaseAdmin
      .from('availability')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get review stats
    const { count: reviewCount } = await supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId);

    const { count: completedBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .eq('status', 'COMPLETED');

    // Get recent reviews
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('*, reviewer:users!reviews_reviewer_id_fkey(id, name, photo_url)')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      ...user,
      creatorTags: tags || [],
      socialLinks: socialLinks || [],
      sessionTypes: sessionTypes || [],
      availability: availability || [],
      reviewCount: reviewCount || 0,
      completedSessions: completedBookings || 0,
      reviewsReceived: reviews || [],
    });
  } catch (err) {
    next(err);
  }
});

// Update mentor profile
connectionsRouter.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      headline, bio, company, industry, location, yearsExperience,
      languages, linkedInUrl, portfolioUrl, hourlyRate, resumeUrl,
      expertiseTags, socialLinks
    } = req.body;

    console.log(`[PUT /profile] user=${userId} fields=${Object.keys(req.body).join(',')}`);

    // Ensure a users row exists — Supabase Auth creates auth.users but not
    // necessarily public.users.  Upsert so first-time onboarding works.
    let { data: currentUser, error: userFetchErr } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (!currentUser) {
      // Auto-create from Supabase auth metadata
      const meta = req.user?.user_metadata || {};
      const insertData = {
        id: userId,
        email: req.user?.email || '',
        name: meta.full_name || meta.name || req.user?.email?.split('@')[0] || 'User',
        role: 'STUDENT',
      };
      console.log(`[PUT /profile] Auto-creating users row for ${userId}`);
      const { data: created, error: createErr } = await supabaseAdmin
        .from('users')
        .insert(insertData)
        .select('role')
        .single();
      if (createErr) {
        console.error(`[PUT /profile] Failed to auto-create users row for ${userId}:`, createErr);
        return res.status(500).json({ error: 'Failed to initialise user profile', details: createErr.message });
      }
      currentUser = created;
    }

    const updateData = {};
    if (headline !== undefined) updateData.headline = headline;
    if (bio !== undefined) updateData.bio = bio;
    if (company !== undefined) updateData.company = company;
    if (industry !== undefined) updateData.industry = industry;
    if (location !== undefined) updateData.location = location;
    if (yearsExperience !== undefined) updateData.years_experience = yearsExperience;
    if (languages !== undefined) updateData.languages = languages;
    if (linkedInUrl !== undefined) updateData.linkedin_url = linkedInUrl;
    if (portfolioUrl !== undefined) updateData.portfolio_url = portfolioUrl;
    if (hourlyRate !== undefined) updateData.hourly_rate = hourlyRate;
    if (resumeUrl !== undefined) updateData.resume_url = resumeUrl;
    if (currentUser?.role === 'STUDENT') {
      updateData.role = 'CREATOR';
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error(`[PUT /profile] User update failed for ${userId}:`, updateError);
      return res.status(500).json({ error: 'Failed to update profile', details: updateError.message });
    }

    // Update expertise tags
    if (Array.isArray(expertiseTags)) {
      // Delete existing tags
      const { error: delErr } = await supabaseAdmin
        .from('creator_tags')
        .delete()
        .eq('creator_id', userId);

      if (delErr) {
        console.error(`[PUT /profile] Failed to delete old tags for ${userId}:`, delErr);
        // Continue — non-fatal, new inserts may still succeed
      }

      // Upsert new tags and create associations
      for (const tagName of expertiseTags) {
        try {
          // Upsert tag
          let { data: tag, error: tagErr } = await supabaseAdmin
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .maybeSingle();

          if (tagErr) {
            console.error(`[PUT /profile] Tag lookup failed for "${tagName}":`, tagErr);
            continue;
          }

          if (!tag) {
            const { data: newTag, error: insertErr } = await supabaseAdmin
              .from('tags')
              .insert({ name: tagName })
              .select('id')
              .single();
            if (insertErr) {
              console.error(`[PUT /profile] Tag insert failed for "${tagName}":`, insertErr);
              continue;
            }
            tag = newTag;
          }

          if (tag) {
            const { error: ctErr } = await supabaseAdmin
              .from('creator_tags')
              .insert({ creator_id: userId, tag_id: tag.id });
            if (ctErr) {
              console.error(`[PUT /profile] creator_tags insert failed for "${tagName}":`, ctErr);
            }
          }
        } catch (tagLoopErr) {
          console.error(`[PUT /profile] Unexpected error processing tag "${tagName}":`, tagLoopErr);
        }
      }
    }

    // Update social links
    if (Array.isArray(socialLinks)) {
      await supabaseAdmin
        .from('social_links')
        .delete()
        .eq('user_id', userId);

      if (socialLinks.length > 0) {
        const { error: slErr } = await supabaseAdmin
          .from('social_links')
          .insert(socialLinks.map(link => ({ user_id: userId, ...link })));
        if (slErr) {
          console.error(`[PUT /profile] Social links insert failed for ${userId}:`, slErr);
        }
      }
    }

    console.log(`[PUT /profile] Profile updated successfully for ${userId}`);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(`[PUT /profile] Unhandled error:`, err);
    next(err);
  }
});

// ─── Services ─────────────────────────────────────────────────────────

// Get own services
connectionsRouter.get('/services', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('session_type_definitions')
      .select('*')
      .eq('creator_id', req.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// Create service
connectionsRouter.post('/services', requireAuth, async (req, res, next) => {
  try {
    const {
      title, description, duration, price, isFree,
      deliveryType, maxBookingsPerDay, availableDays
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('session_type_definitions')
      .insert({
        creator_id: req.user.id,
        title,
        description,
        duration: duration || 30,
        price: isFree ? 0 : (price || 0),
        is_free: isFree || false,
        type: 'ONE_ON_ONE',
        delivery_type: deliveryType || 'VIDEO_CALL',
        max_bookings_per_day: maxBookingsPerDay,
        available_days: availableDays || [1, 2, 3, 4, 5],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Delete service
connectionsRouter.delete('/services/:id', requireAuth, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('session_type_definitions')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('creator_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Service deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── Marketplace Search ───────────────────────────────────────────────

connectionsRouter.get('/search', async (req, res, next) => {
  try {
    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        creator_tags(tag:tags(name)),
        session_types:session_type_definitions!session_type_definitions_creator_id_fkey(
          id, title, price, is_free, duration, delivery_type
        ),
        reviews_received:reviews!reviews_creator_id_fkey(rating)
      `)
      .eq('role', 'CREATOR')
      .eq('is_active', true);

    const { search, industry, skills, experienceLevel, minPrice, maxPrice, deliveryType } = req.query;

    if (search) {
      query = query.or(`name.ilike.%${search}%,headline.ilike.%${search}%,bio.ilike.%${search}%,company.ilike.%${search}%`);
    }

    if (industry) {
      query = query.ilike('industry', `%${industry}%`);
    }

    if (experienceLevel) {
      const levels = { junior: [0, 3], mid: [3, 7], senior: [7, 15], lead: [15, 60] };
      const range = levels[experienceLevel.toLowerCase()];
      if (range) {
        query = query.gte('years_experience', range[0]).lte('years_experience', range[1]);
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) throw error;

    const mentors = (users || []).map(u => {
      const reviews = u.reviews_received || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

      const sessions = (u.session_types || []).filter(s => s.id != null);

      return {
        ...u,
        expertiseTags: (u.creator_tags || []).map(ct => ct.tag?.name).filter(Boolean),
        services: sessions,
        rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: reviews.length,
        startingPrice: sessions.length > 0
          ? Math.min(...sessions.filter(s => !s.is_free && s.price).map(s => s.price))
          : null,
      };
    });

    res.json({ mentors, total: count || mentors.length, page, limit });
  } catch (err) {
    next(err);
  }
});

// ─── Public Mentor Profile ────────────────────────────────────────────

connectionsRouter.get('/mentor/:handle', async (req, res, next) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        creator_tags(tag:tags(name)),
        social_links:social_links(*),
        session_types:session_type_definitions!session_type_definitions_creator_id_fkey(
          *
        ),
        availability:availability(*),
        reviews_received:reviews!reviews_creator_id_fkey(
          *, reviewer:users!reviews_reviewer_id_fkey(id, name, photo_url)
        )
      `)
      .or(`display_name.eq.${req.params.handle},id.eq.${req.params.handle}`)
      .in('role', ['CREATOR', 'ADMIN', 'SUPERADMIN'])
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const reviews = user.reviews_received || [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    const sessions = (user.session_types || []).filter(s => s.is_active !== false);

    res.json({
      ...user,
      creatorTags: (user.creator_tags || []).map(ct => ({ tag: { name: ct.tag?.name } })),
      sessionTypes: sessions,
      availability: user.availability || [],
      socialLinks: user.social_links || [],
      reviewsReceived: reviews.slice(0, 10),
      rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewCount: reviews.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Bookings ─────────────────────────────────────────────────────────

connectionsRouter.post('/book', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { serviceId, startTime, bookingMetadata, referralSource } = req.body;
    const mentorHandle = req.query.mentor || req.body.mentorHandle;

    if (!mentorHandle) {
      return res.status(400).json({ error: 'Mentor handle is required' });
    }

    // Find mentor
    const { data: mentor } = await supabaseAdmin
      .from('users')
      .select('id, name, email, display_name')
      .or(`display_name.eq.${mentorHandle},id.eq.${mentorHandle}`)
      .in('role', ['CREATOR', 'ADMIN', 'SUPERADMIN'])
      .eq('is_active', true)
      .single();

    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    // Find service
    const { data: service } = await supabaseAdmin
      .from('session_type_definitions')
      .select('*')
      .eq('id', serviceId)
      .eq('creator_id', mentor.id)
      .eq('is_active', true)
      .single();

    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Attribution
    const attributionSource = referralSource === 'direct' ? 'DIRECT' : 'MARKETPLACE';
    const commissionRate = attributionSource === 'DIRECT' ? 5 : 20;
    const platformFee = service.price ? Math.round(service.price * (commissionRate / 100)) : 0;
    const creatorEarnings = (service.price || 0) - platformFee;

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);

    // Create booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        creator_id: mentor.id,
        student_id: userId,
        session_type_id: service.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        total_amount: service.price || 0,
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
        attribution_source: attributionSource,
        commission_rate: commissionRate,
        booking_metadata: bookingMetadata,
        student_notes: bookingMetadata,
        meeting_provider: 'jitsi',
        meeting_link: `meet.jit.si/${mentor.id}-${Date.now()}`,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

// ─── Saved Mentors ────────────────────────────────────────────────────

connectionsRouter.post('/saved', requireAuth, async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    const userId = req.user.id;

    const { data: existing } = await supabaseAdmin
      .from('saved_mentors')
      .select('id')
      .eq('user_id', userId)
      .eq('mentor_id', mentorId)
      .single();

    if (existing) {
      await supabaseAdmin.from('saved_mentors').delete().eq('id', existing.id);
      return res.json({ saved: false });
    }

    await supabaseAdmin.from('saved_mentors').insert({ user_id: userId, mentor_id: mentorId });
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
});

connectionsRouter.get('/saved', requireAuth, async (req, res, next) => {
  try {
    const { data } = await supabaseAdmin
      .from('saved_mentors')
      .select('*, mentor:users!saved_mentors_mentor_id_fkey(id, name, display_name, photo_url, headline)')
      .eq('user_id', req.user.id)
      .order('saved_at', { ascending: false });

    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// ─── Earnings ─────────────────────────────────────────────────────────

connectionsRouter.get('/earnings', requireAuth, async (req, res, next) => {
  try {
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*, student:users!bookings_student_id_fkey(id, name, photo_url), session_type:session_type_definitions(title)')
      .eq('creator_id', req.user.id)
      .in('status', ['CONFIRMED', 'COMPLETED'])
      .order('created_at', { ascending: false });

    const all = bookings || [];
    const totalEarnings = all.reduce((sum, b) => sum + (b.creator_earnings || 0), 0);
    const totalPlatformFees = all.reduce((sum, b) => sum + (b.platform_fee || 0), 0);
    const totalRevenue = all.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const direct = all.filter(b => b.attribution_source === 'DIRECT');
    const marketplace = all.filter(b => b.attribution_source === 'MARKETPLACE');

    res.json({
      totalEarnings,
      totalPlatformFees,
      totalRevenue,
      totalBookings: all.length,
      direct: {
        bookings: direct.length,
        earnings: direct.reduce((s, b) => s + (b.creator_earnings || 0), 0),
        fees: direct.reduce((s, b) => s + (b.platform_fee || 0), 0),
        commissionRate: 5,
      },
      marketplace: {
        bookings: marketplace.length,
        earnings: marketplace.reduce((s, b) => s + (b.creator_earnings || 0), 0),
        fees: marketplace.reduce((s, b) => s + (b.platform_fee || 0), 0),
        commissionRate: 20,
      },
      recentBookings: all.slice(0, 10).map(b => ({
        id: b.id,
        mentee: b.student?.name,
        menteePhoto: b.student?.photo_url,
        service: b.session_type?.title,
        amount: b.total_amount,
        earnings: b.creator_earnings,
        platformFee: b.platform_fee,
        attributionSource: b.attribution_source,
        commissionRate: b.commission_rate,
        startTime: b.start_time,
        status: b.status,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── Mentee Bookings ──────────────────────────────────────────────────

connectionsRouter.get('/my-bookings', requireAuth, async (req, res, next) => {
  try {
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*, creator:users!bookings_creator_id_fkey(id, name, photo_url, display_name, headline), session_type:session_type_definitions(title, duration, delivery_type), review:reviews(*)')
      .eq('student_id', req.user.id)
      .order('start_time', { ascending: false });

    res.json({ bookings: bookings || [], total: bookings?.length || 0 });
  } catch (err) {
    next(err);
  }
});

// ─── Reviews ──────────────────────────────────────────────────────────

connectionsRouter.post('/bookings/:id/review', requireAuth, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.student_id !== req.user.id) return res.status(403).json({ error: 'Not your booking' });
    if (booking.status !== 'COMPLETED') return res.status(400).json({ error: 'Can only review completed sessions' });

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        booking_id: booking.id,
        reviewer_id: req.user.id,
        creator_id: booking.creator_id,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

// ─── Available Slots ──────────────────────────────────────────────────

connectionsRouter.get('/mentor/:handle/slots/:serviceId', async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const { data: mentor } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`display_name.eq.${req.params.handle},id.eq.${req.params.handle}`)
      .in('role', ['CREATOR', 'ADMIN', 'SUPERADMIN'])
      .eq('is_active', true)
      .single();

    if (!mentor) return res.status(404).json({ error: 'Mentor not found' });

    const { data: service } = await supabaseAdmin
      .from('session_type_definitions')
      .select('*')
      .eq('id', req.params.serviceId)
      .eq('creator_id', mentor.id)
      .eq('is_active', true)
      .single();

    if (!service) return res.status(404).json({ error: 'Service not found' });

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay();

    if (!service.available_days?.includes(dayOfWeek)) {
      return res.json([]);
    }

    const { data: availability } = await supabaseAdmin
      .from('availability')
      .select('*')
      .eq('user_id', mentor.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (!availability?.length) return res.json([]);

    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const { data: existingBookings } = await supabaseAdmin
      .from('bookings')
      .select('start_time, end_time')
      .eq('creator_id', mentor.id)
      .in('status', ['CONFIRMED', 'PENDING'])
      .gte('start_time', dayStart.toISOString())
      .lt('start_time', dayEnd.toISOString());

    const slots = [];
    for (const avail of availability) {
      const [startH, startM] = avail.start_time.split(':').map(Number);
      const [endH, endM] = avail.end_time.split(':').map(Number);
      let current = new Date(date);
      current.setUTCHours(startH, startM, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setUTCHours(endH, endM, 0, 0);

      while (current.getTime() + service.duration * 60000 <= slotEnd.getTime()) {
        const slotStart = new Date(current);
        const slotEndTime = new Date(current.getTime() + service.duration * 60000);

        const isBooked = (existingBookings || []).some(b => {
          const bStart = new Date(b.start_time).getTime();
          const bEnd = new Date(b.end_time).getTime();
          return slotStart.getTime() < bEnd && slotEndTime.getTime() > bStart;
        });

        if (!isBooked && slotStart > new Date()) {
          slots.push({ start: slotStart.toISOString(), end: slotEndTime.toISOString() });
        }

        current = new Date(current.getTime() + 30 * 60000);
      }
    }

    res.json(slots);
  } catch (err) {
    next(err);
  }
});

// ─── Recommended Mentors ──────────────────────────────────────────────

connectionsRouter.get('/recommended', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const { data: users } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        creator_tags(tag:tags(name)),
        session_types:session_type_definitions!session_type_definitions_creator_id_fkey(id, title, price, is_free),
        reviews_received:reviews!reviews_creator_id_fkey(rating)
      `)
      .eq('role', 'CREATOR')
      .eq('is_active', true)
      .limit(limit);

    const mentors = (users || []).map(u => {
      const reviews = u.reviews_received || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;
      return {
        ...u,
        expertiseTags: (u.creator_tags || []).map(ct => ct.tag?.name).filter(Boolean),
        startingPrice: u.session_types?.[0]?.price || null,
        rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: reviews.length,
      };
    });

    res.json(mentors);
  } catch (err) {
    next(err);
  }
});
