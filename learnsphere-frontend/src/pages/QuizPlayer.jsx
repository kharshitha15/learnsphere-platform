import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const QuizPlayer = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await api.get(`/quizzes/${quizId}/questions`);
        setQuestions(response.data || []);
      } catch (error) {
        console.error('Error fetching quiz questions', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [quizId, user, navigate]);

  const handleOptionSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm('You have unanswered questions. Submit anyway?')) return;
    }
    setSubmitting(true);
    try {
      const response = await api.post(`/quizzes/${quizId}/submit`, answers);
      setResult(response.data);
    } catch (error) {
      alert('Error submitting quiz');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#f5f7f8]">
        <div className="w-10 h-10 border-3 border-[#0056d2]/20 border-t-[#0056d2] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-[#636363]">Loading assessment...</p>
      </div>
    );
  }

  if (result) {
    const passed = result.passed;
    return (
      <div className="min-h-[60vh] bg-[#f5f7f8] py-12 px-4">
        <div className="max-w-lg mx-auto bg-white border border-[#e5e5e5] rounded p-8 text-center shadow-sm">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
            {passed ? '✓' : '✗'}
          </div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">
            {passed ? 'Congratulations!' : 'Keep Learning'}
          </h2>
          <p className="text-[#636363] mb-6">
            {passed
              ? 'You passed this module assessment.'
              : 'Review the course material and try again to improve your score.'}
          </p>
          <div className={`text-5xl font-black mb-2 ${passed ? 'text-[#1a7f37]' : 'text-[#d41111]'}`}>
            {Math.round(result.percentage)}%
          </div>
          <p className="text-sm text-[#636363] mb-8">
            Score: {result.score} / {result.total} correct answers
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!passed && (
              <button
                type="button"
                onClick={() => { setResult(null); setCurrentIndex(0); setAnswers({}); }}
                className="btn-c-secondary"
              >
                Retry Quiz
              </button>
            )}
            <Link to="/dashboard?tab=mylearning" className="btn-c-primary inline-block text-center no-underline">
              Back to My Learning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f7f8]">
        <p className="text-[#636363]">No questions found for this quiz.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#f5f7f8]">
      {/* Quiz header bar */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-[#636363] uppercase font-semibold tracking-wide">Graded Assessment</p>
            <h1 className="text-base font-bold text-[#1a1a1a]">Module Knowledge Check</h1>
          </div>
          <span className="text-sm font-semibold text-[#636363]">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="max-w-3xl mx-auto mt-3">
          <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
            <div className="h-full bg-[#0056d2] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Question dots */}
      <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap gap-2 justify-center">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`quiz-progress-dot ${i === currentIndex ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
            title={`Question ${i + 1}`}
            aria-label={`Go to question ${i + 1}`}
          />
        ))}
      </div>

      {/* Question card */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-white border border-[#e5e5e5] rounded shadow-sm p-6 sm:p-8">
          <p className="text-xs font-semibold text-[#0056d2] uppercase tracking-wide mb-2">
            Question {currentIndex + 1}
          </p>
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-6 leading-relaxed">
            {currentQ.text}
          </h2>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((opt) => {
              const optionText = currentQ[`option${opt}`];
              if (!optionText) return null;
              const selected = answers[currentQ.id] === opt;
              return (
                <label
                  key={opt}
                  className={`flex items-start gap-3 p-4 border rounded cursor-pointer transition ${
                    selected
                      ? 'border-[#0056d2] bg-[#e8f0fe]'
                      : 'border-[#e5e5e5] hover:border-[#0056d2]/50 hover:bg-[#f5f7f8]'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQ.id}`}
                    value={opt}
                    checked={selected}
                    onChange={() => handleOptionSelect(currentQ.id, opt)}
                    className="mt-0.5 accent-[#0056d2]"
                  />
                  <span className="text-sm text-[#1a1a1a] leading-relaxed">
                    <span className="font-bold text-[#636363] mr-2">{opt}.</span>
                    {optionText}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 text-sm font-bold text-[#0056d2] border border-[#0056d2] rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#e8f0fe] transition"
          >
            ← Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="btn-c-primary"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-c-primary disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : `Submit Quiz (${answeredCount}/${questions.length})`}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-[#636363] mt-4">
          Passing score: 70% · {answeredCount} of {questions.length} answered
        </p>
      </div>
    </div>
  );
};

export default QuizPlayer;
