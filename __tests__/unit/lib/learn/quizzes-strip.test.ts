import { describe, expect, it } from "vitest"

import { stripQuizAnswers, type QuizQuestion } from "@/lib/learn/quizzes"

describe("stripQuizAnswers (F21)", () => {
  const question: QuizQuestion = {
    id: "q1",
    quiz_id: "quiz1",
    question: "What is 2+2?",
    question_type: "multiple_choice",
    options: ["3", "4", "5"],
    correct_answer: "4",
    explanation: "Basic arithmetic.",
    difficulty: 1,
    order_index: 0,
  }

  it("removes correct_answer and explanation", () => {
    const [safe] = stripQuizAnswers([question])
    expect(safe).not.toHaveProperty("correct_answer")
    expect(safe).not.toHaveProperty("explanation")
  })

  it("keeps everything a client needs to render the quiz", () => {
    const [safe] = stripQuizAnswers([question])
    expect(safe).toEqual({
      id: "q1",
      quiz_id: "quiz1",
      question: "What is 2+2?",
      question_type: "multiple_choice",
      options: ["3", "4", "5"],
      difficulty: 1,
      order_index: 0,
    })
  })

  it("does not mutate its input", () => {
    const copy = { ...question }
    stripQuizAnswers([question])
    expect(question).toEqual(copy)
  })

  it("handles an empty list", () => {
    expect(stripQuizAnswers([])).toEqual([])
  })
})
