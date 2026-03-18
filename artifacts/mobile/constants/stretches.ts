export type BodyArea = 'neck' | 'shoulders' | 'back' | 'wrists' | 'hips' | 'full';
export type StretchDifficulty = 'easy' | 'medium' | 'hard';

export interface StretchCategory {
  id: BodyArea;
  label: string;
  description: string;
  icon: string;      // Ionicons name (used in UI chips, nav)
  mciIcon: string;   // MaterialCommunityIcons name (used for body-pose icons)
  color: string;
  bgColor: string;
}

export interface Stretch {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  bodyArea: BodyArea[];
  durationSeconds: number;
  difficulty: StretchDifficulty;
  mciIcon: string;   // MaterialCommunityIcons pose icon
  breathingCue: string;
  tip?: string;
}

export const STRETCH_CATEGORIES: StretchCategory[] = [
  {
    id: 'neck',
    label: 'Neck & Head',
    description: 'Relieve tension from screen time',
    icon: 'person-outline',
    mciIcon: 'head-dots-horizontal-outline',
    color: '#4A90A4',
    bgColor: 'rgba(74, 144, 164, 0.12)',
  },
  {
    id: 'shoulders',
    label: 'Shoulders & Arms',
    description: 'Release shoulder strain',
    icon: 'body-outline',
    mciIcon: 'arm-flex-outline',
    color: '#7B68B0',
    bgColor: 'rgba(123, 104, 176, 0.12)',
  },
  {
    id: 'back',
    label: 'Back & Spine',
    description: 'Decompress and realign',
    icon: 'fitness-outline',
    mciIcon: 'yoga',
    color: '#3A7A5C',
    bgColor: 'rgba(58, 122, 92, 0.12)',
  },
  {
    id: 'wrists',
    label: 'Wrists & Hands',
    description: 'Undo phone-induced stiffness',
    icon: 'hand-left-outline',
    mciIcon: 'hand-wave-outline',
    color: '#D4874A',
    bgColor: 'rgba(212, 135, 74, 0.12)',
  },
  {
    id: 'hips',
    label: 'Hips & Legs',
    description: 'Counter sitting all day',
    icon: 'walk-outline',
    mciIcon: 'human-handsup',
    color: '#B05A6A',
    bgColor: 'rgba(176, 90, 106, 0.12)',
  },
  {
    id: 'full',
    label: 'Full Body',
    description: 'Complete reset from head to toe',
    icon: 'pulse-outline',
    mciIcon: 'human-greeting-variant',
    color: '#5D8A38',
    bgColor: 'rgba(93, 138, 56, 0.12)',
  },
];

export const BODY_AREAS = STRETCH_CATEGORIES.map(c => ({
  id: c.id,
  label: c.label.split(' ')[0],
  icon: c.icon,
  mciIcon: c.mciIcon,
  description: c.description,
}));

export const STRETCHES: Stretch[] = [
  // — NECK & HEAD —
  {
    id: 'neck-roll',
    name: 'Neck Roll',
    description: 'Gently release neck tension with slow circular movements',
    instructions: [
      'Sit or stand tall with shoulders relaxed',
      'Slowly drop your right ear toward your right shoulder',
      'Hold for 2 counts, feeling the stretch on the left side',
      'Slowly roll your chin toward your chest',
      'Continue to the left side, ear toward left shoulder',
      'Complete the circle slowly and smoothly',
    ],
    bodyArea: ['neck'],
    durationSeconds: 30,
    difficulty: 'easy',
    mciIcon: 'rotate-3d-variant',
    breathingCue: 'Breathe deeply and slowly with each movement',
    tip: 'Keep the movement slow — rushing causes strain. Half circles are fine if full rolls feel uncomfortable.',
  },
  {
    id: 'chin-tuck',
    name: 'Chin Tuck',
    description: 'Counteract forward head posture from screen time',
    instructions: [
      'Sit tall with your back straight',
      'Look straight ahead at eye level',
      'Gently pull your chin straight back (not down)',
      'You should feel a light stretch at the base of your skull',
      'Hold for 3 counts, then slowly return',
      'Repeat 5–6 times',
    ],
    bodyArea: ['neck'],
    durationSeconds: 25,
    difficulty: 'easy',
    mciIcon: 'head-dots-horizontal',
    breathingCue: 'Exhale as you tuck your chin',
    tip: 'Imagine you are making a "double chin" — that is exactly the right movement.',
  },
  {
    id: 'lateral-neck',
    name: 'Lateral Neck Tilt',
    description: 'A simple side stretch to release neck tension',
    instructions: [
      'Sit tall, looking straight ahead',
      'Slowly tilt your right ear toward your right shoulder',
      'You may gently place your right hand on your left temple for a deeper stretch',
      'Hold 10–15 counts, breathing steadily',
      'Slowly return to center and switch sides',
    ],
    bodyArea: ['neck'],
    durationSeconds: 30,
    difficulty: 'easy',
    mciIcon: 'human-greeting',
    breathingCue: 'Breathe into the left side of your neck as you tilt right',
    tip: 'Never pull — let gravity and gentle hand weight do the work.',
  },

  // — SHOULDERS & ARMS —
  {
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    description: 'Release shoulder tension with smooth rolling motion',
    instructions: [
      'Stand or sit with arms hanging relaxed',
      'Slowly roll both shoulders forward in large circles',
      'Make the circles as big as comfortable',
      'After 5 rotations, reverse direction',
      'Roll shoulders backward with the same slow pace',
    ],
    bodyArea: ['shoulders'],
    durationSeconds: 30,
    difficulty: 'easy',
    mciIcon: 'arm-flex-outline',
    breathingCue: 'Inhale as shoulders rise, exhale as they fall',
    tip: 'Exaggerate the movement — most people roll too small.',
  },
  {
    id: 'cross-body-shoulder',
    name: 'Cross-Body Stretch',
    description: 'Deep stretch for the back of the shoulder',
    instructions: [
      'Bring your right arm across your chest at shoulder height',
      'Use your left hand to gently press the right arm closer to your body',
      'Hold and feel the stretch in the back of your right shoulder',
      'Keep both shoulders down and relaxed',
      'Hold for 15 counts, then switch sides',
    ],
    bodyArea: ['shoulders'],
    durationSeconds: 35,
    difficulty: 'easy',
    mciIcon: 'arm-flex',
    breathingCue: 'Take slow, even breaths throughout the stretch',
    tip: 'Keep the arm at shoulder height — too high or low misses the target muscle.',
  },
  {
    id: 'overhead-tricep',
    name: 'Overhead Tricep Stretch',
    description: 'Lengthen the back of the arm and shoulder',
    instructions: [
      'Raise your right arm straight overhead',
      'Bend the elbow, letting your right hand fall behind your head',
      'Use your left hand to gently press the right elbow further back',
      'Feel the stretch along the back of your upper arm',
      'Hold 15 counts, then switch sides',
    ],
    bodyArea: ['shoulders'],
    durationSeconds: 35,
    difficulty: 'easy',
    mciIcon: 'human-handsup',
    breathingCue: 'Breathe into your ribcage as you stretch upward',
    tip: 'Let the elbow point straight up — a drooping elbow reduces the stretch.',
  },

  // — BACK & SPINE —
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    description: 'Mobilize and energize the entire spine',
    instructions: [
      'Sit on the edge of your chair, hands on knees',
      'Inhale deeply — arch your back, lift your chest and tailbone (Cow)',
      'Exhale completely — round your back, tuck your chin and pelvis (Cat)',
      'Move slowly, letting breath guide each movement',
      'Repeat this flow 5–6 times, making each wave bigger',
    ],
    bodyArea: ['back'],
    durationSeconds: 35,
    difficulty: 'easy',
    mciIcon: 'yoga',
    breathingCue: 'Inhale to arch, exhale to round — breath drives the movement',
    tip: 'If on a chair, grip your knees and push your chest forward for the Cow pose.',
  },
  {
    id: 'seated-twist',
    name: 'Seated Spinal Twist',
    description: 'Decompress the spine with a gentle rotation',
    instructions: [
      'Sit tall on the edge of your chair',
      'Place your right hand on your left knee',
      'Place your left hand behind you on the seat',
      'Gently twist to the left on an exhale',
      'Look over your left shoulder if comfortable',
      'Hold for 5 counts, then unwind and switch sides',
    ],
    bodyArea: ['back'],
    durationSeconds: 40,
    difficulty: 'easy',
    mciIcon: 'seat-recline-normal',
    breathingCue: 'Exhale to twist deeper, inhale to grow taller',
    tip: 'Twist from the waist — not from the neck. Lead with your ribcage.',
  },
  {
    id: 'thoracic-opener',
    name: 'Thoracic Opener',
    description: 'Open the mid-back and chest after hunching over a phone',
    instructions: [
      'Sit in a chair and interlace your fingers behind your head',
      'Gently arch your upper back over the top of the chair',
      'Let your head fall back naturally — support it with your hands',
      'Breathe into your chest as it opens toward the ceiling',
      'Hold for 5–8 breaths, feeling your thoracic spine extend',
    ],
    bodyArea: ['back', 'shoulders'],
    durationSeconds: 40,
    difficulty: 'easy',
    mciIcon: 'human-greeting-variant',
    breathingCue: 'Each inhale expands and opens your chest further',
    tip: 'This is a relief — not a crunch. Do not force it. Let gravity do the work.',
  },

  // — WRISTS & HANDS —
  {
    id: 'wrist-circles',
    name: 'Wrist Circles',
    description: 'Restore wrist mobility after phone/computer use',
    instructions: [
      'Extend both arms in front of you at shoulder height',
      'Make loose fists or spread your fingers wide',
      'Slowly rotate both wrists in large circles',
      'Make 5 circles clockwise',
      'Then 5 circles counterclockwise',
    ],
    bodyArea: ['wrists'],
    durationSeconds: 25,
    difficulty: 'easy',
    mciIcon: 'hand-pointing-up',
    breathingCue: 'Breathe normally and keep your shoulders relaxed',
    tip: 'Make the circles as large as possible for full range-of-motion benefit.',
  },
  {
    id: 'prayer-stretch',
    name: 'Prayer Stretch',
    description: 'Deeply stretch wrist flexors and forearms',
    instructions: [
      'Press palms together in front of your chest',
      'Slowly lower your hands toward your waist',
      'Keep palms together as long as possible',
      'Feel the stretch along the inner forearms and wrists',
      'Hold at the most comfortable point for 10 counts',
      'Slowly raise hands back to start',
    ],
    bodyArea: ['wrists'],
    durationSeconds: 30,
    difficulty: 'easy',
    mciIcon: 'hand-okay',
    breathingCue: 'Breathe deeply throughout the stretch',
    tip: 'You can also reverse this — fingertips pointing down — to stretch the opposite side.',
  },
  {
    id: 'finger-spread',
    name: 'Finger Fans',
    description: 'Release tension in fingers and palms from scrolling',
    instructions: [
      'Hold both hands in front of you at chest height',
      'Slowly spread all 10 fingers as wide as possible',
      'Hold the spread for 3 counts',
      'Then make a gentle fist',
      'Hold the fist for 3 counts',
      'Repeat the fan-fist cycle 5–6 times',
    ],
    bodyArea: ['wrists'],
    durationSeconds: 25,
    difficulty: 'easy',
    mciIcon: 'hand-wave',
    breathingCue: 'Inhale as you fan, exhale as you close',
    tip: 'You can do this during phone calls or meetings — no one will notice.',
  },

  // — HIPS & LEGS —
  {
    id: 'hip-flexor',
    name: 'Standing Hip Flexor',
    description: 'Counter the effects of prolonged sitting',
    instructions: [
      'Stand tall and take a step forward with your right foot',
      'Lower your left knee toward the floor (lunge position)',
      'Keep your torso upright and core gently engaged',
      'Gently push your left hip forward to deepen the stretch',
      'Feel the stretch along the front of your left hip',
      'Hold for 15 counts, then switch sides',
    ],
    bodyArea: ['hips'],
    durationSeconds: 40,
    difficulty: 'medium',
    mciIcon: 'walk',
    breathingCue: 'Breathe into the stretch on each exhale',
    tip: 'Keep your front knee over your ankle — not pushed past your toes.',
  },
  {
    id: 'figure-four',
    name: 'Figure Four',
    description: 'Release tight hip rotators and glutes',
    instructions: [
      'Sit in your chair with both feet flat on the floor',
      'Cross your right ankle over your left knee',
      'Flex your right foot to protect your knee',
      'Gently press down on your right knee with your right hand',
      'Lean slightly forward for a deeper stretch',
      'Hold for 20 counts, then switch sides',
    ],
    bodyArea: ['hips'],
    durationSeconds: 45,
    difficulty: 'easy',
    mciIcon: 'seat-recline-extra',
    breathingCue: 'Slow, deep breaths help relax the hip muscles',
    tip: 'The further you lean forward, the more intense the stretch in your glute.',
  },
  {
    id: 'standing-quad',
    name: 'Standing Quad Stretch',
    description: 'Lengthen the front of the thigh after sitting',
    instructions: [
      'Stand near a wall or chair for balance',
      'Bend your right knee and hold your right ankle behind you',
      'Stand tall and keep both knees close together',
      'Gently pull your heel toward your glute',
      'Feel the stretch along the front of your right thigh',
      'Hold 15 counts, then switch sides',
    ],
    bodyArea: ['hips'],
    durationSeconds: 40,
    difficulty: 'easy',
    mciIcon: 'human-male',
    breathingCue: 'Steady breaths — let your body soften into the stretch',
    tip: 'If balance is difficult, lightly touch a wall. Do not arch your lower back.',
  },

  // — FULL BODY —
  {
    id: 'full-body-reach',
    name: 'Full Body Reach',
    description: 'Wake up your entire body with an energizing stretch',
    instructions: [
      'Stand with feet hip-width apart',
      'Interlace your fingers and flip palms to face upward',
      'Inhale and reach your arms overhead as high as you can',
      'Rise onto your toes for a full-body stretch',
      'Hold for 3 counts at the top',
      'Exhale and slowly lower back down',
    ],
    bodyArea: ['full', 'shoulders', 'back'],
    durationSeconds: 30,
    difficulty: 'easy',
    mciIcon: 'human-handsup',
    breathingCue: 'Inhale to reach up, exhale to release',
    tip: 'Do this 3–4 times for maximum effect. Great first thing in the morning.',
  },
  {
    id: 'standing-side-bend',
    name: 'Side Bend',
    description: 'Stretch the sides of your body and open the ribcage',
    instructions: [
      'Stand with feet together, arms at your sides',
      'Inhale and raise your right arm overhead',
      'Exhale and gently lean to the left, making a long arc',
      'Keep both feet grounded and hips level',
      'Feel the stretch along your entire right side',
      'Hold for 3 breaths, then switch sides',
    ],
    bodyArea: ['full', 'back'],
    durationSeconds: 35,
    difficulty: 'easy',
    mciIcon: 'human-male-height',
    breathingCue: 'Breathe into the stretching side of your ribcage',
    tip: 'Reach long through the fingertips — the length creates the stretch.',
  },
  {
    id: 'standing-forward-fold',
    name: 'Forward Fold',
    description: 'Release tension in the entire back of the body',
    instructions: [
      'Stand with feet hip-width apart, knees slightly soft',
      'Slowly hinge at the hips and fold forward',
      'Let your head, neck, and arms hang heavy',
      'Sway gently side to side if it feels good',
      'Stay here for 5 slow breaths',
      'Slowly roll back up, vertebra by vertebra',
    ],
    bodyArea: ['full', 'back', 'hips'],
    durationSeconds: 40,
    difficulty: 'easy',
    mciIcon: 'yoga',
    breathingCue: 'Each exhale lets you soften and release a little more',
    tip: 'Do not try to touch the floor. Just let everything hang — that is enough.',
  },
];

export const DISTRACTING_APPS = [
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#010101' },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { id: 'twitter', name: 'X / Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', color: '#FF4500' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFCA00' },
  { id: 'pinterest', name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023' },
  { id: 'discord', name: 'Discord', icon: 'logo-discord', color: '#5865F2' },
  { id: 'twitch', name: 'Twitch', icon: 'logo-twitch', color: '#9146FF' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { id: 'news', name: 'News & feeds', icon: 'newspaper-outline', color: '#34495E' },
];

export function getStretchesForAreas(areas: BodyArea[]): Stretch[] {
  if (areas.length === 0) return STRETCHES;
  return STRETCHES.filter(s => s.bodyArea.some(a => areas.includes(a) || a === 'full'));
}

export function getRandomStretch(areas: BodyArea[] = []): Stretch {
  const pool = getStretchesForAreas(areas);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getStretchesByCategory(): { category: StretchCategory; stretches: Stretch[] }[] {
  return STRETCH_CATEGORIES.map(cat => ({
    category: cat,
    stretches: STRETCHES.filter(s => s.bodyArea.includes(cat.id)),
  })).filter(g => g.stretches.length > 0);
}
