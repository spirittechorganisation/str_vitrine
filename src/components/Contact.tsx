import { Send, Mail, MapPin, CheckCircle, LifeBuoy, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Contact() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    service: '',
    message: '',
    website: '', // honeypot anti-spam (champ caché)
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "L'envoi a échoué. Réessayez ou écrivez-nous directement par e-mail.");
      }
      setStatus('success');
      setFormState({ name: '', email: '', service: '', message: '', website: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof TypeError
          ? 'Impossible de joindre le serveur. Écrivez-nous directement à contact@spirittechrevolution.com.'
          : (err as Error).message
      );
    }
  };

  return (
    <section id="contact" className="relative py-28 lg:py-36 overflow-hidden">
      {/* Background Accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 section-mesh" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mint-300/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mint-300/30 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto section-padding" ref={sectionRef}>
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-mint-700 tracking-wider uppercase mb-4 font-mono">
            Contact
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-sage-900 leading-tight mb-6">
            Prêt à concrétiser
            <span className="gradient-text block mt-1">votre projet ?</span>
          </h2>
          <p className="text-lg text-sage-600 leading-relaxed">
            Parlons de vos ambitions. Notre équipe vous répond sous 24 heures
            avec une proposition adaptée à vos besoins.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Contact Info */}
          <div className={`lg:col-span-2 space-y-8 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="glass-card glow-card rounded-3xl p-8 space-y-6">
              <h3 className="font-display text-xl text-sage-900">Coordonnées</h3>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-mint-100 to-emerald-50 flex items-center justify-center shrink-0 shadow-md shadow-mint-200/30">
                    <Mail className="w-5 h-5 text-mint-700" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-sage-800">Contact commercial</div>
                    <a href="mailto:contact@spirittechrevolution.com" className="text-mint-700 hover:text-mint-800 transition-colors break-all">
                      contact@spirittechrevolution.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-mint-100 to-emerald-50 flex items-center justify-center shrink-0 shadow-md shadow-mint-200/30">
                    <LifeBuoy className="w-5 h-5 text-mint-700" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-sage-800">Support technique</div>
                    <a href="mailto:support@spirittechrevolution.com" className="text-mint-700 hover:text-mint-800 transition-colors break-all">
                      support@spirittechrevolution.com
                    </a>
                    <p className="text-xs text-sage-600 mt-1">Pour les clients utilisant nos solutions</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-mint-100 to-emerald-50 flex items-center justify-center shrink-0 shadow-md shadow-mint-200/30">
                    <MapPin className="w-5 h-5 text-mint-700" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-sage-800">Localisation</div>
                    <p className="text-sage-600 text-sm leading-relaxed">
                      Afrique de l'Ouest
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Note */}
            <div className="glass-card rounded-2xl p-6 border-l-4 border-mint-400 glow-card">
              <p className="text-sm text-sage-600 leading-relaxed">
                <span className="font-semibold text-sage-700">Consultation gratuite :</span>{' '}
                Premier appel de 30 minutes offert pour comprendre vos besoins
                et vous proposer la meilleure approche technique.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className={`lg:col-span-3 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '200ms' }}>
            <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 sm:p-10 space-y-6">
              {/* Honeypot anti-spam : invisible pour les humains */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="website">Ne pas remplir</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formState.website}
                  onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-sage-700">
                    Nom complet
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Jean Dupont"
                    className="w-full px-5 py-3.5 rounded-xl bg-white border border-sage-200 text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-mint-400/40 focus:border-mint-300 focus:bg-white/80 transition-all duration-300"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-sage-700">
                    Email professionnel
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="jean@entreprise.fr"
                    className="w-full px-5 py-3.5 rounded-xl bg-white border border-sage-200 text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-mint-400/40 focus:border-mint-300 focus:bg-white/80 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Service */}
              <div className="space-y-2">
                <label htmlFor="service" className="text-sm font-medium text-sage-700">
                  Service souhaité
                </label>
                <select
                  id="service"
                  value={formState.service}
                  onChange={(e) => setFormState({ ...formState, service: e.target.value })}
                  className="w-full px-5 py-3.5 rounded-xl bg-white border border-sage-200 text-sage-800 focus:outline-none focus:ring-2 focus:ring-mint-400/40 focus:border-mint-300 focus:bg-white/80 transition-all duration-300 appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23788763' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.2em',
                  }}
                >
                  <option value="">Sélectionnez un service</option>
                  <option value="Solutions Sur Mesure">Solutions Sur Mesure</option>
                  <option value="Conception d'Expériences">Conception d'Expériences</option>
                  <option value="Intégration & Infrastructure">Intégration & Infrastructure</option>
                  <option value="Innovation & Transformation">Innovation & Transformation</option>
                  <option value="Support technique">Support technique</option>
                </select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-sage-700">
                  Votre message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  placeholder="Décrivez votre projet, vos objectifs et vos contraintes..."
                  className="w-full px-5 py-3.5 rounded-xl bg-white border border-sage-200 text-sage-800 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-mint-400/40 focus:border-mint-300 focus:bg-white/80 transition-all duration-300 resize-none"
                />
              </div>

              {status === 'error' && (
                <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn-primary w-full !py-4 text-base disabled:opacity-70 disabled:cursor-wait"
              >
                {status === 'sending' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours…
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Message envoyé ! Réponse sous 24 h.
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
