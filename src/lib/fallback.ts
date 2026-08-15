import type { Lesson } from "@/lib/types";

export const fallbackLesson: Lesson = {
  id: "fallback-fractions",
  mode: "board",
  title: "The Pizza That Had to Be Shared",
  subject: "Math",
  focus: "Adding fractions with the same denominator",
  childName: "Buddy",
  intro: "Hey Buddy! Let's explore fractions with a pizza that has a secret. 🍕",
  scenes: [
    {
      lines: [
        { kind: "text", text: "Your pizza is cut into 5 equal slices. It's the number BELOW the line that says how many equal pieces there are." },
        { kind: "math", latex: "\\frac{1}{5}" },
        { kind: "text", text: "The bottom number is called the DENOMINATOR. It stays the same while we add." },
      ],
    },
    {
      lines: [
        { kind: "text", text: "You eat 1 slice. Your friend eats 2 slices. Together you ate 1 + 2 slices." },
        { kind: "math", latex: "\\frac{1}{5} + \\frac{2}{5} = \\frac{3}{5}" },
        { kind: "text", text: "Same denominator (5), so we only add the top numbers. Easy, right?" },
      ],
    },
    {
      lines: [
        { kind: "text", text: "Now 3 slices are gone, and you add 1 more slice to your plate." },
        { kind: "math", latex: "\\frac{3}{5} + \\frac{1}{5}" },
        { kind: "text", text: "What will the answer be? Think: keep the bottom, add the top." },
      ],
    },
    {
      lines: [
        { kind: "text", text: "Great thinking! The bottom stays 5, and 3 + 1 = 4. So..." },
        { kind: "math", latex: "\\frac{3}{5} + \\frac{1}{5} = \\frac{4}{5}" },
        { kind: "text", text: "That's the whole idea of adding fractions with the same denominator!" },
      ],
    },
  ],
  questions: [
    {
      id: "q1",
      sceneIndex: 0,
      prompt: "When we write 1/5, what does the number 5 below the line tell us?",
      hint: "Think about how many slices the pizza was cut into.",
      deeperHint: "5 slices = the pizza is cut into 5 equal pieces. That number is the denominator.",
      answer: "the number of equal parts",
      accept: ["5 slices", "five equal parts", "the total slices", "denominator", "how many pieces"],
    },
    {
      id: "q2",
      sceneIndex: 1,
      prompt: "When adding 1/5 and 2/5, why does the bottom stay 5?",
      hint: "Did the pizza change how many slices it was cut into?",
      deeperHint: "The pizza is still cut into 5 slices. Only the amount we ate changed, so only the top number changes.",
      answer: "the denominator stays the same",
      accept: ["same denominator", "still 5 slices", "bottom stays", "pieces don't change"],
    },
    {
      id: "q3",
      sceneIndex: 2,
      prompt: "Can you solve it? Add the top numbers while keeping the bottom the same.",
      hint: "3 + 1 = ?",
      deeperHint: "3 plus 1 is 4, and the bottom stays 5.",
      answer: "4/5",
      accept: ["four fifths", "4 over 5", "four 5ths"],
    },
  ],
  reflection: "You discovered how to add fractions when the denominators match: keep the bottom, add the top. Now you're thinking like a mathematician!",
};
