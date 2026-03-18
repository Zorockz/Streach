export type BodyArea = 'neck' | 'shoulders' | 'back' | 'wrists' | 'hips' | 'full';

export type StretchDifficulty = 'easy' | 'medium';

export interface Stretch {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  bodyArea: BodyArea[];
  durationSeconds: number;
  difficulty: StretchDifficulty;
  icon: string;
  breathingCue: string;
  tip?: string;
}


export const BODY_AREAS: { id: BodyArea; label: string; icon: string; description: string }[] = [
  { id: 'neck', label: 'Neck', icon: 'person-outline', description: 'Relieve neck tension' },
  { id: 'shoulders', label: 'Shoulders', icon: 'body-outline', description: 'Release shoulder strain' },
  { id: 'back', label: 'Back', icon: 'fitness-outline', description: 'Ease back stiffness' },
  { id: 'wrists', label: 'Wrists', icon: 'hand-left-outline', description: 'Reduce wrist fatigue' },
  { id: 'hips', label: 'Hips', icon: 'walk-outline', description: 'Open up hip flexors' },
  { id: 'full', label: 'Full Body', icon: 'pulse-outline', description: 'Total body reset' },
];

export const STRETCHES: Stretch[] = [
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
    icon: 'refresh-outline',
    breathingCue: 'Breathe deeply and slowly with each movement',
  },
  {
    id: 'chin-tuck',
    name: 'Chin Tuck',
    description: 'Counteract forward head posture from screen time',
    instructions: [
      'Sit tall with your back straight',
      'Look straight ahead at eye level',
      'Gently pull your chin straight back',
      'You should feel a light stretch at the base of your skull',
      'Hold for 3 counts, then relax',
      'Repeat this movement slowly',
    ],
    bodyArea: ['neck'],
    durationSeconds: 25,
    difficulty: 'easy',
    icon: 'arrow-back-outline',
    breathingCue: 'Exhale as you tuck your chin',
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    description: 'Release shoulder tension with smooth rolling motion',
    instructions: [
      'Stand or sit with arms hanging relaxed',
      'Slowly roll both shoulders forward in large circles',
      'Make the circles as big as comfortable',
      'After 3 rotations, reverse direction',
      'Roll shoulders backward with the same slow pace',
      'Feel each muscle as it moves',
    ],
    bodyArea: ['shoulders'],
    durationSeconds: 30,
    difficulty: 'easy',
    icon: 'sync-outline',
    breathingCue: 'Inhale as shoulders rise, exhale as they fall',
  },
  {
    id: 'cross-body-shoulder',
    name: 'Cross-Body Shoulder Stretch',
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
    icon: 'swap-horizontal-outline',
    breathingCue: 'Take slow, even breaths throughout the stretch',
  },
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    description: 'Mobilize and energize the entire spine',
    instructions: [
      'Come to hands and knees (or sit on the edge of your chair)',
      'Inhale deeply — arch your back, lift your head and tailbone (Cow)',
      'Exhale completely — round your back, tuck your chin and pelvis (Cat)',
      'Move slowly, letting breath guide each movement',
      'Repeat this flow, making each wave bigger than the last',
    ],
    bodyArea: ['back'],
    durationSeconds: 35,
    difficulty: 'easy',
    icon: 'trending-up-outline',
    breathingCue: 'Breathe drives the movement — inhale to arch, exhale to round',
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
    icon: 'repeat-outline',
    breathingCue: 'Exhale to twist deeper, inhale to lengthen',
  },
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
      'Feel the full range of motion in each direction',
    ],
    bodyArea: ['wrists'],
    durationSeconds: 25,
    difficulty: 'easy',
    icon: 'radio-button-on-outline',
    breathingCue: 'Breathe normally and keep your shoulders relaxed',
  },
  {
    id: 'prayer-stretch',
    name: 'Prayer Stretch',
    description: 'Deeply stretch wrist flexors and forearms',
    instructions: [
      'Press palms together in front of your chest (prayer position)',
      'Slowly lower your hands toward your waist',
      'Keep palms together as long as possible',
      'You should feel a stretch along the inner forearms and wrists',
      'Hold at the most comfortable point for 10 counts',
      'Slowly raise hands back up to start',
    ],
    bodyArea: ['wrists'],
    durationSeconds: 30,
    difficulty: 'easy',
    icon: 'hand-left-outline',
    breathingCue: 'Breathe deeply throughout the stretch',
  },
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
    icon: 'walk-outline',
    breathingCue: 'Breathe into the stretch on each exhale',
  },
  {
    id: 'figure-four',
    name: 'Figure Four Stretch',
    description: 'Release tight hip rotators and glutes',
    instructions: [
      'Sit in your chair with both feet flat on the floor',
      'Cross your right ankle over your left knee',
      'Flex your right foot to protect your knee',
      'Gently press down on your right knee with your right hand',
      'Lean slightly forward for a deeper stretch',
      'Hold for 20 counts, feeling the stretch in your right hip',
    ],
    bodyArea: ['hips'],
    durationSeconds: 45,
    difficulty: 'easy',
    icon: 'git-network-outline',
    breathingCue: 'Slow, deep breaths help relax the hip muscles',
  },
  {
    id: 'full-body-reach',
    name: 'Full Body Reach',
    description: 'Wake up your entire body with an energizing stretch',
    instructions: [
      'Stand with feet hip-width apart',
      'Interlace your fingers and flip palms to face upward',
      'Inhale and reach your arms overhead as high as you can',
      'Rise onto your toes for a full body stretch',
      'Hold for 3 counts at the top, feeling the length',
      'Exhale and slowly lower back down',
    ],
    bodyArea: ['full', 'shoulders', 'back'],
    durationSeconds: 30,
    difficulty: 'easy',
    icon: 'arrow-up-outline',
    breathingCue: 'Inhale to reach up, exhale to release',
  },
  {
    id: 'standing-side-bend',
    name: 'Standing Side Bend',
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
    icon: 'code-outline',
    breathingCue: 'Breathe into the stretching side of your ribcage',
  },
];

export const DISTRACTING_APPS = [
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { id: 'twitter', name: 'X / Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', color: '#FF4500' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00' },
  { id: 'pinterest', name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023' },
  { id: 'discord', name: 'Discord', icon: 'logo-discord', color: '#5865F2' },
  { id: 'twitch', name: 'Twitch', icon: 'logo-twitch', color: '#9146FF' },
];

export function getStretchesForAreas(areas: BodyArea[]): Stretch[] {
  if (areas.length === 0) return STRETCHES;
  return STRETCHES.filter(s => s.bodyArea.some(a => areas.includes(a) || a === 'full'));
}

export function getRandomStretch(areas: BodyArea[] = []): Stretch {
  const pool = getStretchesForAreas(areas);
  return pool[Math.floor(Math.random() * pool.length)];
}
