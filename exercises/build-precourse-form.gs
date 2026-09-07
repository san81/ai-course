/**
 * Builds the "Before We Meet" pre-course Google Form in one run.
 *
 * HOW TO USE
 * 1. Go to https://script.google.com  →  New project
 * 2. Delete the sample code, paste this whole file, click Save
 * 3. Click Run. Google will ask you to authorize the script (it only creates a form
 *    in your own Drive). Approve it.
 * 4. When it finishes, open View → Logs (or the Execution log) to get the
 *    EDIT link and the SHARE link to send to students.
 *
 * Safe to run more than once — each run creates a brand-new form.
 */
function buildPreCourseForm() {
  const form = FormApp.create('Before We Meet — AI Course Pre-Course Form');

  form.setDescription(
    'Welcome to the AI course! Fill this in before our first class (takes ~5 minutes). ' +
    'Some answers will be used anonymously for fun games in Week 1 — your name will never ' +
    'be shown. Be honest, be yourself!'
  );
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    'Thank you! See you in Week 1 — and watch out for the easter egg question. 🥚'
  );

  // ---------- Section 1: About you (feeds the "Guess Who?" game) ----------
  form.addPageBreakItem()
    .setTitle('About you')
    .setHelpText('A few of these will appear anonymously on screen in Week 1. Your name stays private.');

  form.addTextItem()
    .setTitle('Your name')
    .setHelpText('Never shown in class — only the instructor sees this.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Your program / field of study')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Your hobbies or interests outside academics')
    .setHelpText('Anything you enjoy — cricket, cooking, music, trekking, gaming, volunteering...')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('Your dream project')
    .setHelpText('If time, money, and skills were no object, what would you build or study? 1–2 sentences.')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Your tech hero — and 3 to 5 words on why')
    .setHelpText('Anyone in science or technology you admire. E.g. "APJ Abdul Kalam — dreamed for a nation".')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('One surprising fact about you that nobody in this class would guess')
    .setRequired(true);

  // ---------- Section 2: The game (feeds "Human or AI?") ----------
  form.addPageBreakItem()
    .setTitle('One fun question')
    .setHelpText('Your answer will compete against an AI\'s answer in Week 1. Write it the way only you would!');

  form.addParagraphTextItem()
    .setTitle('Describe your perfect Saturday in exactly one sentence')
    .setHelpText('Be yourself — the class will try to guess which answers are human and which are AI.')
    .setRequired(true);

  // ---------- Section 3: Calibration (tunes course depth; not shared) ----------
  form.addPageBreakItem()
    .setTitle('So I can pitch the course at the right level')
    .setHelpText('These answers are private and are used only to tune the material. There is no wrong answer.');

  form.addMultipleChoiceItem()
    .setTitle('How comfortable are you with programming?')
    .setChoiceValues([
      'Never coded',
      'A little (a course or two)',
      'Comfortable',
      'I code regularly'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('How often do you use AI tools (ChatGPT, Claude, Gemini, Copilot...)?')
    .setChoiceValues([
      'Never',
      'Tried a few times',
      'Weekly',
      'Daily'
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('What do you most want from this course?')
    .setHelpText('Choose up to 2.')
    .setChoiceValues([
      'Understand how AI actually works',
      'Use AI better in my studies and work',
      'Build AI-powered projects',
      'Understand AI\'s impact on society',
      'Career preparation'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('One task in YOUR field you wish AI could do for you')
    .setHelpText('These become real examples and analogies in later classes.')
    .setRequired(true);

  // ---------- Done ----------
  const editUrl = form.getEditUrl();
  const shareUrl = form.getPublishedUrl();

  Logger.log('======================================');
  Logger.log('FORM CREATED');
  Logger.log('Edit it here:      ' + editUrl);
  Logger.log('Send students:     ' + shareUrl);
  Logger.log('======================================');

  return { editUrl: editUrl, shareUrl: shareUrl };
}
