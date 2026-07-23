export type SurveyQuestionType = "multiple_choice" | "short_answer" | "true_false";

export interface SurveyQuestion {
  key: string;
  type: SurveyQuestionType;
  text: string;
  options?: string[];
  /** For true_false questions. */
  correct?: "True" | "False";
  /** Explanation shown after answering a true_false. */
  explanation?: string;
  /** After a true_false is answered, optional prompt to pre-fill the chat input. */
  tryPrefill?: string;
  /** After a true_false is answered, if true, open the photo picker instead of pre-filling. */
  tryOpenPhoto?: boolean;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    key: "pay_memory_plan",
    type: "multiple_choice",
    text: "Would you pay $10/month for memory that lets you save up to 5 property folders (plus $1/month for each folder beyond 5)?",
    options: ["Yes", "No", "Depends on price"],
  },
  {
    key: "pay_paperwork_addon",
    type: "multiple_choice",
    text: "If you already had the $10/month memory plan, would you pay $10 to have a listing's paperwork filled out for you?",
    options: ["Yes", "No", "Maybe"],
  },
  {
    key: "one_thing_more_useful",
    type: "short_answer",
    text: "What's one thing that would make AskStu more useful to you?",
  },
  {
    key: "rate_askstu",
    type: "multiple_choice",
    text: "How would you rate AskStu so far?",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    key: "answer_accuracy",
    type: "multiple_choice",
    text: "How accurate did today's answer feel?",
    options: ["Very accurate", "Mostly accurate", "Not sure"],
  },
  {
    key: "confidence",
    type: "multiple_choice",
    text: "How confident do you feel in Stu's answers so far?",
    options: ["Very confident", "Fairly confident", "Still deciding"],
  },
  {
    key: "ontario_specific",
    type: "multiple_choice",
    text: "Does Stu feel like it actually understands Ontario-specific rules, not just general advice?",
    options: ["Yes, clearly", "Somewhat", "Not yet"],
  },
  {
    key: "double_check",
    type: "short_answer",
    text: "Anything Stu said today you'd want double-checked or explained further?",
  },
  {
    key: "trust_over_time",
    type: "multiple_choice",
    text: "Do you expect to trust Stu more the more you use it?",
    options: ["Already do", "Expect to over time", "Not sure"],
  },
  {
    key: "findability",
    type: "multiple_choice",
    text: "How easy was it to find what you were looking for?",
    options: ["Easy", "OK", "Difficult"],
  },
  {
    key: "photo_feature",
    type: "multiple_choice",
    text: "Was the photo feature easy to use?",
    options: ["Yes", "No", "Haven't tried it"],
  },
  {
    key: "chat_speed",
    type: "multiple_choice",
    text: "Did the chat feel fast enough?",
    options: ["Yes", "A bit slow", "Too slow"],
  },
  {
    key: "confusing",
    type: "short_answer",
    text: "What, if anything, was confusing about using AskStu?",
  },
  {
    key: "device",
    type: "multiple_choice",
    text: "Do you use AskStu more on your phone or your computer?",
    options: ["Phone", "Computer", "Both equally"],
  },
  {
    key: "real_situation",
    type: "multiple_choice",
    text: "Did Stu actually help with a real situation today?",
    options: ["Yes", "No", "Just browsing"],
  },
  {
    key: "recommend",
    type: "multiple_choice",
    text: "Would you recommend AskStu to another agent?",
    options: ["Yes", "Maybe", "No"],
  },
  {
    key: "frequency",
    type: "multiple_choice",
    text: "How often do you think you'd use something like this?",
    options: ["Daily", "A few times a week", "Occasionally", "Rarely"],
  },
  {
    key: "most_useful",
    type: "short_answer",
    text: "What's the most useful thing Stu has told you so far?",
  },
  {
    key: "saves_time",
    type: "multiple_choice",
    text: "Does AskStu save you time compared to how you'd normally figure this out?",
    options: ["A lot", "A little", "Not really"],
  },
  {
    key: "couldnt_answer",
    type: "short_answer",
    text: "What's something you asked that Stu couldn't answer well?",
  },
  {
    key: "board_rules",
    type: "multiple_choice",
    text: "Would rules specific to your own board (not just TRREB) be useful?",
    options: ["Yes", "No", "Not sure"],
  },
  {
    key: "memory_want",
    type: "multiple_choice",
    text: "Would you want AskStu to remember past conversations?",
    options: ["Yes", "No", "Depends on cost"],
  },
  {
    key: "weekly_feature",
    type: "short_answer",
    text: "What feature would make you use AskStu every week?",
  },
  {
    key: "integrations",
    type: "multiple_choice",
    text: "Would you want AskStu inside tools you already use, like your CRM or email?",
    options: ["Yes", "No", "Maybe"],
  },
  {
    key: "tf_compliance",
    type: "true_false",
    text: "You can ask Stu about compliance topics like TRESA or RECO rules.",
    correct: "True",
    explanation: "True. Try it:",
    tryPrefill: "What's the deposit timeline rule?",
  },
  {
    key: "tf_photo",
    type: "true_false",
    text: "You can upload a photo of something in a house and ask what it is.",
    correct: "True",
    explanation: "True, that's the camera button next to the chat box.",
    tryOpenPhoto: true,
  },
  {
    key: "tf_confident",
    type: "true_false",
    text: "Stu will always give a confident, definite answer, even if something might have changed recently.",
    correct: "False",
    explanation:
      "False, on purpose. Stu will tell you plainly when something's worth double-checking instead of guessing.",
  },
  {
    key: "tf_escalate",
    type: "true_false",
    text: "Stu can help you decide if something should go to your broker or a lawyer instead.",
    correct: "True",
    explanation: "True. Try it:",
    tryPrefill: "Is this something I should loop my broker in on?",
  },
  {
    key: "tf_account",
    type: "true_false",
    text: "You need an account to use Stu.",
    correct: "False",
    explanation: "False, it's free, no account needed.",
  },
];

export function pickRandomSurveyQuestion(): SurveyQuestion {
  const i = Math.floor(Math.random() * SURVEY_QUESTIONS.length);
  return SURVEY_QUESTIONS[i]!;
}
