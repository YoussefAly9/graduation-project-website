import Support from '@/sections/Support.jsx';

/**
 * AboutPage Component
 * About the company, support, and contact information
 */
function AboutPage() {
  return (
    <div className="page-about">
      <div className="about-header">
        <div className="container">
          <h1 className="page-title">About FreshMart</h1>
          <p className="page-subtitle">
            Egypt's first robot-assisted grocery delivery service
          </p>
        </div>
      </div>

      <div className="about-content">
        <div className="container">
          <div className="about-grid">
            <div className="about-card">
              <div className="card-icon">🤖</div>
              <h3>Robot-Assisted Fulfillment</h3>
              <p>
                Our advanced robotic system with YOLOv8 computer vision ensures accurate picking 
                and fast delivery of your groceries.
              </p>
            </div>

            <div className="about-card">
              <div className="card-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>
                Choose from standard, express, or scheduled delivery options. 
                Get your groceries delivered within 30 minutes with our express service.
              </p>
            </div>

            <div className="about-card">
              <div className="card-icon">🥬</div>
              <h3>Fresh Products</h3>
              <p>
                We source the freshest fruits, vegetables, dairy, and essentials from 
                trusted suppliers across Egypt.
              </p>
            </div>

            <div className="about-card">
              <div className="card-icon">📱</div>
              <h3>Progressive Web App</h3>
              <p>
                Install our app for offline access, faster loading, and an app-like experience 
                on any device.
              </p>
            </div>

            <div className="about-card">
              <div className="card-icon">🌙</div>
              <h3>Dark Mode</h3>
              <p>
                Comfortable shopping experience day or night with our built-in dark mode toggle.
              </p>
            </div>

            <div className="about-card">
              <div className="card-icon">♿</div>
              <h3>Accessible for All</h3>
              <p>
                Keyboard navigation, screen reader support, and inclusive design for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Support />

      <style>{`
        .page-about {
          animation: fadeIn 0.4s ease-out;
        }

        .about-header {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          padding: 60px 0 40px;
          margin-bottom: 60px;
        }

        .page-title {
          font-size: 2.5rem;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .page-subtitle {
          font-size: 1.1rem;
          opacity: 0.95;
        }

        .about-content {
          padding: 0 0 60px;
        }

        .about-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
        }

        .about-card {
          background: var(--bg-primary);
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 2px 8px var(--shadow);
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .about-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px var(--shadow-lg);
        }

        .card-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .about-card h3 {
          font-size: 1.3rem;
          margin-bottom: 12px;
          color: var(--text-primary);
        }

        .about-card p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .about-header {
            padding: 40px 0 30px;
          }

          .page-title {
            font-size: 2rem;
          }

          .about-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .about-card {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}

export default AboutPage;
