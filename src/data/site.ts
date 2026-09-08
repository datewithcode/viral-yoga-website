/**
 * ONE FILE TO EDIT.
 * Everything that is specific to your studio lives here: names, phone numbers,
 * addresses, class list, weekly schedule, photos and map links.
 * Replace the placeholder values below and rebuild (npm run build).
 */

export type Location = {
  id: 'anjar' | 'adipur';
  name: string;
  addressLines: string[];
  phone: string;           // shown on the page, e.g. "+91 98765 43210"
  hours: string[];         // free text lines
  mapEmbedUrl: string;     // Google Maps embed URL (see README)
  mapLink: string;         // "Open in Google Maps" link
};

export type ClassInfo = {
  name: string;
  description: string;
  level: 'All levels' | 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
};

export type Session = {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  time: string;            // e.g. "6:00 – 7:00 am"
  className: string;
  location: Location['id'];
  teacher?: string;
};

export type Achievement = {
  year: string;            // '2024', or '' for something with no date
  title: string;           // one line, e.g. 'Gold medal, State Yoga Championship'
  detail: string;          // optional second line, '' to leave it out
};

export type Plan = {
  name: string;          // e.g. "3 months"
  price: number;         // in rupees, digits only
  note: string;          // one short line under the price
};

export const site = {
  // --- Identity -------------------------------------------------------------
  name: 'Viral Yoga',
  shortName: 'Viral Yoga',
  tagline: 'Daily yoga classes in Anjar and Adipur, Kutch.',
  // Optional second line in the hero, in Gujarati. Leave '' to hide.
  taglineGujarati: 'શ્વાસ લો. સ્થિર થાઓ.',
  description:
    'Viral Yoga runs morning and evening yoga classes for beginners and regular practitioners at two studios in Anjar and Adipur, Kutch, Gujarat.',
  // Used for canonical URLs and social previews. Update after you deploy.
  url: 'https://startling-beignet-f4a10f.netlify.app',
  foundedYear: 2016,

  // --- Contact ----------------------------------------------------------------
  phone: '+91 98765 43210',
  // Digits only, with country code. Used for the WhatsApp click-to-chat link.
  whatsapp: '919876543210',
  whatsappMessage: 'Hi, I would like to know about your yoga classes.',
  email: 'hello@example.com',
  instagram: 'https://instagram.com/yourstudio',
  facebook: '',

  // --- Contact form -----------------------------------------------------------
  // 'netlify'  -> works automatically when the site is hosted on Netlify.
  // 'formspree'-> works on any host (Vercel, etc.). Paste your endpoint below.
  formProvider: 'netlify' as 'netlify' | 'formspree',
  formspreeEndpoint: 'https://formspree.io/f/YOUR_FORM_ID',

  // --- Images -------------------------------------------------------------------
  // Put your photos in /public/images and update the paths here.
  heroImage: '/images/hero.svg',
  heroImageAlt: 'Students practising yoga in the studio hall',
  aboutImage: '/images/about.svg',
  gallery: [
    { src: '/images/gallery-1.svg', alt: 'Morning class at the Anjar studio' },
    { src: '/images/gallery-2.svg', alt: 'Pranayama session' },
    { src: '/images/gallery-3.svg', alt: 'Adipur studio hall' },
    { src: '/images/gallery-4.svg', alt: 'Sunday outdoor practice' },
    { src: '/images/gallery-5.svg', alt: 'Beginners batch' },
    { src: '/images/gallery-6.svg', alt: 'Meditation corner' },
  ],

  // --- Locations ---------------------------------------------------------------
  locations: [
    {
      id: 'anjar',
      name: 'Anjar studio',
      addressLines: ['1st floor, Shree Complex', 'Station Road, Anjar', 'Kutch, Gujarat 370110'],
      phone: '+91 98765 43210',
      hours: ['Mon – Sat: 5:30 am – 9:00 am, 5:00 pm – 8:30 pm', 'Sunday: 6:30 am – 8:30 am'],
      mapEmbedUrl: 'https://www.google.com/maps?q=Anjar,+Kutch,+Gujarat&output=embed',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=Anjar,+Kutch,+Gujarat',
    },
    {
      id: 'adipur',
      name: 'Adipur studio',
      addressLines: ['Plot 12, Ward 2B', 'Near Tolani College, Adipur', 'Kutch, Gujarat 370205'],
      phone: '+91 98765 43210',
      hours: ['Mon – Sat: 6:00 am – 9:00 am, 5:30 pm – 8:30 pm', 'Sunday: closed'],
      mapEmbedUrl: 'https://www.google.com/maps?q=Adipur,+Kutch,+Gujarat&output=embed',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=Adipur,+Kutch,+Gujarat',
    },
  ] satisfies Location[],

  // --- Classes ------------------------------------------------------------------
  classes: [
    {
      name: 'Hatha Yoga',
      description: 'Classical asanas held with attention to alignment and breath. The foundation for everything else we teach.',
      level: 'All levels',
      duration: '60 min',
    },
    {
      name: 'Beginners course',
      description: 'A four-week introduction for people who have never done yoga. Small groups, slow pace, no pressure.',
      level: 'Beginner',
      duration: '45 min',
    },
    {
      name: 'Pranayama & meditation',
      description: 'Breathing practices and guided sitting. Good for stress, sleep and blood pressure.',
      level: 'All levels',
      duration: '45 min',
    },
    {
      name: 'Power yoga',
      description: 'A faster, strength-building flow for those who want to sweat. Some experience recommended.',
      level: 'Intermediate',
      duration: '60 min',
    },
    {
      name: 'Yoga for seniors',
      description: 'Gentle chair-assisted and floor practice focused on joints, balance and mobility.',
      level: 'All levels',
      duration: '45 min',
    },
    {
      name: 'Therapeutic yoga',
      description: 'One-to-one or small-group sessions for back pain, diabetes, thyroid and recovery. By appointment.',
      level: 'All levels',
      duration: '60 min',
    },
  ] satisfies ClassInfo[],

  // --- Weekly schedule --------------------------------------------------------
  // Add, remove or edit rows freely. Days are grouped automatically on the page.
  schedule: [
    { day: 'Mon', time: '6:00 – 7:00 am', className: 'Hatha Yoga', location: 'anjar' },
    { day: 'Mon', time: '7:15 – 8:00 am', className: 'Beginners course', location: 'anjar' },
    { day: 'Mon', time: '6:30 – 7:30 am', className: 'Hatha Yoga', location: 'adipur' },
    { day: 'Mon', time: '6:00 – 7:00 pm', className: 'Power yoga', location: 'anjar' },
    { day: 'Mon', time: '6:30 – 7:30 pm', className: 'Hatha Yoga', location: 'adipur' },

    { day: 'Tue', time: '6:00 – 6:45 am', className: 'Pranayama & meditation', location: 'anjar' },
    { day: 'Tue', time: '6:30 – 7:30 am', className: 'Hatha Yoga', location: 'adipur' },
    { day: 'Tue', time: '5:30 – 6:15 pm', className: 'Yoga for seniors', location: 'anjar' },
    { day: 'Tue', time: '6:30 – 7:30 pm', className: 'Power yoga', location: 'adipur' },

    { day: 'Wed', time: '6:00 – 7:00 am', className: 'Hatha Yoga', location: 'anjar' },
    { day: 'Wed', time: '7:15 – 8:00 am', className: 'Beginners course', location: 'anjar' },
    { day: 'Wed', time: '6:30 – 7:30 am', className: 'Hatha Yoga', location: 'adipur' },
    { day: 'Wed', time: '6:00 – 7:00 pm', className: 'Power yoga', location: 'anjar' },
    { day: 'Wed', time: '6:30 – 7:30 pm', className: 'Hatha Yoga', location: 'adipur' },

    { day: 'Thu', time: '6:00 – 6:45 am', className: 'Pranayama & meditation', location: 'anjar' },
    { day: 'Thu', time: '6:30 – 7:30 am', className: 'Hatha Yoga', location: 'adipur' },
    { day: 'Thu', time: '5:30 – 6:15 pm', className: 'Yoga for seniors', location: 'anjar' },
    { day: 'Thu', time: '6:30 – 7:30 pm', className: 'Power yoga', location: 'adipur' },

    { day: 'Fri', time: '6:00 – 7:00 am', className: 'Hatha Yoga', location: 'anjar' },
    { day: 'Fri', time: '7:15 – 8:00 am', className: 'Beginners course', location: 'anjar' },
    { day: 'Fri', time: '6:30 – 7:30 am', className: 'Hatha Yoga', location: 'adipur' },
    { day: 'Fri', time: '6:00 – 7:00 pm', className: 'Hatha Yoga', location: 'anjar' },
    { day: 'Fri', time: '6:30 – 7:30 pm', className: 'Hatha Yoga', location: 'adipur' },

    { day: 'Sat', time: '6:00 – 7:00 am', className: 'Hatha Yoga', location: 'anjar' },
    { day: 'Sat', time: '6:30 – 7:30 am', className: 'Hatha Yoga', location: 'adipur' },
    { day: 'Sat', time: '5:30 – 6:30 pm', className: 'Pranayama & meditation', location: 'anjar' },

    { day: 'Sun', time: '6:30 – 7:30 am', className: 'Hatha Yoga', location: 'anjar' },
  ] satisfies Session[],

  // --- Membership plans & payments ----------------------------------------------
  pricing: {
    intro: 'One membership works at both studios. Sign in with your email to pay online and see your days remaining any time, or pay by UPI and send us a screenshot.',
    // Online payment through Razorpay. Keep false until Razorpay keys are set on the
    // server (rollout step 5). While false, the site shows only direct UPI and the
    // membership page shows days remaining without a Buy panel.
    onlinePaymentsEnabled: false,
    // Set true once a custom email provider (Resend) is connected in Supabase and
    // the sign-in email template includes {{ .Token }}. Until then the email has
    // only a link, so the page must not ask for a code.
    signInEmailHasCode: false,
    // Online fee added on top of the plan price when paying through Razorpay, in percent.
    // 0 = studio absorbs Razorpay's charge. 2.36 = pass Razorpay's 2% + 18% GST to the student.
    // Must match ONLINE_FEE_PERCENT in supabase/functions/_shared/payments.ts.
    onlineFeePercent: 0,
    // UPI: any UPI ID that receives money (GPay, PhonePe, Paytm, bank app).
    upiId: 'yourstudio@upi',
    upiPayeeName: 'Viral Yoga',
    // Shown below the pay buttons. Keep it short.
    afterPayment: 'After paying, send the payment screenshot on WhatsApp with your name and preferred batch. Your membership starts from your first class.',
    plans: [
      { name: '1 month', price: 2000, note: 'Good for trying us out.' },
      { name: '3 months', price: 5000, note: 'Save ₹1,000 against monthly.' },
      { name: '6 months', price: 9000, note: 'Save ₹3,000 against monthly.' },
      { name: '1 year', price: 16000, note: 'Best value. Save ₹8,000.' },
    ] satisfies Plan[],
  },

  // --- Page text ---------------------------------------------------------------
  // All sentences on the page that make a claim about your studio. Edit freely.
  copy: {
    heroIntro: 'Small batches, early mornings and evenings, teachers who correct your posture. Your first class is free.',
    heroPrimaryButton: 'Book a free trial',
    aboutHeading: 'A neighbourhood studio, not a gym',
    aboutParagraphs: [
      'Viral Yoga started in 2016 with one room in Anjar and eight students. Today we run classes at two studios, in Anjar and Adipur, for people of every age and every level of fitness.',
      'We teach classical Hatha yoga the way it is meant to be taught: slowly, with attention to your body, and with a teacher who walks the room and corrects you. Batches stay small so nobody is ignored.',
      'Classes are in Gujarati, Hindi and English, whatever the room needs.',
    ],
    aboutImageCaption: 'Morning batch, Anjar studio.',
    classesIntro: 'Every class is taught in person at both studios. If you are new, start with the beginners course or any Hatha class and tell the teacher it is your first time.',
    scheduleIntro: 'Walk in for any class. No booking needed for regular batches.',
    locationsIntro: 'Your membership works at both. Come to whichever is closer that day.',
    contactHeading: 'Book a free trial class',
    contactIntro: 'Tell us which studio and which time suits you. We reply the same day, usually within an hour during studio hours.',
  },

  // --- Testimonials -----------------------------------------------------------
  // PLACEHOLDERS. These people and quotes are invented. Replace with real
  // student feedback (with their permission) or set to [] to hide the section.
  testimonials: [
    {
      quote: 'I started at 52 with a stiff back and no confidence. A year later I can sit on the floor with my grandchildren again.',
      name: 'Hansaben P.',
      detail: 'Anjar, Yoga for seniors',
    },
    {
      quote: 'The 6 am batch before work has become the best part of my day. The teachers actually correct your posture.',
      name: 'Rohan M.',
      detail: 'Adipur, Hatha Yoga',
    },
    {
      quote: 'My blood pressure readings improved after three months of pranayama. My doctor asked what changed.',
      name: 'Jayesh S.',
      detail: 'Anjar, Pranayama & meditation',
    },
    {
      quote: 'I joined the beginners course with zero flexibility and a lot of doubt. Four weeks later I look forward to every class.',
      name: 'Priya D.',
      detail: 'Adipur, Beginners course',
    },
    {
      quote: 'Power yoga at 6:30 pm is my stress release after the shop closes. Same batch, same people, two years now.',
      name: 'Mahesh K.',
      detail: 'Adipur, Power yoga',
    },
    {
      quote: 'After my knee surgery the therapeutic sessions got me walking without pain. Slow, careful, and never pushed.',
      name: 'Kalpana B.',
      detail: 'Anjar, Therapeutic yoga',
    },
  ],

  // --- Your teacher and their achievements --------------------------------------
  // PLACEHOLDERS. The name, the photo and every line below are invented.
  // Replace them with the real teacher's details. Set `achievements: []` to hide
  // the whole section until you are ready.
  instructor: {
    name: 'Viralbhai Thakkar',
    role: 'Founder and head teacher',
    image: '/images/instructor.svg',
    imageAlt: 'Portrait of the head teacher at the Anjar studio',
    bio: [
      'Viralbhai has taught yoga in Kutch since 2016, first in a single room in Anjar and now at both studios. He teaches classical Hatha yoga, pranayama, and therapeutic sessions for students recovering from injury.',
      'He trains every teacher at Viral Yoga himself, and still takes the 6 am batch most mornings.',
    ],
    // Newest first. Leave `year` empty for anything without a date, and `detail`
    // empty when the title says enough on its own.
    achievements: [
      { year: '2024', title: 'Judge, Gujarat State Yoga Championship', detail: 'Invited by the state yoga association for the senior category.' },
      { year: '2023', title: 'Led the International Day of Yoga demonstration, Anjar', detail: 'Over 600 participants at the municipal ground.' },
      { year: '2022', title: 'Level 2 Yoga Teacher certification, Yoga Certification Board', detail: 'Ministry of Ayush, Government of India.' },
      { year: '2021', title: 'RYT 500, Yoga Alliance', detail: '' },
      { year: '2019', title: 'Gold medal, Gujarat State Yoga Championship', detail: 'Traditional yoga, open category.' },
      { year: '2018', title: 'Diploma in Yoga Therapy', detail: 'One-year course, with a focus on back and knee rehabilitation.' },
      { year: '2016', title: 'Founded Viral Yoga in Anjar', detail: 'Eight students in the first batch.' },
      { year: '', title: 'Taught more than 2,000 students across both studios', detail: '' },
    ] as Achievement[],
  },
};

export const DAY_ORDER: Session['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_NAMES: Record<Session['day'], string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};
