import Breadcrumbs from './Breadcrumbs';
import PageHero from './PageHero';
import CoBuildWordmark from './CoBuildWordmark';
import PartnerForm from './PartnerForm';
import StructuredData from './StructuredData';

const STEPS = [
  {
    title: 'You know the industry.',
    body: "You've spent years in it — you know the workflow, the customers, and exactly where the tools available today fall short.",
  },
  {
    title: 'We build the product.',
    body: "Our team designs, builds, and maintains the software. You're not hiring a dev shop — you're getting a technical partner for this one product.",
  },
  {
    title: 'You keep a stake.',
    body: "This isn't a one-time contract. You hold equity in what we build together, and you're the one selling it into an industry you already know.",
  },
];

export default function PartnersPageContent() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      <StructuredData
        type="service"
        data={{
          name: 'Co-Build',
          description: 'Bring the industry expertise and the customers. We build the product. You keep a stake in what we ship together.',
          serviceType: 'SaaS co-build partnership',
          audienceType: 'Industry operators with a customer base',
        }}
      />
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Co-Build', href: '/partners' }]} />
      </div>

      <PageHero
        eyebrow="Co-Build"
        title={<><CoBuildWordmark /> something worth owning.</>}
        subtitle="Bring the industry expertise and the customers. We bring the engineering. You keep a stake in what we build together."
      />

      <div className="mt-16 border-t border-border">
        {STEPS.map((step, i) => (
          <div key={step.title} className="grid grid-cols-1 gap-3 border-b border-border py-8 sm:grid-cols-[80px_1fr]">
            <span className="font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="m-0 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 max-w-[640px] text-base leading-[1.6] text-ink-muted">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20">
        <div className="mb-4 font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">One example</div>
        <h2 className="m-0 max-w-[720px] text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[34px]">
          An established telehealth provider needed more than software.
        </h2>
        <p className="mt-5 max-w-[720px] text-lg leading-[1.6] text-ink-muted">
          Existing telehealth platforms were expensive, locked customers in, and only handled the
          clinical side — not the sales and marketing a growing telehealth business actually
          needs. We partnered with an established telehealth provider to build{' '}
          <strong className="font-semibold text-foreground">Medoura</strong>: a platform that runs
          both sides of the business. They brought years in the industry, existing patients, and
          a professional network to bring in early customers. Today Medoura is live, selling, and
          the partner holds a real stake in the company.
        </p>

        {/* DRAFT QUOTE — needs partner approval before publishing, see spec Open Items in
            docs/superpowers/specs/2026-09-02-site-copy-and-cobuild-design.md */}
        <blockquote className="mt-8 max-w-[640px] border-l-2 border-primary pl-6 text-lg italic leading-[1.6] text-foreground">
          &ldquo;We&apos;d tried to explain what telehealth actually needs to three different dev
          shops before this. CoFabri was the first team that built the sales side and the
          clinical side like they mattered equally.&rdquo;
          <footer className="mt-3 text-sm not-italic text-muted-foreground">— Medoura partner</footer>
        </blockquote>
      </div>

      <div className="mt-24">
        <PartnerForm />
      </div>
    </div>
  );
}
