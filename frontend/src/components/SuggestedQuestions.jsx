import React from "react";
import { BookOpen, Calendar, DollarSign, FlaskConical, Building2 } from "lucide-react";

const SUGGESTIONS = [
  {
    category: "Syllabus",
    icon: BookOpen,
    color: "#6366f1",
    query: "What are the subjects and elective courses in the AIML 3rd year syllabus?",
  },
  {
    category: "Academic Calendar",
    icon: Calendar,
    color: "#06b6d4",
    query: "When do the Odd Semester exams and mid-term assessments start for 2025-26?",
  },
  {
    category: "Fees & Placements",
    icon: DollarSign,
    color: "#10b981",
    query: "What is the fee structure under the Fee Regulating Authority (FRA)?",
  },
  {
    category: "Lab Manuals",
    icon: FlaskConical,
    color: "#a855f7",
    query: "What experiments and tools are covered in the Cloud Computing and DevOps lab manuals?",
  },
  {
    category: "College Info",
    icon: Building2,
    color: "#f59e0b",
    query: "Summarize the college NIRF ranking and AICTE mandatory disclosure details.",
  },
];

export default function SuggestedQuestions({ onSelectQuestion }) {
  return (
    <div className="suggested-grid">
      {SUGGESTIONS.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div
            key={index}
            className="suggested-card"
            onClick={() => onSelectQuestion(item.query)}
          >
            <div className="suggested-card-header" style={{ color: item.color }}>
              <IconComponent size={16} />
              <span>{item.category}</span>
            </div>
            <div className="suggested-card-text">{item.query}</div>
          </div>
        );
      })}
    </div>
  );
}
