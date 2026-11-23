import { Bot, CornerDownLeft, LoaderCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { aqiBand } from '../domain/aqi';
import type { Household, Recommendation } from '../domain/recommendations';
import { localizedRecommendation } from '../i18n';
import type { Language } from '../i18n';
import { askAssistant, type AssistantContext } from '../services/api';
import type { AirQuality } from '../types';

type Message = { role: 'user' | 'assistant'; text: string; ai?: boolean };
const examples = {
  en: ['Can my child play outside today?', 'How can I improve bedroom air?', 'Is cycling better than driving today?'],
  hi: ['क्या मेरा बच्चा आज बाहर खेल सकता है?', 'मैं बेडरूम की हवा कैसे बेहतर करूँ?', 'आज साइकिल चलाना बेहतर है या कार?'],
};

export function Assistant({ air, household, recommendation, language, activity = 'routine' }: { air: AirQuality | null; household: Household; recommendation: Recommendation; language: Language; activity?: 'routine' | 'vigorous' }) {
  const localized = localizedRecommendation(recommendation, air?.aqi, language);
  const category = aqiBand(air?.aqi)?.category ?? 'unavailable';
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: language === 'hi' ? 'नमस्ते। मैं उपलब्ध वायु गुणवत्ता और आपकी पसंद के आधार पर सामान्य सुझाव दे सकता हूँ। मैं चिकित्सकीय सलाह नहीं देता।' : 'Hi, I can help translate the available air-quality context into practical steps. I offer general environmental guidance, not medical advice.' }]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  async function submit(text = question) {
    const q = text.trim();
    if (!q || loading) return;
    setMessages((old) => [...old, { role: 'user', text: q }]);
    setQuestion('');
    setLoading(true);
    setNotice('');
    try {
      const context: AssistantContext = {
        location: air?.place.name ?? 'unknown',
        aqi: air?.aqi ?? null,
        category: air?.aqi == null ? category : `${category} (${Math.round(air.aqi)} U.S. AQI)`,
        dataKind: air?.dataKind ?? 'unavailable',
        measurementTime: air?.timestamps.current ?? null,
        household,
        deterministicAction: localized.action,
        activity,
      };
      const result = await askAssistant({ question: q, language, context });
      const answer = result.answer;
      if (answer) {
        setMessages((old) => [...old, { role: 'assistant', text: answer, ai: true }]);
      } else {
        setMessages((old) => [...old, { role: 'assistant', text: localized.action }]);
        setNotice(result.notice ?? (language === 'hi' ? 'AI अनुपलब्ध है; नियम-आधारित सुझाव दिखाया गया है।' : 'AI is unavailable; the deterministic recommendation is shown.'));
      }
    } catch {
      setMessages((old) => [...old, { role: 'assistant', text: localized.action }]);
      setNotice(language === 'hi' ? 'AI अस्थायी रूप से अनुपलब्ध है; नियम-आधारित सुझाव दिखाया गया है।' : 'The AI service is unavailable; deterministic guidance is shown.');
    } finally {
      setLoading(false);
    }
  }

  const privacyNotice = language === 'hi'
    ? 'भेजने पर आपका सवाल और चुना हुआ संदर्भ (स्थान, उपलब्ध AQI, घरेलू पसंद और नियम-आधारित सुझाव) कॉन्फ़िगर की गई AI सेवा को भेजे जाते हैं। AirWise चैट सहेजता नहीं है; निजी चिकित्सकीय जानकारी साझा न करें।'
    : 'When you submit, your question and selected context (location, available AQI, household preference, activity, and rules-based precaution) are sent to the configured AI service. AirWise does not save chat; avoid sharing personal medical details.';

  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">AIRWISE ASSISTANT</p>
          <h1>Ask the air, clearly.</h1>
          <p>Get practical help grounded in the selected location and household context.</p>
        </div>
        <span className="ai-pill"><Sparkles size={15} /> Context-aware</span>
      </div>
      <div className="card assistant-safety-guidance" role="note" aria-label={language === 'hi' ? 'नियम-आधारित सावधानी' : 'Rules-based precaution'}>
        <strong>{language === 'hi' ? 'नियम-आधारित सावधानी — AI उत्तर से अलग, हमेशा लागू' : 'Rules-based precaution — applies regardless of the AI answer'}</strong>
        <p>{localized.action}</p>
      </div>
      <section className="assistant-layout">
        <div className="card chat-card">
          <div className="chat-head">
            <div className="assistant-avatar"><Bot size={20} /></div>
            <div><strong>AirWise AI</strong><span>Environmental guide · not medical advice</span></div>
            <span className="online-mark">● Ready</span>
          </div>
          <div className="chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`chat-row ${message.role}`}>
                <div className="chat-avatar">{message.role === 'assistant' ? <Bot size={17} /> : 'You'}</div>
                <div className="chat-bubble">
                  <p>{message.text}</p>
                  {message.ai && <small>AI-generated explanation · based on context shown</small>}
                </div>
              </div>
            ))}
            {loading && <div className="chat-row assistant"><div className="chat-avatar"><Bot size={17} /></div><div className="chat-bubble loading-bubble"><LoaderCircle className="spin" size={16} /> Checking your context…</div></div>}
          </div>
          {notice && <p className="chat-notice" role="status">{notice}</p>}
          <form className="chat-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <label className="sr-only" htmlFor="question">Ask a question</label>
            <textarea id="question" rows={2} maxLength={500} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={language === 'hi' ? 'अपना सवाल लिखें…' : 'Ask about today’s air or your routine…'} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit(); } }} />
            <button type="submit" className="send-button" disabled={!question.trim() || loading} aria-label="Send question"><CornerDownLeft size={18} /></button>
          </form>
          <p className="chat-foot" role="note">{privacyNotice}</p>
        </div>
        <aside className="assistant-side">
          <div className="card context-card">
            <p className="eyebrow">CONTEXT IN USE</p>
            <h2>What AirWise knows</h2>
            <dl>
              <dt>Location</dt><dd>{air?.place.name ?? 'Not selected'}</dd>
              <dt>Outdoor air</dt><dd>{air?.aqi == null ? 'Unavailable' : `${Math.round(air.aqi)} U.S. AQI`}</dd>
              <dt>Household preference</dt><dd>{household.replace('-', ' ')}</dd>
              <dt>Activity</dt><dd>{activity}</dd>
            </dl>
            <p className="fineprint">No indoor sensor readings or personal health records are collected.</p>
          </div>
          <div className="card prompt-card">
            <p className="eyebrow">TRY ASKING</p>
            {examples[language].map((example) => <button key={example} onClick={() => void submit(example)}>{example}<span>↗</span></button>)}
          </div>
        </aside>
      </section>
    </div>
  );
}
