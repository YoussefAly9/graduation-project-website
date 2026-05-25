import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';

const socialLinks = [
  { id: 'facebook', icon: FaFacebookF, href: 'https://www.facebook.com', label: 'Facebook' },
  { id: 'twitter', icon: FaTwitter, href: 'https://www.twitter.com', label: 'Twitter' },
  { id: 'instagram', icon: FaInstagram, href: 'https://www.instagram.com', label: 'Instagram' },
  { id: 'youtube', icon: FaYoutube, href: 'https://www.youtube.com', label: 'YouTube' }
];

const quickLinks = [
  { id: 'home', label: 'Home', href: '#hero' },
  { id: 'categories', label: 'Categories', href: '#categories' },
  { id: 'featured', label: 'Featured', href: '#featured-products' },
  { id: 'popular', label: 'Popular', href: '#popular-products' },
  { id: 'inventory', label: 'All Products', href: '#inventory' },
  { id: 'support', label: 'Support', href: '#support' }
];

const customerServiceLinks = [
  { id: 'faq', label: 'FAQ', href: '#support' },
  { id: 'shipping', label: 'Shipping Policy', href: '#support' },
  { id: 'returns', label: 'Returns & Refunds', href: '#support' },
  { id: 'terms', label: 'Terms of Service', href: 'https://freshmart-egypt.com/terms' }
];

const Footer = () => (
  <footer className="footer" id="contact">
    <div className="container">
      <div className="footer-content">
        <div className="footer-column">
          <h3>FreshMart Egypt</h3>
          <p>
            Your one-stop online supermarket for all your grocery needs in Egypt. Fresh products delivered fast across
            Cairo, Alexandria, and other major cities.
          </p>
          <div className="social-icons">
            {socialLinks.map(({ id, icon: Icon, href, label }) => (
              <a key={id} href={href} aria-label={label} target="_blank" rel="noreferrer">
                <Icon aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <div className="footer-column">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            {quickLinks.map(({ id, label, href }) => (
              <li key={id}>
                <a href={href}>{label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-column">
          <h3>Customer Service</h3>
          <ul className="footer-links">
            {customerServiceLinks.map(({ id, label, href }) => (
              <li key={id}>
                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-column">
          <h3>Contact Info</h3>
          <ul className="footer-links">
            <li>
              <FaMapMarkerAlt aria-hidden="true" /> 123 Shopping St, Cairo
            </li>
            <li>
              <FaPhone aria-hidden="true" />
              <a href="tel:+201234567890"> +20 123 456 7890</a>
            </li>
            <li>
              <FaEnvelope aria-hidden="true" />
              <a href="mailto:info@freshmart-egypt.com"> info@freshmart-egypt.com</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="copyright">
        <p>&copy; {new Date().getFullYear()} FreshMart Egypt. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;

