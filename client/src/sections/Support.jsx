const supportTopics = [
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Answers to the most common delivery, payment, and account questions.',
    link: {
      label: 'Browse FAQs',
      href: '#contact'
    }
  },
  {
    id: 'shipping',
    title: 'Shipping Policy',
    description: 'Same-day delivery in Cairo & Giza. Next-day shipping across major cities.',
    link: {
      label: 'View Shipping Options',
      href: '#contact'
    }
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    description: 'Report issues within 24 hours of delivery for instant replacement or refund.',
    link: {
      label: 'Start a Return',
      href: 'mailto:support@freshmart-egypt.com'
    }
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    description: 'Understand our privacy practices, robot-assisted fulfilment, and digital services.',
    link: {
      label: 'Read Terms',
      href: 'https://freshmart-egypt.com/terms'
    }
  }
];

const Support = () => (
  <section className="support" id="support">
    <div className="container">
      <h2 className="section-title">Customer Support</h2>
      <div className="support-grid">
        {supportTopics.map(({ id, title, description, link }) => (
          <article key={id} className="support-card">
            <h3>{title}</h3>
            <p>{description}</p>
            <a href={link.href} className="support-link">
              {link.label}
            </a>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Support;


