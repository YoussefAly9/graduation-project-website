import { NavLink } from 'react-router-dom';

const navLinks = [
  { id: 'home', href: '/', label: 'Home' },
  { id: 'products', href: '/shop', label: 'Products' },
  { id: 'orders', href: '/orders', label: 'Orders' },
  { id: 'about', href: '/about', label: 'About' }
];

const Navbar = () => (
  <nav className="navbar">
    <div className="container">
      <ul className="nav-links">
        {navLinks.map((link) => (
          <li key={link.id}>
            <NavLink 
              to={link.href}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  </nav>
);

export default Navbar;

