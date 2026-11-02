// Section 9 · the application questionnaire. Round 2 (Hayden 10/30): no auto-advance (a tap only picks, Continue moves on),
// each new question "scans in" with the Aceternity Image Generation Loader band (one pass), the Plan step says plainly that
// nothing is bought here, Main goal = five examples + Other, typed fields use the Skiper UI smooth caret, Submit Application.
// mountApply(host, opts) → { el, stepper, setPlan(name), reveal(), data(), destroy() }   opts: { onSubmit(answers) }
// Gadgets (all ported, js/vendor/): React Bits Stepper (one question per step, the gliding step tile), Aceternity Image
// Generation Loader (the scan on every step change: down on Continue, up on Back), Skiper UI Smooth caret input (every
// typed field; its free licence needs the visible credit this section prints, see vendor/effects/skiper/…/README.md).
// Words: every question, option, placeholder and the button label are Gage's own, verbatim from the application form on
// his demo (assets/his-demo-2026-10-26.html #applyForm). Main goal's five examples come from his copy (his placeholder's
// three goals; "Stuck … a lift stops moving"; "a lower back, a knee, a shoulder"). The Plan step's reassurance line is ours
// (not his words), as are "How do I get back to you?" and the thank-you, built from his own lines.
// No backend yet: Submit shows the thank-you, logs the answers and fires CustomEvent('apply-submit') on the host. Nothing
// is sent anywhere.
// Round 3 (Hayden 10/30): "do the digital scan to load the next step, don't jump to the next step, then load it." On
// Continue the current step stays exactly where it is and the band sweeps down over it; the next step exists only behind
// the band (above it the new question, below it the old one, untouched), and when the band is gone only the new step is
// left, still. Back is the same pass climbing. A taller step grows the box with the band; a shorter one keeps the old
// height until the band has passed, then glides. Reduced motion: an instant swap.
import { createStepper } from '../../../js/vendor/stepper.js?v=20261030c';
import { createImageGenerationLoader } from '../../../js/vendor/image-generation-loader.js?v=20261030k';
import { createSmoothInput } from '../../../js/vendor/smooth-input.js?v=20261030c';
import { ensureCss, el, lineReveal, reduce } from './common.js?v=20261030e';

const FORM = {
  title: 'Apply for coaching',
  lede: 'Tell me about your goals and your schedule. I read every application myself and get back to you personally.',
  experience: {
    label: 'Training experience',
    options: ['New to training', 'Some experience', 'Experienced lifter', 'Returning after time off']
  },
  plan: {
    label: "Plan you're interested in",
    reassure: "Nothing is bought or charged here. It's just what you're leaning toward; we pick your plan together on your intro call.",
    options: [
      { value: '', name: 'Not sure yet' },
      { value: 'Silver', name: 'Silver', price: '$399/mo' },
      { value: 'Gold', name: 'Gold', price: '$499/mo' },
      { value: 'Platinum', name: 'Platinum', price: '$799/mo' }
    ]
  },
  goal: {
    label: 'Main goal',
    options: ['Build muscle', 'Lose fat', 'Get stronger', 'Break a plateau', 'Train around an injury', 'Other'],
    otherPlaceholder: 'Your main goal, in your words'
  },
  message: { label: 'Schedule, injuries, equipment, questions', placeholder: 'Tell me about your weekly schedule and any injuries or limitations.' },
  contact: { ask: 'How do I get back to you?', name: 'Full name', email: 'Email', phone: 'Phone' },
  submit: 'Submit Application',
  note: 'Your application comes straight to me. No mailing lists.',
  credit: { text: 'Text-field caret: Skiper UI', href: 'https://skiper-ui.com' }
};
const SCAN_MS = 800;   // one pass of the band (Hayden: "don't have it do a bunch of phases, just one")
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export function mountApply(host, opts = {}) {
  const css = ensureCss();
  const o = { onSubmit: null, ...opts };
  const answers = { experience: null, plan: null, planChosen: false, goal: '', goalChoice: null, message: '', name: '', email: '', phone: '' };
  let submitted = false;

  const root = el('section', 'gs gs-apply');
  root.setAttribute('aria-label', 'Apply for coaching');
  const probe = el('span', 'gs-u-probe');
  probe.setAttribute('aria-hidden', 'true');
  root.appendChild(probe);
  const u = () => (probe.offsetWidth || 1040) / 100;   // layout px per --u

  // ---- left: his words ----
  const left = el('div', 'ap-left');
  // 10/30 (Hayden): the "Coaching application · Read by Gage" line and the "What happens next" steps are gone
  const h = el('h3', 'gs-h', FORM.title);
  const lede = el('p', 'gs-p', FORM.lede);
  const note = el('p', 'ap-note', FORM.note);
  // Skiper UI's free licence: "Attribution to Skiper UI is required when using the free version"
  const credit = el('p', 'gs-credit');
  credit.dataset.credit = 'skiper-ui';
  const creditLink = el('a', '', FORM.credit.text);
  Object.assign(creditLink, { href: FORM.credit.href, target: '_blank', rel: 'noopener' });
  credit.appendChild(creditLink);
  left.append(h, lede, note, credit);

  // ---- the questions ----
  const question = text => el('p', 'ap-q', text);
  // a tap only picks (lit); Continue moves on
  const choiceGroup = (label, options, render, onPick, className = '') => {
    const group = el('div', `ap-opts ${className}`.trim());
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', label);
    const buttons = options.map(option => {
      const b = el('button', 'ap-opt');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.appendChild(el('span', 'ap-mk'));
      render(b, option);
      b.addEventListener('click', () => {
        buttons.forEach(x => x.setAttribute('aria-checked', String(x === b)));
        onPick(option);
        stepper.refresh();
      });
      group.appendChild(b);
      return b;
    });
    return { group, buttons };
  };
  const smooth = (mountIn, opts2) =>
    createSmoothInput(mountIn, { fontSize: 'calc(var(--u) * 2.5)', wrapperClassName: 'ap-smooth', ...opts2 });

  // 1 · Training experience
  const s1 = el('div', 'ap-step');
  const g1 = choiceGroup(FORM.experience.label, FORM.experience.options, (b, option) => b.appendChild(el('span', 'ap-opt-t', option)), option => {
    answers.experience = option;
  });
  s1.append(question(FORM.experience.label), g1.group);

  // 2 · Plan you're interested in (+ nothing is bought here)
  const s2 = el('div', 'ap-step');
  const g2 = choiceGroup(FORM.plan.label, FORM.plan.options, (b, option) => {
    if (option.value) b.dataset.metal = option.value.toLowerCase();
    const t = el('span', 'ap-opt-t');
    t.appendChild(el('span', 'ap-opt-name', option.name));
    if (option.price) t.appendChild(el('span', 'ap-opt-price', option.price));
    b.appendChild(t);
  }, option => {
    answers.plan = option.value;
    answers.planChosen = true;
  });
  const qPlan = el('div', 'ap-qwrap');
  qPlan.append(question(FORM.plan.label), el('p', 'ap-reassure', FORM.plan.reassure));
  s2.append(qPlan, g2.group);

  // 3 · Main goal: five examples + Other (Other opens the typed answer)
  const s3 = el('div', 'ap-step');
  const otherWrap = el('div', 'ap-other');   // unfolds like the Stepper's footer (grid rows 0fr → 1fr on its spring)
  const otherClip = el('div', 'ap-other-clip');
  otherWrap.appendChild(otherClip);
  const otherIn = smooth(otherClip, {
    placeholder: FORM.goal.otherPlaceholder,
    attrs: { name: 'Main goal', autocomplete: 'off', 'aria-label': `${FORM.goal.label} (other)` },
    onChange: () => {
      answers.goal = otherIn.value.trim();
      stepper.refresh();
    }
  });
  const g3 = choiceGroup(FORM.goal.label, FORM.goal.options, (b, option) => b.appendChild(el('span', 'ap-opt-t', option)), option => {
    answers.goalChoice = option;
    const other = option === 'Other';
    otherWrap.classList.toggle('is-open', other);
    otherWrap.inert = !other;   // folded away = out of the tab order too
    answers.goal = other ? otherIn.value.trim() : option;
    if (other && !reduce()) setTimeout(() => otherIn.focus({ preventScroll: true }), 60);
  }, 'ap-opts--3');
  otherWrap.inert = true;
  s3.append(question(FORM.goal.label), g3.group, otherWrap);
  otherIn.input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (valid(3)) stepper.next();
    }
  });

  // 4 · Schedule, injuries, equipment, questions (a textarea with the same caret)
  const s4 = el('div', 'ap-step');
  const notesWrap = el('div', 'ap-notes');
  const notes = smooth(notesWrap, {
    multiline: true,
    rows: 4,
    placeholder: FORM.message.placeholder,
    attrs: { name: 'Message', 'aria-label': FORM.message.label },
    onChange: () => {
      answers.message = notes.value.trim();
    }
  });
  notes.input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      stepper.next();
    }
  });
  s4.append(question(FORM.message.label), notesWrap);

  // 5 · contact
  const s5 = el('div', 'ap-step');
  const fields = el('div', 'ap-fields');
  const field = (label, attrs, full) => {
    const wrap = el('div', `ap-f${full ? ' ap-f--full' : ''}`);
    wrap.appendChild(el('span', 'ap-f-l', label));
    const input = smooth(wrap, { placeholder: '', attrs: { ...attrs, 'aria-label': label }, onChange: syncContact, onBlur: syncContact });
    if (attrs.type) input.input.type = attrs.type;
    fields.appendChild(wrap);
    return input;
  };
  function syncContact() {
    answers.name = name.value.trim();
    answers.email = email.value.trim();
    answers.phone = phone.value.trim();
    email.el.toggleAttribute('data-bad', answers.email.length > 3 && !emailOk(answers.email) && document.activeElement !== email.input);
    stepper.refresh();
  }
  const name = field(FORM.contact.name, { name: 'Name', autocomplete: 'name', required: true }, true);
  // type stays "text" (inputmode email): Chrome gives no selectionStart on type="email", and the caret is placed from it
  const email = field(FORM.contact.email, { name: 'Email', autocomplete: 'email', required: true, inputmode: 'email' });
  const phone = field(FORM.contact.phone, { name: 'Phone', autocomplete: 'tel', type: 'tel', inputmode: 'tel' });
  [name, email, phone].forEach(f => {
    f.input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (valid(5)) stepper.next();
      else (answers.name ? email : name).focus({ preventScroll: true });
    });
  });
  s5.append(question(FORM.contact.ask), fields);

  // the thank-you (the Stepper's completedContent)
  const done = el('div', 'ap-step ap-done');
  const doneMark = el('span', 'ap-done-mark');
  doneMark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 14L8.5 17.5L19 6.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const doneTitle = el('p', 'ap-q', 'Thanks.');
  const doneText = el('p', 'ap-done-p', 'I read every application myself. Next, I email you to set up an intro call.');
  const doneTag = el('span', 'gs-tag', 'Demo · nothing sent');
  done.append(doneMark, doneTitle, doneText, doneTag);

  const valid = step => {
    if (step === 1) return !!answers.experience;
    if (step === 2) return answers.planChosen;
    if (step === 3) return !!answers.goalChoice && (answers.goalChoice !== 'Other' || !!answers.goal);
    if (step === 5) return !!answers.name && emailOk(answers.email);
    return true;
  };

  const right = el('div', 'ap-right');
  root.append(left, right);
  host.appendChild(root);

  // ---- the step change: the Image Generation Loader band scans over the CURRENT step and prints the next one in ----
  // Both steps share the box (the Stepper keeps the old pane, absolutely placed at the top, and adds the new one in flow).
  // The new step sits on top, clipped to what the band has passed; the old one stays under it, whole and still, clipped to
  // what the band hasn't reached; the band runs between them in its own layer over the full height of both. Forward
  // (Continue) the band runs down, Back it climbs. The loader's onFrame gives the band's edge every frame, in the box's px.
  const clampN = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  let scanning = null;
  const stopScan = () => {
    if (!scanning) return;
    const s = scanning;
    scanning = null;
    s.loader.destroy();
    s.layer.remove();
    s.heightHold && (s.viewport.style.height = '');
    s.pane.style.position = '';
    s.pane.style.clipPath = '';
    if (s.leaving) s.leaving.style.clipPath = '';
  };
  const scan = ({ viewport, pane, leaving, from, direction, reduced, spring, finish }) => {
    stopScan();
    // measured here, not taken from the Stepper: an interrupted scan may still have been holding the box's height
    const to = viewport.offsetHeight;
    if (reduced) {
      finish();   // reduced motion: an instant swap
      return;
    }
    const down = direction >= 0;
    // the old step stays exactly where it is, whole (no fade) until the band reaches each line of it
    if (leaving) {
      leaving.getAnimations().forEach(a => a.cancel());
      leaving.style.opacity = '';
      leaving.style.clipPath = 'none';
    }
    // the new step goes on top of it (positioned, later in the box), hidden until the band passes
    pane.style.position = 'relative';
    pane.style.clipPath = down ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)';
    // the box: a taller step grows with the band (the Stepper's own 560 ms spring, done before the band reaches the
    // bottom); a shorter one holds the old height until the band has passed, then glides
    const grow = to > from + 0.5;
    const shrink = to < from - 0.5;
    if (grow) viewport.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 560, easing: spring });
    if (shrink) viewport.style.height = `${from}px`;
    // the band's own layer, over both steps and as tall as the taller one, so it sweeps everything once
    const layer = el('div', 'ap-scan');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = `position:absolute;left:0;right:0;top:0;height:${Math.ceil(Math.max(from, to))}px;pointer-events:none;z-index:2;`;
    viewport.appendChild(layer);
    const k = u();
    const loader = createImageGenerationLoader(layer, {
      once: true,
      direction,
      duration: SCAN_MS,
      colors: ['#5CB2FF', '#0687FF'],
      cellSize: Math.max(2, Math.round(k * 0.5)),
      gap: Math.max(1, Math.round(k * 0.2)),
      bandHeight: Math.round(k * 4.6),
      onFrame: ({ bandTop, bandHeight }) => {
        const bandBottom = bandTop + bandHeight;
        const newH = pane.offsetHeight;
        if (down) {
          // above the band: the new question; below it: the old one
          pane.style.clipPath = `inset(0 0 ${clampN(newH - bandTop, 0, newH)}px 0)`;
          if (leaving) leaving.style.clipPath = `inset(${clampN(bandBottom, 0, leaving.offsetHeight)}px 0 0 0)`;
        } else {
          // climbing: below the band the step you came back to, above it the one you left
          pane.style.clipPath = `inset(${clampN(bandBottom, 0, newH)}px 0 0 0)`;
          if (leaving) leaving.style.clipPath = `inset(0 0 ${clampN(leaving.offsetHeight - bandTop, 0, leaving.offsetHeight)}px 0)`;
        }
      },
      onDone: () => {
        if (scanning?.loader !== loader) return;
        stopScan();
        finish();   // the old step goes; the new one is whole and still
        if (shrink) viewport.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 560, easing: spring });
      }
    });
    scanning = { loader, layer, pane, leaving, viewport, heightHold: shrink };
  };

  const stepper = createStepper(right, {
    steps: [
      { title: 'Level', content: s1 },
      { title: 'Plan', content: s2 },
      { title: 'Goal', content: s3 },
      { title: 'Notes', content: s4 },
      { title: 'Contact', content: s5 }
    ],
    linear: true,
    transition: scan,
    width: 470,   // 94u at --stepper-px .2u: the whole right column, so the five step names fit beside their numbers
    radius: 2,   // near-square, so the site's corner ticks sit on the frame's corners
    accentColor: '#0687FF',
    nextButtonText: 'Continue',
    completeButtonText: FORM.submit,
    completedContent: done,
    nextButtonProps: current => ({ disabled: !valid(current) }),
    style: {
      '--stepper-frame': 'rgba(9, 15, 25, 0.9)',
      '--stepper-frame-edge': 'rgba(92, 178, 255, 0.24)',
      '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.05)',
      '--stepper-frame-shadow': '0 calc(var(--u) * 3) calc(var(--u) * 9) calc(var(--u) * -3) rgba(6, 135, 255, 0.32)',
      '--stepper-tile': 'linear-gradient(180deg, #154476 0%, #0c2a4d 100%)',
      '--stepper-tile-edge': 'rgba(92, 178, 255, 0.42)',
      '--stepper-tile-highlight': 'rgba(255, 255, 255, 0.1)',
      '--stepper-tile-shadow': '0 calc(var(--u) * .5) calc(var(--u) * 1.6) calc(var(--u) * -.5) rgba(6, 135, 255, 0.55)',
      '--stepper-well': 'rgba(92, 178, 255, 0.06)',
      '--stepper-track': 'rgba(92, 178, 255, 0.12)',
      '--stepper-ink': '#E6EDF6',
      '--stepper-muted': 'rgba(154, 171, 194, 0.9)',
      '--stepper-faint': 'rgba(92, 178, 255, 0.34)',
      '--stepper-hover-fill': 'rgba(92, 178, 255, 0.06)'
    },
    onStepChange: step => {
      // a typing step puts the cursor in its box once it has printed in (no page scroll: scrolling moves the camera)
      const target = step === 3 && answers.goalChoice === 'Other' ? otherIn : step === 4 ? notes : step === 5 ? (answers.name ? email : name) : null;
      if (target && !reduce()) setTimeout(() => target.focus({ preventScroll: true }), SCAN_MS * 0.6);
    },
    onFinalStepCompleted: () => {
      // only a page calling stepper.go() can get here with a required answer missing: send it back to that question
      const missing = [1, 2, 3, 5].find(step => !valid(step));
      if (missing) {
        stepper.go(missing);
        return;
      }
      submitted = true;
      const first = answers.name.split(/\s+/)[0];
      doneTitle.textContent = first ? `Thanks, ${first}.` : 'Thanks.';
      const detail = {
        'Full name': answers.name,
        Email: answers.email,
        Phone: answers.phone,
        'Training experience': answers.experience,
        'Plan interested in': answers.plan || 'Not sure yet',
        'Main goal': answers.goal,
        'Schedule, injuries, equipment, questions': answers.message,
        demo: true
      };
      console.info('[apply] demo submit, nothing sent:', detail);
      host.dispatchEvent(new CustomEvent('apply-submit', { detail, bubbles: true }));
      o.onSubmit?.(detail);
      stepper.set({ disableStepIndicators: true });
    }
  });

  // the gadget is built before sections.css may have arrived: measure again once it has
  css.then(() => requestAnimationFrame(() => stepper.relayout()));

  let cancelReveal = () => {};
  return {
    el: root,
    stepper,
    // preselect a plan exactly as a tap would: 'Silver' | 'Gold' | 'Platinum' | '' (not sure). Never moves the questionnaire
    // on (a tap doesn't either now). Returns false for an unknown name or after submit.
    setPlan(planName) {
      if (submitted) return false;
      const want = String(planName ?? '').trim().toLowerCase();
      const i = FORM.plan.options.findIndex(option => option.value.toLowerCase() === want);
      if (i < 0) return false;
      const option = FORM.plan.options[i];
      g2.buttons.forEach((b, j) => b.setAttribute('aria-checked', String(j === i)));
      answers.plan = option.value;
      answers.planChosen = true;
      stepper.refresh();
      return true;
    },
    // the heading lines roll in (Pegassi); call it when the camera arrives
    reveal() {
      cancelReveal();
      cancelReveal = lineReveal([h, lede]);
    },
    data: () => ({ ...answers, submitted }),
    destroy() {
      stopScan();
      cancelReveal();
      [otherIn, notes, name, email, phone].forEach(f => f.destroy());
      stepper.destroy();
      root.remove();
    }
  };
}

export default mountApply;
