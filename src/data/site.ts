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

export type Benefit = {
  title: string;           // the outcome, in the student's words
  body: string;            // two sentences at most
};

export type Faq = {
  q: string;
  a: string;               // plain sentences; no HTML
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
  url: 'https://viral-yoga-website.supabase-root.workers.dev',
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
  // 'supabase' -> the enquiry goes straight to the admin page. Works on any host.
  //               This is the one to use; the other two are only fallbacks for a
  //               host-provided form service.
  // 'netlify'  -> also posts to Netlify Forms. Only works when hosted on Netlify.
  // 'formspree'-> posts to Formspree instead. Paste your endpoint below.
  formProvider: 'supabase' as 'supabase' | 'netlify' | 'formspree',
  formspreeEndpoint: 'https://formspree.io/f/YOUR_FORM_ID',

  // --- Backend ------------------------------------------------------------------
  // The Supabase project. Both values are public by design: the publishable key
  // can only do what the database's row-level security allows, which is why it is
  // safe in the browser and safe here. Environment variables of the same name
  // override these, which is how a different project is used for testing.
  supabaseUrl: 'https://sodtpweedjcvnvuomyzc.supabase.co',
  supabasePublishableKey: 'sb_publishable_MSDuW3g4WWG_T3GuHCor5g_Hg3MHSMM',

  // --- Images -------------------------------------------------------------------
  // Put your photos in /public/images and update the paths here.
  heroImage: '/images/hero.svg',
  // Picture shown when the link is shared on WhatsApp, Facebook or LinkedIn.
  // MUST be a JPG or PNG: none of them will render an SVG, so while this is
  // empty and the hero is still a placeholder drawing, shared links show a
  // blank card. Setting a real hero photo (a JPG) fixes it on its own.
  ogImage: '',
  // Square logo shown in the header instead of the lotus mark. PNG or SVG.
  logo: '',
  // Browser tab icon. Any image the browser can show.
  favicon: '/favicon.svg',
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
      description: 'Breathing practices and guided sitting. Students come to these for stress and sleep.',
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
  // --- Legal pages ---------------------------------------------------------------
  // Razorpay's compliance review checks that these exist and match the business.
  // CONFIRM every line of /privacy, /terms and /refunds before submitting KYC.
  legal: {
    entityName: 'Viral Yoga',   // the name the business is registered under
    updated: '8 September 2026',
    // Days after purchase in which a refund can be asked for. Your policy, your call.
    refundWindowDays: 7,
    // Working days for the money to reach the payer once a refund is approved.
    refundProcessingDays: '5 to 7',
  },

  // --- Google reviews ----------------------------------------------------------
  // Leave `rating` empty and the whole line stays hidden. Never type a rating you
  // have not earned: copy the real numbers from your Google Business profile.
  google: {
    rating: '',            // e.g. '4.9'
    reviews: '',           // e.g. '127'
    url: '',               // link to your Google Business listing
  },

  // Rough size of the studio, shown next to the Google rating. Keep it honest.
  activeMembers: '200+',

  // --- Why people come ----------------------------------------------------------
  // Written as what a student wants, not as the name of a class. A beginner does
  // not know what Hatha means; they know their back hurts.
  // CHECK THESE CLAIMS before launch. Say nothing about curing or treating illness.
  benefits: [
    {
      title: 'A back that stops complaining',
      body: 'Most people arrive stiff from sitting all day, or sore in the neck and knees. We work slowly, and a teacher walks the room and corrects you rather than leaving you to copy a screen.',
    },
    {
      title: 'Sleep, and a quieter head',
      body: 'Every class ends with breathing practice. It is the part students mention most often when they tell us what changed after a few weeks.',
    },
    {
      title: 'Strength that lasts into old age',
      body: 'Getting up off the floor without your hands, carrying your own bags, touching your toes again. Our batches run from teenagers to people in their seventies.',
    },
  ] as Benefit[],

  // --- Questions people actually ask --------------------------------------------
  // CONFIRM EVERY ANSWER BELOW before launch. They describe studio policy, and
  // the answers here are sensible guesses, not your rules.
  faqs: [
    {
      q: 'Do I need to book, or can I just walk in?',
      a: 'Walk in for any regular class. There is no booking. Come ten minutes early the first time so the teacher can ask about any injuries.',
    },
    {
      q: 'I have never done yoga. Which class should I start with?',
      a: 'Any Hatha class, or the beginners course if one is running. Tell the teacher it is your first time and they will keep an eye on you throughout.',
    },
    {
      q: 'I am over sixty, or I have a knee or back problem. Can I still join?',
      a: 'Yes. Tell the teacher before class what hurts. Postures get adapted for you, and nobody is pushed. We have students in their seventies.',
    },
    {
      q: 'What should I wear and bring?',
      a: 'Loose clothes you can bend in, and a bottle of water. Come on a fairly empty stomach, so nothing heavy for two hours before class.',
    },
    {
      q: 'Do I need to bring a mat?',
      a: 'Bring your own if you have one. If not, tell us when you arrive.',
    },
    {
      q: 'Is there a separate batch for women?',
      a: 'Ask us on WhatsApp for the current timings, and we will tell you which batches suit you.',
    },
    {
      q: 'Does my membership work at both studios?',
      a: 'Yes. One membership covers Anjar and Adipur. Come to whichever is closer that day.',
    },
    {
      q: 'Can I pause my membership if I travel?',
      a: 'Talk to us before you go and we will work something out.',
    },
    {
      q: 'How do I pay?',
      a: 'Cash or UPI at the studio, or UPI from the pricing section of this website. Send us the screenshot on WhatsApp and we will add it to your membership.',
    },
    {
      q: 'What happens if I miss classes?',
      a: 'Nothing. Come back when you can. Memberships run by date rather than by class count, so a missed week does not need making up.',
    },
  ] as Faq[],

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
    benefitsHeading: 'Why people come to us',
    benefitsCta: 'Your first class is free. Come and see.',
    faqHeading: 'Questions people ask',
    faqIntro: 'Anything not answered here, send us a message on WhatsApp. We reply the same day.',
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
      age: '53',
      since: 'Member for 1 year',
      detail: 'Anjar, Yoga for seniors',
    },
    {
      quote: 'The 6 am batch before work has become the best part of my day. The teachers actually correct your posture.',
      name: 'Rohan M.',
      age: '31',
      since: 'Member for 2 years',
      detail: 'Adipur, Hatha Yoga',
    },
    {
      quote: 'After three months of daily breathing practice I sleep through the night again, which I had given up on.',
      name: 'Jayesh S.',
      age: '46',
      since: 'Member for 8 months',
      detail: 'Anjar, Pranayama & meditation',
    },
    {
      quote: 'I joined the beginners course with zero flexibility and a lot of doubt. Four weeks later I look forward to every class.',
      name: 'Priya D.',
      age: '24',
      since: 'Member for 4 months',
      detail: 'Adipur, Beginners course',
    },
    {
      quote: 'Power yoga at 6:30 pm is my stress release after the shop closes. Same batch, same people, two years now.',
      name: 'Mahesh K.',
      age: '28',
      since: 'Member for 2 years',
      detail: 'Adipur, Power yoga',
    },
    {
      quote: 'After my knee surgery the therapeutic sessions got me walking without pain. Slow, careful, and never pushed.',
      name: 'Kalpana B.',
      age: '61',
      since: 'Member for 6 months',
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
