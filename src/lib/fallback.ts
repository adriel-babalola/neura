import type { Lesson } from "@/lib/types";

export const fallbackLesson: Lesson = {
  id: "fallback-fractions-v2",
  mode: "board",
  title: "The Pizza Tournament: Fraction Showdown",
  subject: "Math",
  focus: "Adding fractions with the same denominator",
  childName: "Buddy",
  intro: "Hey Buddy! Imagine you're running a pizza tournament where teams compete by eating the most slices. Let's figure out the math behind who wins!",
  scenes: [
    {
      lines: [
        { kind: "text", text: "Picture a pizza cut into 8 perfectly equal slices.", color: "text-chalk" },
        { kind: "text", text: "When we write a fraction, it's just a way of saying:", color: "text-chalk" },
        { kind: "math", latex: "\\frac{\\text{slices we took}}{\\text{total slices in the pizza}}" },
        { kind: "text", text: "The bottom number is called the DENOMINATOR.", color: "text-chalk-y" },
        { kind: "text", text: "It tells us how many equal pieces the whole thing was divided into.", color: "text-chalk" },
      ],
    },
    {
      lines: [
        { kind: "text", text: "Round 1 of the tournament! You grab 2 slices out of 8.", color: "text-chalk" },
        { kind: "math", latex: "\\frac{2}{8}" },
        { kind: "text", text: "Your teammate grabs 3 slices out of the same pizza.", color: "text-chalk" },
        { kind: "math", latex: "\\frac{3}{8}" },
        { kind: "text", text: "Together, your team ate... let's figure it out!", color: "text-chalk-b" },
      ],
    },
    {
      lines: [
        { kind: "text", text: "Here's the key insight: the pizza didn't change!", color: "text-chalk-y" },
        { kind: "text", text: "It's still 8 slices total. Only the eaten slices add up.", color: "text-chalk" },
        { kind: "math", latex: "\\frac{2}{8} + \\frac{3}{8} = \\frac{2 + 3}{8} = \\frac{5}{8}" },
        { kind: "text", text: "The rule: same denominator means keep the bottom, add the top!", color: "text-chalk-y" },
      ],
    },
    {
      lines: [
        { kind: "divider" },
        { kind: "text", text: "Watch out! Here's where people mess up.", color: "text-chalk-p" },
        { kind: "text", text: "Some people add BOTH numbers:", color: "text-chalk-p" },
        { kind: "math", latex: "\\frac{2}{8} + \\frac{3}{8} \\neq \\frac{5}{16} \\quad \\text{WRONG!}" },
        { kind: "text", text: "Think about it: you didn't cut the pizza into 16 slices!", color: "text-chalk" },
        { kind: "text", text: "The pizza is still 8 slices. Only the eaten part changes.", color: "text-chalk-b" },
      ],
    },
    {
      lines: [
        { kind: "divider" },
        { kind: "text", text: "Round 2! The rival team attacks a new pizza (also 8 slices).", color: "text-chalk" },
        { kind: "text", text: "Player A eats 1 slice, Player B eats 4 slices.", color: "text-chalk" },
        { kind: "math", latex: "\\frac{1}{8} + \\frac{4}{8} = \\frac{1 + 4}{8} = \\frac{5}{8}" },
        { kind: "text", text: "It's a tie! Both teams ate 5 out of 8 slices.", color: "text-chalk-b" },
      ],
    },
    {
      lines: [
        { kind: "text", text: "Sudden death round! Your team gets one more chance.", color: "text-chalk" },
        { kind: "text", text: "You eat 2 more slices from a fresh 8-slice pizza.", color: "text-chalk" },
        { kind: "text", text: "Your teammate eats 3 more. Then your sub eats 1 more.", color: "text-chalk" },
        { kind: "math", latex: "\\frac{2}{8} + \\frac{3}{8} + \\frac{1}{8} = \\frac{2 + 3 + 1}{8} = \\frac{6}{8}" },
        { kind: "text", text: "It works with 3 fractions too! Same rule, same bottom.", color: "text-chalk-y" },
      ],
    },
    {
      lines: [
        { kind: "divider" },
        { kind: "text", text: "The pattern that ALWAYS works:", color: "text-chalk-y" },
        { kind: "math", latex: "\\frac{a}{n} + \\frac{b}{n} = \\frac{a + b}{n}" },
        { kind: "text", text: "When the denominators match, just add the numerators (top numbers).", color: "text-chalk" },
        { kind: "text", text: "The denominator stays the same because the whole doesn't change!", color: "text-chalk" },
        { kind: "text", text: "You just mastered fraction addition. Tournament champion!", color: "text-chalk-b" },
      ],
    },
  ],
  questions: [
    {
      id: "q1",
      sceneIndex: 0,
      prompt: "If a pizza has 8 slices and I write 3/8, what does the 8 on the bottom tell us?",
      hint: "Think about what happened to the pizza before anyone ate it. How was it prepared?",
      deeperHint: "The pizza was CUT into 8 equal pieces. That bottom number counts total pieces.",
      answer: "how many equal pieces the pizza was cut into",
      accept: ["8 slices", "total slices", "total pieces", "how many pieces", "the whole pizza", "denominator", "equal parts"],
    },
    {
      id: "q2",
      sceneIndex: 2,
      prompt: "Your team ate 5/8. If one more teammate eats 2 slices from the same pizza, what fraction did your team eat in total?",
      hint: "Same pizza, same bottom number. What's 5 + 2?",
      deeperHint: "Keep the denominator (8). Add the numerators: 5 + 2 = 7. So it's 7/8!",
      answer: "7/8",
      accept: ["7/8", "seven eighths", "7 over 8", "seven out of eight"],
    },
    {
      id: "q3",
      sceneIndex: 3,
      prompt: "Why can't we add the denominators when adding fractions with the same bottom number?",
      hint: "Did anyone cut the pizza into more slices? Or is it the same pizza?",
      deeperHint: "The pizza is still divided into the same number of slices. Adding denominators would mean pretending we have a 16-slice pizza, which we don't!",
      answer: "because the total number of slices didn't change",
      accept: ["pizza didn't change", "same pizza", "still 8 slices", "denominator stays same", "whole doesn't change", "not more pieces"],
    },
    {
      id: "q4",
      sceneIndex: 5,
      prompt: "In a 6-slice pizza: you eat 1 slice, friend eats 2, and your dog sneaks 1. What fraction was eaten? Use the same rule!",
      hint: "The pizza has 6 slices (that's your denominator). Add up everyone's slices on top: 1 + 2 + 1 = ?",
      deeperHint: "Numerator: 1 + 2 + 1 = 4. Denominator stays 6. So the answer is 4/6.",
      answer: "4/6",
      accept: ["4/6", "four sixths", "4 over 6", "four out of six", "4 out of 6"],
    },
    {
      id: "q5",
      sceneIndex: 6,
      prompt: "Can you write the general rule? When adding fractions with the same bottom number, we keep the ___ and add the ___.",
      hint: "Which part stays the same? Which part do we combine?",
      deeperHint: "The bottom (denominator) stays put. The top numbers (numerators) get added together.",
      answer: "keep the denominator and add the numerators",
      accept: ["denominator", "bottom", "keep bottom add top", "keep the bottom", "numerators", "add the top", "add numerators"],
    },
  ],
  reflection: "You discovered the golden rule of fraction addition: when pizzas are cut the same way, just count up the slices! Next time you split anything into equal parts, you'll know exactly how to add them up like a tournament champion.",
};
