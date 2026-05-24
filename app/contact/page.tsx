import { ContactForm } from '@/components/contact-form';

export default function Contact() {
  return (
    <div className="bg-[#f8f7f3] text-neutral-950">
      <section className="app-container grid gap-10 py-12 sm:py-16 lg:grid-cols-[.85fr_1.15fr] lg:py-24">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="page-title">Let’s build reliable infrastructure</h1>
          <p className="lead">Reach out for cloud engineering, CMS builds, deployment systems, or production debugging work.</p>
          <div className="mt-10 grid gap-4 border-l-2 border-neutral-950 pl-6 text-neutral-700">
            <p><span className="font-black text-neutral-950">Email:</span> mjules.tek@gmail.com</p>
            <p><span className="font-black text-neutral-950">Focus:</span> Next.js, AWS, DevOps, CMS, CI/CD</p>
          </div>
        </div>
        <ContactForm />
      </section>
    </div>
  );
}
