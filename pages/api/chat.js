// pages/api/chat.js
import {
  FLOW_VERSION,
  QUESTIONS,
  getStepsFor,
  safePickOption,
  parseContact,
} from "../../lib/questions";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { message, state } = req.body || {};
  const nextState = state && typeof state === "object" ? state : { v: FLOW_VERSION, stepIndex: 0, answers: {} };

  if (nextState.v !== FLOW_VERSION) {
    // reset if version mismatch
    nextState.v = FLOW_VERSION;
    nextState.stepIndex = 0;
    nextState.answers = {};
  }

  // Determine current flow steps
  const location = nextState.answers.location_status || null;
  const steps = getStepsFor(location || "Offshore"); // temporary until Q0 answered

  // If we have an incoming message, save it to the previous question
  const prevStepKey = steps[nextState.stepIndex - 1];
  if (message && prevStepKey) {
    const q = QUESTIONS[prevStepKey];
    const key = q.key;

    // Normalize + parse
    let value = message;

    if (prevStepKey === "contact") {
      const { full_name, email } = parseContact(message);
      nextState.answers.full_name = full_name;
      nextState.answers.email = email;
    } else {
        if (q.normalize) {
          value = q.normalize(message); // normalize RAW input
}       else if (q.options) {
          value = safePickOption(message, q.options);
}
        nextState.answers[key] = value;

    }

    // Special: after location_status answered, recompute steps and fix stepIndex mapping
    if (prevStepKey === "location_status") {
      const loc = nextState.answers.location_status || "Offshore";
      const newSteps = getStepsFor(loc);

      // We just answered step 0. stepIndex already points to 1, so it's fine.
      // But ensure no invalid keys remain.
      // If switching to Onshore, remove offshore-only fields (country/start_timeline etc.)
      if (loc === "Onshore") {
        delete nextState.answers.country;
        delete nextState.answers.start_timeline;
      } else {
        delete nextState.answers.visa_expiry;
      }
    }
  }

  // Recompute steps after any update
  const steps2 = getStepsFor(nextState.answers.location_status || "Offshore");

  // If done?
  if (nextState.stepIndex >= steps2.length) {
    return res.status(200).json({
      reply: "Thanks — that’s all I need. Submitting your details now…",
      done: true,
      state: nextState,
      answers: nextState.answers,
    });
  }

  // Ask next question
  const stepKey = steps2[nextState.stepIndex];
  const q = QUESTIONS[stepKey];

  // Advance stepIndex for next call
  const outgoingState = {
    ...nextState,
    stepIndex: nextState.stepIndex + 1,
  };

  return res.status(200).json({
    reply: q.prompt,
    done: false,
    state: outgoingState,
  });
}
