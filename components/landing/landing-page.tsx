import Link from "next/link";
import {
  Globe2,
  Shield,
  Workflow,
  Brain,
  Users,
  Receipt,
  FileText,
  Radio,
} from "lucide-react";
import { LandingHeader } from "./landing-header";

const features = [
  {
    icon: Radio,
    title: "Real-Time Voice Translation",
    desc: "Hybrid AWS transport with Google speech, translation, and synthesis in near real time.",
  },
  {
    icon: Workflow,
    title: "Enterprise Context Awareness",
    desc: "Calls linked to prompts, tasks, contracts, workflows, and distributed Ciright objects.",
  },
  {
    icon: Shield,
    title: "Secure Global Communications",
    desc: "Authenticated KEYRA users with encrypted transport, UID/EID validation, and audit trails.",
  },
  {
    icon: Brain,
    title: "AI Indexed Call Intelligence",
    desc: "Structured dialogue, semantic mappings, and translated sentence pairs for enterprise memory.",
  },
  {
    icon: Users,
    title: "Multilingual Workflow Collaboration",
    desc: "Both parties synchronized into the same application context upon call acceptance.",
  },
  {
    icon: Receipt,
    title: "Airtime Billing & Analytics",
    desc: "Dual-sided EID billing with Google, AWS, and platform cost indexing per call.",
  },
  {
    icon: FileText,
    title: "Live Transcription",
    desc: "Timestamped, language-indexed, speaker-indexed transcripts stored in Ciright Core.",
  },
  {
    icon: Globe2,
    title: "Cross-Application Presence",
    desc: "Translation Call invites appear across all KEYRA applications when users are online.",
  },
];

export function LandingPage() {
  return (
    <>
      <LandingHeader />

      <section className="tr-hero">
        <div className="tr-container tr-hero-grid">
          <div className="tr-hero-copy">
            <p className="tr-kicker">KEYRA Translation Communication Engine</p>
            <h1>Speak Any Language. Work As One Enterprise.</h1>
            <p className="tr-hero-lead">
              KEYRA Translation enables secure real-time multilingual enterprise
              communication across every workflow, task, contract, customer, and
              application in your KEYRA world.
            </p>
            <div className="tr-hero-actions">
              <Link href="/admin/calls" className="tr-btn tr-btn-primary !text-white">
                Start Translation Call
              </Link>
              <Link href="/admin/settings" className="tr-btn tr-btn-secondary">
                Configure Languages
              </Link>
              <Link href="/admin/analytics" className="tr-btn tr-btn-ghost">
                View Live Translation Analytics →
              </Link>
            </div>
          </div>

          <div className="tr-hero-visual" aria-hidden>
            <p className="tr-kicker tr-hero-visual-kicker">Live session</p>
            <h2 className="tr-hero-visual-title">EN ↔ ES · prompt.ciright.com</h2>
            <p className="tr-hero-visual-meta">
              Authenticated · EID indexed · Context: prompt-8842
            </p>
            <div className="tr-hero-visual-panels">
              <div className="tr-hero-panel">
                <strong>Caller</strong>
                <p>&ldquo;Finalize the enterprise proposal.&rdquo;</p>
              </div>
              <div className="tr-hero-panel tr-hero-panel--translated">
                <strong>Translated</strong>
                <p>&ldquo;Finalizar la propuesta empresarial.&rdquo;</p>
              </div>
            </div>
            <div className="tr-wave">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} style={{ animationDelay: `${(i % 5) * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="tr-features">
        <div className="tr-container">
          <p className="tr-kicker">Platform capabilities</p>
          <h2 className="tr-section-title">
            The global communications fabric for KEYRA
          </h2>
          <div className="tr-features-grid">
            {features.map((f) => (
              <article key={f.title} className="tr-feature">
                <f.icon size={22} color="var(--tr-accent)" strokeWidth={1.75} />
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="tr-architecture">
        <div className="tr-container">
          <div className="tr-card">
            <p className="tr-kicker">Recommended architecture</p>
            <h2 className="tr-section-title tr-section-title--sm">
              Hybrid Model — AWS + Google
            </h2>
            <p className="tr-architecture-copy">
              AWS Chime SDK handles connection establishment, WebRTC infrastructure, and
              enterprise-grade voice transport. Google APIs power speech recognition,
              translation, synthesis, and transcript intelligence — indexed in Ciright Core
              with dual-sided airtime billing.
            </p>
          </div>
        </div>
      </section>

      <footer className="tr-footer">
        <div className="tr-container">
          <p className="tr-footer-lead">
            translate.keyra.ie transforms enterprise communications by eliminating
            language barriers across authenticated global workflows, enabling real-time
            multilingual collaboration securely indexed inside the KEYRA Ciright Core.
          </p>
          <p className="tr-footer-copy">
            © KEYRA · Ciright Engineering Integration Reference
          </p>
        </div>
      </footer>
    </>
  );
}
