import { Db } from './db';
import { hashPassword } from './auth';
import { initialWorkers } from '@/lib/mock-data';

/**
 * Demo data for local evaluation (KAAMSETU_DEMO_SEED=true, or local PGlite).
 * Every demo worker is flagged `is_demo_profile` and every demo job `is_demo`,
 * and the UI labels them. Deliberately NOT seeded: ratings, reviews and passed
 * verification checks — those must come from real activity.
 */
export const DEMO_PHONES = {
  admin: '9800000001',
  customer: '9812345678',
  worker: '9810123456', // Rameshwar, electrician, Lajpat Nagar
  plumber: '9811122233', // Arjun, plumber, Greater Kailash
  employer: '9800000002',
};

export function demoPassword() {
  return process.env.KAAMSETU_DEMO_PASSWORD || 'demo-pass-123';
}

const LOCALITY_MAP: Record<string, string> = {
  'Lajpat Nagar': 'Lajpat Nagar',
  Koramangala: 'Koramangala',
  'Andheri West': 'Andheri West',
  'Noida Sector 62': 'Noida Sector 62',
  Kothrud: 'Kothrud',
  'Gurugram Sector 43': 'Gurugram Sector 43',
  'HSR Layout': 'HSR Layout',
};

export async function seedDemoData(db: Db) {
  const done = await db.query('SELECT 1 FROM users WHERE phone = $1', [DEMO_PHONES.admin]);
  if (done.rows.length) return;
  const pw = hashPassword(demoPassword());

  await db.transaction(async (tx) => {
    const loc = async (name: string, city: string) =>
      (await tx.query('SELECT id FROM localities WHERE name = $1 AND city = $2', [name, city])).rows[0]?.id || null;
    const user = async (phone: string, name: string, role: string, locality: string, city: string) => {
      const { rows } = await tx.query(
        `INSERT INTO users(phone, full_name, role, locality, city, locality_id, password_hash, privacy_accepted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
        [phone, name, role, locality, city, await loc(locality, city), pw],
      );
      return rows[0].id as string;
    };

    await user(DEMO_PHONES.admin, 'Platform Ops Admin', 'admin', 'Lajpat Nagar', 'Delhi NCR');
    await user(DEMO_PHONES.customer, 'Priya Sharma', 'customer', 'Lajpat Nagar', 'Delhi NCR');

    const demoWorkers = [
      ...initialWorkers.map((w) => ({ ...w, openToJobs: w.category === 'general-labour' })),
      {
        ...initialWorkers.find((w) => w.category === 'plumber')!,
        id: 'extra-plumber',
        fullName: 'Arjun Kumar',
        fullNameHi: 'अर्जुन कुमार',
        phone: DEMO_PHONES.plumber,
        avatarUrl: '',
        locality: 'Greater Kailash',
        city: 'Delhi NCR',
        experienceYears: 4,
        bio: 'Plumber for taps, flush tanks, pipe leaks and bathroom fittings in South Delhi.',
        bioHi: 'दक्षिण दिल्ली में नल, फ्लश टैंक, पाइप लीकेज और बाथरूम फिटिंग का काम।',
        openToJobs: true,
      },
    ];

    for (const w of demoWorkers) {
      const localityName = LOCALITY_MAP[w.locality] || w.locality;
      const userId = await user(w.phone, w.fullName, 'worker', localityName, w.city);
      const hourly = w.pricingBasis === 'per-hour' ? w.baseRate : null;
      const visit = w.pricingBasis === 'per-visit' ? w.baseRate : null;
      const { rows } = await tx.query(
        `INSERT INTO worker_profiles(user_id, full_name, full_name_hi, phone, avatar_url, category_slug, subcategories,
            experience_years, city, locality, locality_id, service_radius_km, languages, is_available_today, pricing_basis,
            base_rate, hourly_rate, visit_charge, bio, bio_hi, skills, verification_status, rating, review_count,
            completed_jobs_count, on_time_arrival_rate_percent, is_demo_profile, accepts_on_demand, open_to_jobs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE, $14, $15, $16, $17, $18, $19, $20,
                 'unverified', 0, 0, 0, 100, TRUE, TRUE, $21) RETURNING id`,
        [
          userId,
          w.fullName,
          w.fullNameHi || null,
          w.phone,
          w.avatarUrl || null,
          w.category,
          w.subcategories,
          w.experienceYears,
          w.city,
          localityName,
          await loc(localityName, w.city),
          Math.max(w.serviceRadiusKm, 8),
          w.languages,
          w.pricingBasis,
          w.baseRate,
          hourly,
          visit,
          w.bio,
          w.bioHi || null,
          w.subcategories,
          w.openToJobs,
        ],
      );
      const workerId = rows[0].id;
      for (const rc of w.rateCards) {
        await tx.query(
          'INSERT INTO rate_cards(worker_id, service_title, pricing_basis, amount, description) VALUES ($1, $2, $3, $4, $5)',
          [workerId, rc.serviceTitle, rc.pricingBasis, rc.amount, rc.description],
        );
      }
      // Mon–Sat, 9:00–13:00 and 14:00–18:00 IST (lunch break in between).
      for (let wd = 1; wd <= 6; wd++) {
        for (const [s, e] of [
          [540, 780],
          [840, 1080],
        ]) {
          await tx.query(
            `INSERT INTO worker_availability(worker_id, day_of_week, time_slot, weekday, start_minute, end_minute)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [workerId, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][wd], `${s}-${e}`, wd, s, e],
          );
        }
      }
    }

    const employerId = await user(DEMO_PHONES.employer, 'Vinod Malhotra', 'employer', 'Dwarka', 'Delhi NCR');
    const ba = await tx.query(`INSERT INTO business_accounts(business_name, contact_person_id, service_contract_type) VALUES ($1, $2, 'construction') RETURNING id`, [
      'Malhotra Constructions (Demo)',
      employerId,
    ]);
    const jobs = [
      ['Mason for residential building', 'Brickwork, plastering and block laying on a G+3 residential site. Tools provided on site.', 'construction', 'Dwarka', ['Brickwork', 'Plastering'], 'full_time', 18000, 22000, 'month', 'Mon–Sat, 8:30 AM – 5:30 PM'],
      ['Site helper (daily wage)', 'Carrying material, mixing concrete and keeping the site clean. Safety shoes and helmet provided.', 'general-labour', 'Gurugram Sector 43', ['Loading', 'Concrete mixing'], 'daily_wage', 650, 750, 'day', 'Daily, 9 AM – 6 PM, paid weekly'],
      ['Wall painter for 3-month contract', 'Interior putty, primer and emulsion painting for a group of 12 flats.', 'construction', 'Saket', ['Painting', 'Putty work'], 'contract', 700, 900, 'day', 'Mon–Sat, 9 AM – 6 PM for about 3 months'],
      ['Plumber for building maintenance', 'Part-time maintenance plumber for a housing society. Pipe repairs, tank cleaning coordination.', 'plumber', 'Lajpat Nagar', ['Pipe fitting', 'Leak repair'], 'part_time', 9000, 12000, 'month', 'Mornings 8 AM – 12 PM, 6 days a week'],
    ] as const;
    for (const j of jobs) {
      await tx.query(
        `INSERT INTO job_listings(employer_id, business_account_id, organisation_name, title, duties, trade_slug, locality_id, locality_text,
            city, required_skills, employment_type, pay_min, pay_max, pay_period, schedule, openings, is_demo)
         VALUES ($1, $2, 'Malhotra Constructions (Demo)', $3, $4, $5, $6, $7, 'Delhi NCR', $8, $9, $10, $11, $12, $13, 2, TRUE)`,
        [employerId, ba.rows[0].id, j[0], j[1], j[2], await loc(j[3], 'Delhi NCR'), j[3], j[4], j[5], j[6], j[7], j[8], j[9]],
      );
    }
  });
}
