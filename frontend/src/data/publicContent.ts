export type PublicDoctor = {
  name: string;
  specialization: string;
  experience: string;
  fee: string;
  rating: number;
};

export type PublicBlog = {
  category: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
};

export const publicDoctors: PublicDoctor[] = [
  {
    name: 'Dr. Ayesha Khan',
    specialization: 'Cardiology',
    experience: '12 years',
    fee: 'PKR 1,500/consult',
    rating: 5
  },
  {
    name: 'Dr. Hamza Qureshi',
    specialization: 'Endocrinology',
    experience: '10 years',
    fee: 'PKR 1,500/consult',
    rating: 5
  },
  {
    name: 'Dr. Sana Tariq',
    specialization: 'Internal Medicine',
    experience: '14 years',
    fee: 'PKR 1,500/consult',
    rating: 5
  },
  {
    name: 'Dr. Bilal Rafiq',
    specialization: 'Pulmonology',
    experience: '9 years',
    fee: 'PKR 1,200/consult',
    rating: 5
  },
  {
    name: 'Dr. Mariam Asif',
    specialization: 'Nutrition',
    experience: '11 years',
    fee: 'PKR 1,300/consult',
    rating: 5
  },
  {
    name: 'Dr. Taha Nadeem',
    specialization: 'General Medicine',
    experience: '13 years',
    fee: 'PKR 1,400/consult',
    rating: 5
  }
];

export const publicBlogs: PublicBlog[] = [
  {
    category: 'Heart Health',
    title: 'Five Daily Habits That Keep Your Heart Strong',
    author: 'Dr. Ayesha Khan - Cardiologist',
    date: 'April 14, 2026',
    excerpt:
      'Simple routines can significantly lower cardiovascular risk. Learn the habits our specialists recommend for long-term resilience.'
  },
  {
    category: 'Diabetes Care',
    title: 'How to Read Glucose Trends Instead of Single Readings',
    author: 'Dr. Hamza Qureshi - Endocrinologist',
    date: 'April 10, 2026',
    excerpt:
      'A single number rarely tells the full story. Discover how daily patterns can guide smarter lifestyle and medication decisions.'
  },
  {
    category: 'Preventive Health',
    title: 'Why Preventive Monitoring Matters More Than Ever',
    author: 'Dr. Sana Tariq - Internal Medicine',
    date: 'April 6, 2026',
    excerpt:
      'From blood pressure to sleep consistency, continuous monitoring helps detect early warning signs before they become emergencies.'
  },
  {
    category: 'Respiratory Wellness',
    title: 'Managing Asthma Triggers at Home and Work',
    author: 'Dr. Bilal Rafiq - Pulmonologist',
    date: 'April 3, 2026',
    excerpt:
      'A practical guide to identifying trigger patterns, improving indoor air quality, and building a proactive breathing-care plan.'
  },
  {
    category: 'Lifestyle Medicine',
    title: 'The Sleep-Nutrition Link You Should Not Ignore',
    author: 'Dr. Mariam Asif - Nutrition Specialist',
    date: 'March 29, 2026',
    excerpt:
      'Nutrition timing and sleep quality deeply affect energy, blood sugar, and mood. Here is a balanced approach that works long-term.'
  },
  {
    category: 'Primary Care',
    title: 'When to Consult a Doctor for Recurring Fatigue',
    author: 'Dr. Taha Nadeem - General Physician',
    date: 'March 24, 2026',
    excerpt:
      'Persistent tiredness may point to hidden causes. Understand warning signs and what to track before your next consultation.'
  }
];